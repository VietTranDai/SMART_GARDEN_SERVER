/**
 * Utilities for mapping WeatherAPI responses to OpenWeatherMap format
 * for use with the fallback API implementation.
 */

import { WeatherMain } from '@prisma/client';

// WeatherAPI interfaces
interface WeatherAPILocation {
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  tz_id: string;
  localtime_epoch: number;
  localtime: string;
}

interface WeatherAPICurrent {
  last_updated_epoch: number;
  last_updated: string;
  temp_c: number;
  temp_f: number;
  is_day: number;
  condition: {
    text: string;
    icon: string;
    code: number;
  };
  wind_mph: number;
  wind_kph: number;
  wind_degree: number;
  wind_dir: string;
  pressure_mb: number;
  pressure_in: number;
  precip_mm: number;
  precip_in: number;
  humidity: number;
  cloud: number;
  feelslike_c: number;
  feelslike_f: number;
  vis_km: number;
  vis_miles: number;
  uv: number;
  gust_mph: number;
  gust_kph: number;
}

interface WeatherAPIForecastDay {
  date: string;
  date_epoch: number;
  day: {
    maxtemp_c: number;
    maxtemp_f: number;
    mintemp_c: number;
    mintemp_f: number;
    avgtemp_c: number;
    avgtemp_f: number;
    maxwind_mph: number;
    maxwind_kph: number;
    totalprecip_mm: number;
    totalprecip_in: number;
    totalsnow_cm: number;
    avgvis_km: number;
    avgvis_miles: number;
    avghumidity: number;
    daily_will_it_rain: number;
    daily_chance_of_rain: number;
    daily_will_it_snow: number;
    daily_chance_of_snow: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    uv: number;
  };
  astro: {
    sunrise: string;
    sunset: string;
    moonrise: string;
    moonset: string;
    moon_phase: string;
    moon_illumination: string;
    is_moon_up: number;
    is_sun_up: number;
  };
  hour: Array<{
    time_epoch: number;
    time: string;
    temp_c: number;
    temp_f: number;
    is_day: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    wind_mph: number;
    wind_kph: number;
    wind_degree: number;
    wind_dir: string;
    pressure_mb: number;
    pressure_in: number;
    precip_mm: number;
    precip_in: number;
    humidity: number;
    cloud: number;
    feelslike_c: number;
    feelslike_f: number;
    windchill_c: number;
    windchill_f: number;
    heatindex_c: number;
    heatindex_f: number;
    will_it_rain: number;
    chance_of_rain: number;
    will_it_snow: number;
    chance_of_snow: number;
    vis_km: number;
    vis_miles: number;
    gust_mph: number;
    gust_kph: number;
    uv: number;
  }>;
}

interface WeatherAPIForecast {
  forecastday: WeatherAPIForecastDay[];
}

interface WeatherAPIResponse {
  location: WeatherAPILocation;
  current: WeatherAPICurrent;
  forecast: WeatherAPIForecast;
}

// OpenWeatherMap interfaces (simplified, matching what our service expects)
interface OWMWeather {
  id: number;
  main: string;
  description: string;
  icon: string;
}

interface OWMCurrentWeather {
  dt: number;
  sunrise?: number;
  sunset?: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  clouds: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  rain?: { '1h'?: number };
  snow?: { '1h'?: number };
  weather: OWMWeather[];
}

interface OWMHourlyForecast {
  dt: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  clouds: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  pop: number;
  rain?: { '1h'?: number };
  snow?: { '1h'?: number };
  weather: OWMWeather[];
}

interface OWMDailyForecast {
  dt: number;
  sunrise?: number;
  sunset?: number;
  moonrise?: number;
  moonset?: number;
  moon_phase?: number;
  summary?: string;
  temp: {
    day: number;
    min: number;
    max: number;
    night: number;
    eve: number;
    morn: number;
  };
  feels_like: {
    day: number;
    night: number;
    eve: number;
    morn: number;
  };
  pressure: number;
  humidity: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  weather: OWMWeather[];
  clouds: number;
  pop: number;
  rain?: number;
  snow?: number;
}

interface OWMOneCallResponse {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  current: OWMCurrentWeather;
  hourly: OWMHourlyForecast[];
  daily: OWMDailyForecast[];
}

/**
 * Maps weather condition codes from WeatherAPI to OpenWeatherMap equivalent
 * @param code WeatherAPI condition code
 * @param text WeatherAPI condition text (for additional context)
 * @returns Equivalent OpenWeatherMap weather ID
 */
