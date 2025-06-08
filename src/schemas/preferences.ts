import * as yup from 'yup';

export const preferencesSchema = yup.object({
  favoriteCountry: yup
    .string()
    .required('Favorite country is required')
    .min(2, 'Country name must be at least 2 characters')
    .max(50, 'Country name must be less than 50 characters')
    .matches(/^[a-zA-Z\s-]+$/, 'Country name can only contain letters, spaces, and hyphens'),
  
  favoriteContinent: yup
    .string()
    .required('Favorite continent is required')
    .oneOf(
      ['Africa', 'Antarctica', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'],
      'Please select a valid continent: Africa, Antarctica, Asia, Europe, North America, South America, Oceania'
    ),
  
  favoriteDestination: yup
    .string()
    .required('Favorite destination is required')
    .min(2, 'Destination name must be at least 2 characters')
    .max(100, 'Destination name must be less than 100 characters')
    .matches(/^[a-zA-Z\s-]+$/, 'Destination name can only contain letters, spaces, and hyphens'),
}); 