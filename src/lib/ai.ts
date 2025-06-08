import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { PreferenceExtractionSchema } from "./preferences";
import { Message } from "./messages";

export async function extractPreferencesWithAI(
  messages: Message[],
  initialUserPreferences: {
    favoriteCountry: string | null;
    favoriteContinent: string | null;
    favoriteDestination: string | null;
  }
) {
  const alreadySetPreferences = Object.entries(initialUserPreferences).filter(
    ([_, value]) => value !== null
  );

  const extractionPrompt = `
${
  alreadySetPreferences.length > 0
    ? `
  The user has already set the following preferences:
  ${alreadySetPreferences.map(([key, value]) => `${key}: ${value}`).join("\n")}
`
    : ""
}

You are an assistant that extracts user preferences from conversation messages.

Analyze the conversation history and determine if the user is updating their geographic preferences in their latest message.

The preferences you should extract are:
- favoriteCountry: Any country name mentioned as preferred
- favoriteContinent: Any continent name
- favoriteDestination: Any destination (city, landmark, region) mentioned as preferred

If the user is just asking questions about geography without expressing personal preferences, set isUpdatingUserPreferences to false. 

Look at the full conversation context to understand the user's intent.
If one of the fields is invalid, set invalidField and invalidReason. Provide detailed reasoning for your answer, based on schema validation.
`;

  try {
    const result = await generateObject({
      model: createOpenAI({ apiKey: process.env.OPENAI_KEY })("gpt-4o-mini"),
      messages: [{ role: "system", content: extractionPrompt }, ...messages],
      schema: PreferenceExtractionSchema,
      temperature: 0,
    });
    return result.object;
  } catch (error) {
    console.error("Preference extraction error:", error);
    return {
      isUpdatingUserPreferences: false,
      favoriteCountry: null,
      favoriteContinent: null,
      favoriteDestination: null,
      invalidField: null,
      invalidReason: null,
    };
  }
}
