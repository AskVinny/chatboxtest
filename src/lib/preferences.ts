import cache from "../cache";
import { z } from "zod";

export const PreferenceExtractionSchema = z.object({
  isUpdatingUserPreferences: z.boolean(),
  favoriteCountry: z.string().nullable(),
  favoriteContinent: z.string().nullable(),
  favoriteDestination: z.string().nullable(),
  invalidField: z.string().nullable(), // e.g. "favoriteCountry" if invalid
  invalidReason: z.string().nullable(), // e.g. "Invalid Continent name 'Oceania'"
});

export async function getPreferences(userId: string) {
  const [favoriteCountry, favoriteContinent, favoriteDestination] =
    await Promise.all([
      cache.get(`favoriteCountry:${userId}`),
      cache.get(`favoriteContinent:${userId}`),
      cache.get(`favoriteDestination:${userId}`),
    ]);
  return { favoriteCountry, favoriteContinent, favoriteDestination };
}

export async function setPreference(
  userId: string,
  key: string,
  value: string
) {
  await cache.set(`${key}:${userId}`, value);
}

export async function updateUserPreferences(
  userId: string,
  preferences: z.infer<typeof PreferenceExtractionSchema>
) {
  if (preferences.favoriteCountry) {
    await cache.set(`favoriteCountry:${userId}`, preferences.favoriteCountry);
  }
  if (preferences.favoriteContinent) {
    await cache.set(
      `favoriteContinent:${userId}`,
      preferences.favoriteContinent
    );
  }
  if (preferences.favoriteDestination) {
    await cache.set(
      `favoriteDestination:${userId}`,
      preferences.favoriteDestination
    );
  }
}
