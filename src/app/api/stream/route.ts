import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import cache from "../../../cache";
import { checkRateLimit, MAX_REQUESTS } from "../../../lib/rate-limit";
import { getSystemPrompt } from "./prompt";

const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_KEY,
});

export const runtime = "edge";

export async function POST(req: Request) {
  // Check rate limit
  const rateLimitResult = await checkRateLimit();
  if (!rateLimitResult.success) {
    return rateLimitResult.response!;
  }

  const { message } = await req.json();
  console.log("Received message:", message);
  
  const [favoriteCountry, favoriteContinent, favoriteDestination] = await Promise.all([
    cache.get("favoriteCountry"),
    cache.get("favoriteContinent"),
    cache.get("favoriteDestination")
  ]);

  console.log("Cache:", {
    favoriteCountry,
    favoriteContinent,
    favoriteDestination,
  });

  const systemPrompt = getSystemPrompt(favoriteCountry || "", favoriteContinent || "", favoriteDestination || "");

  console.log("System prompt:", systemPrompt);

  try {
    const result = streamText({
      model: openaiProvider("gpt-4.1"),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      maxTokens: 500,
    });

    // Add rate limit headers to the response
    const response = result.toTextStreamResponse();
    response.headers.set("X-RateLimit-Limit", MAX_REQUESTS.toString());
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining!.toString());
    response.headers.set("X-RateLimit-Reset", rateLimitResult.reset!.toString());
    
    return response;
  } catch (error) {
    console.error("OpenAI error:", error);
    return new Response("Error communicating with OpenAI", { status: 500 });
  }
}
