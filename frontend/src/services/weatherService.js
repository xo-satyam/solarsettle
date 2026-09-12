/**
 * Weather API integration using Open-Meteo (free, no API key required).
 * The weather layer is isolated from the rest of SolarSettle — a failure
 * here must never take down the dashboard.
 *
 * API: https://open-meteo.com/en/docs
 */

// Default location for Greater Noida (SolarSettle's reference deployment).
const DEFAULT_LOCATION = {
  name: 'Greater Noida',
  latitude: 28.4744,
  longitude: 77.504,
  timezone: 'Asia/Kolkata',
};

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Fetch current weather + hourly + daily forecast from Open-Meteo.
 * @param {Object} coords - { latitude, longitude } (optional, defaults to Greater Noida)
 * @returns {Promise<Object>} Normalized weather data.
 */
export async function fetchWeather(coords = null, { signal } = {}) {
  const lat = coords?.latitude ?? DEFAULT_LOCATION.latitude;
  const lon = coords?.longitude ?? DEFAULT_LOCATION.longitude;
  const location = coords?.name || DEFAULT_LOCATION.name;

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'rain',
      'showers',
      'cloud_cover',
      'pressure_msl',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'weather_code',
    ].join(','),
    hourly: [
      'temperature_2m',
      'precipitation_probability',
      'precipitation',
      'cloud_cover',
      'weather_code',
      'is_day',
      'shortwave_radiation',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'sunrise',
      'sunset',
      'daylight_duration',
      'uv_index_max',
    ].join(','),
    timezone: DEFAULT_LOCATION.timezone,
    forecast_days: 8,
    forecast_hours: 72,
  });

  const url = `${BASE_URL}?${params.toString()}`;
  const res = await fetch(url, { signal });

  if (!res.ok) {
    throw new Error(`Weather API returned ${res.status}`);
  }

  const data = await res.json();

  return normalizeWeather(data, location);
}

/** Convert Open-Meteo weather codes into a consistent condition + icon set. */
export function mapWeatherCode(code, isDay = true) {
  // WMO Weather interpretation codes (WW)
  // https://open-meteo.com/en/docs
  if (code === 0) return { label: 'Clear', icon: isDay ? '☀️' : '🌙', solar: 'excellent' };
  if (code === 1) return { label: 'Mainly Clear', icon: isDay ? '🌤️' : '🌙', solar: 'excellent' };
  if (code === 2) return { label: 'Partly Cloudy', icon: isDay ? '⛅' : '☁️', solar: 'good' };
  if (code === 3) return { label: 'Overcast', icon: '☁️', solar: 'poor' };
  if (code === 45 || code === 48) return { label: 'Foggy', icon: '🌫️', solar: 'poor' };
  if (code >= 51 && code <= 57) return { label: 'Drizzle', icon: '🌦️', solar: 'poor' };
  if (code >= 61 && code <= 67) return { label: 'Rain', icon: '🌧️', solar: 'very-poor' };
  if (code >= 71 && code <= 77) return { label: 'Snow', icon: '🌨️', solar: 'very-poor' };
  if (code >= 80 && code <= 82) return { label: 'Rain Showers', icon: '🌦️', solar: 'poor' };
  if (code >= 85 && code <= 86) return { label: 'Snow Showers', icon: '🌨️', solar: 'very-poor' };
  if (code >= 95) return { label: 'Thunderstorm', icon: '⛈️', solar: 'very-poor' };
  return { label: 'Unknown', icon: '🌡️', solar: 'unknown' };
}

/** Normalize the raw Open-Meteo response into presentation-ready data. */
function normalizeWeather(raw, locationName) {
  const current = raw.current;
  const hourly = raw.hourly;
  const daily = raw.daily;
  const utcOffset = raw.utc_offset_seconds || 0;
  const now = new Date();

  // Current conditions
  const currentCondition = mapWeatherCode(Number(current.weather_code), Number(current.is_day) === 1);
  const currentHourIndex = hourly.time.findIndex((t) => new Date(t + 'Z').getTime() > now.getTime() - 3600_000);

  const currentHourly = hourly.time.slice(currentHourIndex, currentHourIndex + 24).map((t, i) => {
    const idx = currentHourIndex + i;
    const code = Number(hourly.weather_code[idx]);
    const isDay = Number(hourly.is_day[idx]) === 1;
    return {
      time: new Date(hourly.time[idx] + 'Z'),
      temperature: Math.round(Number(hourly.temperature_2m[idx])),
      precipitationProbability: Number(hourly.precipitation_probability[idx] ?? 0),
      precipitation: Number(hourly.precipitation[idx] ?? 0),
      cloudCover: Number(hourly.cloud_cover[idx] ?? 0),
      condition: mapWeatherCode(code, isDay),
      isDay,
      solarRadiation: Number(hourly.shortwave_radiation[idx] ?? 0),
    };
  });

  // Daily forecast (8 days for today + 7 ahead)
  const dailyForecast = daily.time.map((d, i) => {
    const code = Number(daily.weather_code[i]);
    return {
      date: new Date(daily.time[i] + 'Z'),
      maxTemp: Math.round(Number(daily.temperature_2m_max[i])),
      minTemp: Math.round(Number(daily.temperature_2m_min[i])),
      precipitationProbability: Number(daily.precipitation_probability_max[i] ?? 0),
      sunrise: new Date(daily.sunrise[i] + 'Z'),
      sunset: new Date(daily.sunset[i] + 'Z'),
      daylightDuration: Number(daily.daylight_duration[i] ?? 0),
      uvIndex: Number(daily.uv_index_max[i] ?? 0),
      condition: mapWeatherCode(code),
    };
  });

  return {
    location: locationName,
    updatedAt: now,
    current: {
      temperature: Math.round(Number(current.temperature_2m)),
      feelsLike: Math.round(Number(current.apparent_temperature)),
      humidity: Number(current.relative_humidity_2m),
      windSpeed: Number(current.wind_speed_10m),
      windDirection: Number(current.wind_direction_10m),
      windGusts: Number(current.wind_gusts_10m),
      cloudCover: Number(current.cloud_cover),
      pressure: Number(current.pressure_msl),
      precipitation: Number(current.precipitation),
      rain: Number(current.rain),
      isDay: Number(current.is_day) === 1,
      condition: currentCondition,
    },
    hourly: currentHourly,
    daily: dailyForecast,
  };
}

/** Estimate solar generation quality from weather conditions (0-100). */
export function solarQualityScore(condition) {
  switch (condition.solar) {
    case 'excellent': return 90 + Math.floor(Math.random() * 10);
    case 'good': return 70 + Math.floor(Math.random() * 15);
    case 'poor': return 40 + Math.floor(Math.random() * 20);
    case 'very-poor': return 15 + Math.floor(Math.random() * 20);
    default: return 50;
  }
}

/** Human-readable solar context for a given condition. */
export function solarContextLabel(condition) {
  switch (condition.solar) {
    case 'excellent': return 'Ideal conditions for solar generation';
    case 'good': return 'Good conditions for solar generation';
    case 'poor': return 'Reduced solar generation expected';
    case 'very-poor': return 'Minimal solar generation expected';
    default: return 'Conditions unknown';
  }
}