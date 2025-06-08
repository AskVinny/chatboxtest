import { getPreferences } from "@/lib/preferences";
import { getUserId } from "@/lib/user";

const suggestions = [
  "What are the most famous landmarks in my favorite country?",
  "What is the climate like in my favorite destination?",
  "Tell me about the culture of my favorite continent.",
  "What are some interesting facts about my favorite country?",
  "How does the population of my favorite destination compare to others?",
];

export async function GET(request: Request) {
  const userId = await getUserId(request);

  const preferences = await getPreferences(userId);

  return Response.json({
    ...preferences,
    suggestions,
  });
}