export function mapWeatherAPICodeToOWMCode(code: number, text: string): number {
  // This is a simplified mapping, a full implementation would have more mappings
  const codeMap: Record<number, number> = {
    1000: 800, // Clear/Sunny -> Clear
    1003: 801, // Partly cloudy -> Few clouds
    1006: 802, // Cloudy -> Scattered clouds
    1009: 804, // Overcast -> Overcast clouds
    1030: 741, // Mist -> Mist
    1063: 500, // Patchy rain possible -> Light rain
    1066: 600, // Patchy snow possible -> Light snow
    1069: 612, // Patchy sleet possible -> Light shower sleet
    1072: 511, // Patchy freezing drizzle possible -> Freezing rain
    1087: 210, // Thundery outbreaks possible -> Light thunderstorm
    1114: 601, // Blowing snow -> Snow
    1117: 602, // Blizzard -> Heavy snow
    1135: 701, // Fog -> Mist
    1147: 741, // Freezing fog -> Fog
    1150: 300, // Patchy light drizzle -> Light intensity drizzle
    1153: 300, // Light drizzle -> Light intensity drizzle
    1168: 511, // Freezing drizzle -> Freezing rain
    1171: 511, // Heavy freezing drizzle -> Freezing rain
    1180: 500, // Patchy light rain -> Light rain
    1183: 500, // Light rain -> Light rain
    1186: 501, // Moderate rain at times -> Moderate rain
    1189: 501, // Moderate rain -> Moderate rain
    1192: 502, // Heavy rain at times -> Heavy intensity rain
    1195: 502, // Heavy rain -> Heavy intensity rain
    1198: 511, // Light freezing rain -> Freezing rain
    1201: 511, // Moderate or heavy freezing rain -> Freezing rain
    1204: 612, // Light sleet -> Light shower sleet
    1207: 613, // Moderate or heavy sleet -> Shower sleet
    1210: 600, // Patchy light snow -> Light snow
    1213: 600, // Light snow -> Light snow
    1216: 601, // Patchy moderate snow -> Snow
    1219: 601, // Moderate snow -> Snow
    1222: 602, // Patchy heavy snow -> Heavy snow
    1225: 602, // Heavy snow -> Heavy snow
    1237: 611, // Ice pellets -> Sleet
    1240: 500, // Light rain shower -> Light rain
    1243: 501, // Moderate or heavy rain shower -> Moderate rain
    1246: 503, // Torrential rain shower -> Very heavy rain
    1249: 612, // Light sleet showers -> Light shower sleet
    1252: 613, // Moderate or heavy sleet showers -> Shower sleet
    1255: 620, // Light snow showers -> Light shower snow
    1258: 621, // Moderate or heavy snow showers -> Shower snow
    1261: 611, // Light showers of ice pellets -> Sleet
    1264: 611, // Moderate or heavy showers of ice pellets -> Sleet
    1273: 200, // Patchy light rain with thunder -> Thunderstorm with light rain
    1276: 201, // Moderate or heavy rain with thunder -> Thunderstorm with rain
    1279: 620, // Patchy light snow with thunder -> Light shower snow
    1282: 622, // Moderate or heavy snow with thunder -> Heavy shower snow
  };

  return codeMap[code] || 800; // Default to clear if no mapping exists
}

/**
 * Maps WeatherAPI condition text to OpenWeatherMap weather main category
 * @param text WeatherAPI condition text
 * @returns Equivalent WeatherMain enum value
 */
export function mapWeatherAPITextToWeatherMain(text: string): WeatherMain {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('thunder')) return WeatherMain.THUNDERSTORM;
  if (lowerText.includes('drizzle')) return WeatherMain.DRIZZLE;
  if (lowerText.includes('rain')) return WeatherMain.RAIN;
  if (
    lowerText.includes('snow') ||
    lowerText.includes('blizzard') ||
    lowerText.includes('sleet') ||
    lowerText.includes('ice')
  )
    return WeatherMain.SNOW;
  if (
    lowerText.includes('mist') ||
    lowerText.includes('fog') ||
    lowerText.includes('haze') ||
    lowerText.includes('dust')
  )
    return WeatherMain.ATMOSPHERE;
  if (lowerText.includes('clear') || lowerText.includes('sunny'))
    return WeatherMain.CLEAR;
  if (lowerText.includes('cloud') || lowerText.includes('overcast'))
    return WeatherMain.CLOUDS;

  return WeatherMain.CLEAR; // Default
}

/**
 * Maps WeatherAPI icon URL to OpenWeatherMap icon code
 * @param icon WeatherAPI icon URL (e.g., "//cdn.weatherapi.com/weather/64x64/day/116.png")
 * @param isDay Whether it's day (1) or night (0)
 * @returns OpenWeatherMap icon code (e.g., "01d")
 */
