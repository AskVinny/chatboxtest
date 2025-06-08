import { z } from "zod";

export const preferencesSchema = z.object({
  favoriteCountry: z
    .string()
    .min(2, "Country name must be at least 2 characters")
    .max(50, "Country name must be less than 50 characters")
    .regex(
      /^[a-zA-Z\s-]+$/,
      "Country name can only contain letters, spaces, and hyphens"
    ),
  favoriteContinent: z
    .string()
    .min(2, "Continent name must be at least 2 characters")
    .max(50, "Continent name must be less than 50 characters")
    .regex(
      /^[a-zA-Z\s-]+$/,
      "Continent name can only contain letters, spaces, and hyphens"
    ),
  favoriteDestination: z
    .string()
    .min(2, "Destination name must be at least 2 characters")
    .max(100, "Destination name must be less than 100 characters")
    .regex(
      /^[a-zA-Z\s-]+$/,
      "Destination name can only contain letters, spaces, and hyphens"
    ),
});
