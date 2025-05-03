import { WeatherMain } from '@prisma/client'; // Import enum from generated Prisma client

/**
 * Maps OpenWeatherMap weather condition codes to the WeatherMain enum.
 * See: https://openweathermap.org/weather-conditions#Weather-Condition-Codes-2
 * @param code The weather condition code from OpenWeatherMap API.
 * @returns The corresponding WeatherMain enum value.
 */
export function mapWeatherCodeToEnum(code: number): WeatherMain {
  if (code >= 200 && code < 300) {
    return WeatherMain.THUNDERSTORM;
  }
  if (code >= 300 && code < 400) {
    return WeatherMain.DRIZZLE;
  }
  if (code >= 500 && code < 600) {
    return WeatherMain.RAIN;
  }
  if (code >= 600 && code < 700) {
    return WeatherMain.SNOW;
  }
  if (code >= 700 && code < 800) {
    // Note: OpenWeatherMap codes 7xx represent various "atmosphere" conditions
    // like Mist, Smoke, Haze, Sand/Dust whirls, Fog, Sand, Dust, Ash, Squall, Tornado.
    // Mapping all to ATMOSPHERE as per schema.
    return WeatherMain.ATMOSPHERE;
  }
  if (code === 800) {
    return WeatherMain.CLEAR;
  }
  if (code > 800 && code < 900) {
    return WeatherMain.CLOUDS;
  }
  // Default or handle unknown codes if necessary
  // For now, let's default to CLEAR or throw an error if preferred
  console.warn(`Unknown weather code received: ${code}. Defaulting to CLEAR.`);
  return WeatherMain.CLEAR;
}

/**
 * Safely converts a Unix timestamp (in seconds) to a JavaScript Date object (UTC).
 * @param unixTimestamp The Unix timestamp in seconds.
 * @returns The corresponding Date object or null if the timestamp is invalid.
 */
export function unixTimestampToDate(
  unixTimestamp: number | undefined | null,
): Date | null {
  if (typeof unixTimestamp === 'number' && unixTimestamp > 0) {
    return new Date(unixTimestamp * 1000);
  }
  return null;
}