export function mapWeatherAPIIconToOWMIcon(
  icon: string,
  isDay: number,
): string {
  // Extract the code number from the icon URL
  const match = icon.match(/\/(\d+)\.png$/);
  if (!match) return isDay ? '01d' : '01n'; // Default to clear day/night

  const code = parseInt(match[1], 10);
  const daySuffix = isDay ? 'd' : 'n';

  // Simple mapping of common codes
  const iconMap: Record<number, string> = {
    113: '01', // Sunny/Clear
    116: '02', // Partly cloudy
    119: '03', // Cloudy
    122: '04', // Overcast
    143: '50', // Mist
    176: '09', // Patchy rain
    179: '13', // Patchy snow
    182: '13', // Patchy sleet
    185: '09', // Patchy freezing drizzle
    200: '11', // Thundery outbreaks
    227: '13', // Blowing snow
    230: '13', // Blizzard
    248: '50', // Fog
    260: '50', // Freezing fog
    263: '09', // Patchy light drizzle
    266: '09', // Light drizzle
    281: '09', // Freezing drizzle
    284: '09', // Heavy freezing drizzle
    293: '10', // Patchy light rain
    296: '10', // Light rain
    299: '10', // Moderate rain at times
    302: '10', // Moderate rain
    305: '10', // Heavy rain at times
    308: '10', // Heavy rain
    311: '13', // Light freezing rain
    314: '13', // Moderate or heavy freezing rain
    317: '13', // Light sleet
    320: '13', // Moderate or heavy sleet
    323: '13', // Patchy light snow
    326: '13', // Light snow
    329: '13', // Patchy moderate snow
    332: '13', // Moderate snow
    335: '13', // Patchy heavy snow
    338: '13', // Heavy snow
    350: '13', // Ice pellets
    353: '09', // Light rain shower
    356: '09', // Moderate or heavy rain shower
    359: '09', // Torrential rain shower
    362: '13', // Light sleet showers
    365: '13', // Moderate or heavy sleet showers
    368: '13', // Light snow showers
    371: '13', // Moderate or heavy snow showers
    374: '13', // Light showers of ice pellets
    377: '13', // Moderate or heavy showers of ice pellets
    386: '11', // Patchy light rain with thunder
    389: '11', // Moderate or heavy rain with thunder
    392: '11', // Patchy light snow with thunder
    395: '11', // Moderate or heavy snow with thunder
  };

  const iconPrefix = iconMap[code] || '01'; // Default to clear
  return `${iconPrefix}${daySuffix}`;
}

/**
 * Converts date and time strings from WeatherAPI to Unix timestamp
 * @param dateStr Date string in the format "YYYY-MM-DD"
 * @param timeStr Optional time string in the format "HH:MM"
 * @returns Unix timestamp in seconds
 */
export function convertToUnixTimestamp(
  dateStr: string,
  timeStr?: string,
): number {
  const dateTimeStr = timeStr ? `${dateStr} ${timeStr}` : dateStr;
  return Math.floor(new Date(dateTimeStr).getTime() / 1000);
}

/**
 * Converts WeatherAPI probability to OpenWeatherMap probability
 * @param probability WeatherAPI probability (0-100)
 * @returns OpenWeatherMap probability (0-1)
 */
export function convertProbability(probability: number): number {
  return probability / 100;
}

/**
 * Maps WeatherAPI response to OpenWeatherMap One Call API format
 * @param data WeatherAPI response
 * @returns OpenWeatherMap One Call API format
 */
