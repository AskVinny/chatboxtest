import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { checkRateLimit } from "../../../lib/rate-limit";
import {
  getPreferences,
  updateUserPreferences,
} from "../../../lib/preferences";
import { extractPreferencesWithAI } from "../../../lib/ai";
import { storeMessageForUser, setMessages } from "../../../lib/messages";
import { getUserId } from "@/lib/user";
import { getSystemPrompt } from "@/lib/prompts";
import { MAX_MESSAGE_LENGTH } from "@/constants";

export const runtime = "edge";

export async function POST(req: Request) {
  // Check the rate limit
  const rateLimitResult = await checkRateLimit();
  if (!rateLimitResult.success) {
    return rateLimitResult.response!;
  }
  // Extract the message from the request
  const { message } = await req.json();

  const messageLength = message.length;

  if (messageLength > MAX_MESSAGE_LENGTH) {
    return new Response("Message too long", {
      status: 400,
      headers: { "Content-Type": "text/plain" },
    });
  }
  // in production app use auth middleware to get the user id
  const userId = await getUserId(req);

  let messages = await storeMessageForUser({
    userId,
    message,
    role: "user",
  });

  // Extract preferences and validation from the conversation
  const extraction = await extractPreferencesWithAI(messages);

  console.log("Extraction result", extraction);

  console.log("Extraction result", extraction);

  if (extraction.isUpdatingUserPreferences) {
    await updateUserPreferences(userId, extraction);
  }

  const updatedPreferences = await getPreferences(userId);

  if (!updatedPreferences.favoriteCountry) {
    const countryMsg = "What is your favorite country?";
    messages = await storeMessageForUser({
      userId,
      message: countryMsg,
      role: "assistant",
    });
    return new Response(countryMsg, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  if (!updatedPreferences.favoriteContinent) {
    const continentMsg = "What is your favorite continent?";
    messages = await storeMessageForUser({
      userId,
      message: continentMsg,
      role: "assistant",
    });
    return new Response(continentMsg, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  if (!updatedPreferences.favoriteDestination) {
    const destinationMsg = "What is your favorite destination?";
    messages = await storeMessageForUser({
      userId,
      message: destinationMsg,
      role: "assistant",
    });
    return new Response(destinationMsg, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const hasAllPreferences =
    updatedPreferences.favoriteCountry &&
    updatedPreferences.favoriteContinent &&
    updatedPreferences.favoriteDestination;

  if (hasAllPreferences && extraction.isUpdatingUserPreferences) {
    const updateMsg =
      "Preferences updated! You can now ask about world geography or update your preferences at any time.";
    messages = await storeMessageForUser({
      userId,
      message: updateMsg,
      role: "assistant",
    });
    return new Response(updateMsg, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  if (extraction.invalidField) {
    const invalidFieldMsg = `Invalid field: ${extraction.invalidField}. Reason: ${extraction.invalidReason}`;
    messages = await storeMessageForUser({
      userId,
      message: invalidFieldMsg,
      role: "assistant",
    });

    return new Response(invalidFieldMsg, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // // Normal Q&A mode
  const systemPrompt = getSystemPrompt({
    favoriteCountry: updatedPreferences.favoriteCountry,
    favoriteContinent: updatedPreferences.favoriteContinent,
    favoriteDestination: updatedPreferences.favoriteDestination,
    messages,
  });

  try {
    const result = streamText({
      model: createOpenAI({ apiKey: process.env.OPENAI_KEY })("gpt-4.1"),
      prompt: systemPrompt,
      temperature: 0.7,
      maxTokens: 500,
    });

    // Stream and persist assistant reply
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    let assistantReply = "";
    (async () => {
      try {
        for await (const chunk of result.textStream) {
          assistantReply += chunk;
          const encoder = new TextEncoder();
          await writer.write(encoder.encode(chunk));
        }
        messages.push({ role: "assistant", content: assistantReply });
        await setMessages(userId, messages);
      } catch (error) {
        console.error("Streaming error:", error);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("OpenAI error:", error);
    return new Response("Error communicating with OpenAI", { status: 500 });
  }
}
