import cache from "../../../cache";
import { preferencesSchema } from "../../../schemas/preferences";

const suggestions = [
  "What are the most famous landmarks in my favorite country?",
  "What is the climate like in my favorite destination?",
  "Tell me about the culture of my favorite continent.",
  "What are some interesting facts about my favorite country?",
  "How does the population of my favorite destination compare to others?",
];

export async function GET() {
  const [favoriteCountry, favoriteContinent, favoriteDestination] = await Promise.all([
    cache.get("favoriteCountry"),
    cache.get("favoriteContinent"),
    cache.get("favoriteDestination"),
  ]);

  return Response.json({
    favoriteCountry,
    favoriteContinent,
    favoriteDestination,
    suggestions,
  });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Validate the data
    await preferencesSchema.validate(data, { abortEarly: false });
    
    // Set the preferences
    await cache.set("favoriteCountry", data.favoriteCountry);
    await cache.set("favoriteContinent", data.favoriteContinent);
    await cache.set("favoriteDestination", data.favoriteDestination);

    return Response.json({
      favoriteCountry: await cache.get("favoriteCountry"),
      favoriteContinent: await cache.get("favoriteContinent"),
      favoriteDestination: await cache.get("favoriteDestination"),
      suggestions,
    });
  } catch (error) {
    if (error instanceof Error) {
      return Response.json(
        { error: error.message },
        { status: 422 }
      );
    }
    return Response.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