export function mapWeatherAPIToOWM(
  data: WeatherAPIResponse,
): OWMOneCallResponse {
  const { location, current, forecast } = data;

  // Map current weather
  const mappedCurrent: OWMCurrentWeather = {
    dt: current.last_updated_epoch,
    temp: current.temp_c,
    feels_like: current.feelslike_c,
    pressure: current.pressure_mb,
    humidity: current.humidity,
    clouds: current.cloud,
    visibility: current.vis_km * 1000, // Convert km to meters
    wind_speed: current.wind_kph / 3.6, // Convert kph to m/s
    wind_deg: current.wind_degree,
    wind_gust: current.gust_kph / 3.6, // Convert kph to m/s
    weather: [
      {
        id: mapWeatherAPICodeToOWMCode(
          current.condition.code,
          current.condition.text,
        ),
        main: mapWeatherAPITextToWeatherMain(
          current.condition.text,
        ) as unknown as string,
        description: current.condition.text.toLowerCase(),
        icon: mapWeatherAPIIconToOWMIcon(
          current.condition.icon,
          current.is_day,
        ),
      },
    ],
  };

  // Add precipitation if present
  if (current.precip_mm > 0) {
    mappedCurrent.rain = { '1h': current.precip_mm };
  }

  // Map hourly forecasts
  const mappedHourly: OWMHourlyForecast[] = [];

  // WeatherAPI provides hourly forecasts for each day
  forecast.forecastday.forEach((day) => {
    day.hour.forEach((hour) => {
      const hourForecast: OWMHourlyForecast = {
        dt: hour.time_epoch,
        temp: hour.temp_c,
        feels_like: hour.feelslike_c,
        pressure: hour.pressure_mb,
        humidity: hour.humidity,
        clouds: hour.cloud,
        visibility: hour.vis_km * 1000, // Convert km to meters
        wind_speed: hour.wind_kph / 3.6, // Convert kph to m/s
        wind_deg: hour.wind_degree,
        wind_gust: hour.gust_kph / 3.6, // Convert kph to m/s
        pop: convertProbability(
          hour.chance_of_rain > hour.chance_of_snow
            ? hour.chance_of_rain
            : hour.chance_of_snow,
        ),
        weather: [
          {
            id: mapWeatherAPICodeToOWMCode(
              hour.condition.code,
              hour.condition.text,
            ),
            main: mapWeatherAPITextToWeatherMain(
              hour.condition.text,
            ) as unknown as string,
            description: hour.condition.text.toLowerCase(),
            icon: mapWeatherAPIIconToOWMIcon(hour.condition.icon, hour.is_day),
          },
        ],
      };

      // Add precipitation if present
      if (hour.precip_mm > 0) {
        if (hour.will_it_snow) {
          hourForecast.snow = { '1h': hour.precip_mm };
        } else {
          hourForecast.rain = { '1h': hour.precip_mm };
        }
      }

      mappedHourly.push(hourForecast);
    });
  });

  // Map daily forecasts
  const mappedDaily: OWMDailyForecast[] = forecast.forecastday.map((day) => {
    // Find morning, day, evening times (approximations)
    const morning = day.hour.find((h) => h.time.endsWith('06:00'));
    const dayTime = day.hour.find((h) => h.time.endsWith('12:00'));
    const evening = day.hour.find((h) => h.time.endsWith('18:00'));
    const night = day.hour.find((h) => h.time.endsWith('00:00'));

    // Conversion helpers
    const parseTime = (timeStr: string): number => {
      // Convert time like "08:00 AM" to Unix timestamp
      return convertToUnixTimestamp(day.date, timeStr);
    };

    const dailyForecast: OWMDailyForecast = {
      dt: day.date_epoch,
      sunrise: parseTime(day.astro.sunrise),
      sunset: parseTime(day.astro.sunset),
      moonrise: parseTime(day.astro.moonrise),
      moonset: parseTime(day.astro.moonset),
      moon_phase: 0, // Need mapping for moon phase
      temp: {
        day: day.day.avgtemp_c,
        min: day.day.mintemp_c,
        max: day.day.maxtemp_c,
        night: night?.temp_c || day.day.mintemp_c,
        eve: evening?.temp_c || day.day.avgtemp_c,
        morn: morning?.temp_c || day.day.avgtemp_c,
      },
      feels_like: {
        day: dayTime?.feelslike_c || day.day.avgtemp_c,
        night: night?.feelslike_c || day.day.mintemp_c,
        eve: evening?.feelslike_c || day.day.avgtemp_c,
        morn: morning?.feelslike_c || day.day.avgtemp_c,
      },
      pressure: dayTime?.pressure_mb || 1015, // Default if not available
      humidity: day.day.avghumidity,
      wind_speed: day.day.maxwind_kph / 3.6, // Convert kph to m/s
      wind_deg: dayTime?.wind_degree || 0,
      weather: [
        {
          id: mapWeatherAPICodeToOWMCode(
            day.day.condition.code,
            day.day.condition.text,
          ),
          main: mapWeatherAPITextToWeatherMain(
            day.day.condition.text,
          ) as unknown as string,
          description: day.day.condition.text.toLowerCase(),
          icon: mapWeatherAPIIconToOWMIcon(day.day.condition.icon, 1), // Always use day icon
        },
      ],
      clouds: dayTime?.cloud || 0,
      pop: convertProbability(
        Math.max(day.day.daily_chance_of_rain, day.day.daily_chance_of_snow),
      ),
    };

    // Add precipitation if present
    if (day.day.totalprecip_mm > 0) {
      if (day.day.daily_will_it_snow) {
        dailyForecast.snow = day.day.totalprecip_mm;
      } else {
        dailyForecast.rain = day.day.totalprecip_mm;
      }
    }

    return dailyForecast;
  });

  // Construct the complete response
  return {
    lat: location.lat,
    lon: location.lon,
    timezone: location.tz_id,
    timezone_offset: 0, // We would need to calculate this
    current: mappedCurrent,
    hourly: mappedHourly,
    daily: mappedDaily,
  };
}
