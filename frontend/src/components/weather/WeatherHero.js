import React from 'react';
import { useWeather } from '../../hooks/useWeather';
import { solarContextLabel, solarQualityScore } from '../../services/weatherService';

/**
 * Hero weather card — the primary weather visual.
 * Shows location, current temp, condition, and key supporting metrics.
 * Designed to sit at the top of the dashboard as the visual anchor.
 */
export default function WeatherHero({ coords = null, locationName = null }) {
  const { status, data, error, retry } = useWeather(coords);

  if (status === 'loading' || (status === 'stale' && !data)) {
    return (
      <div className="weather-hero weather-skeleton" aria-busy="true" aria-label="Loading weather">
        <div className="skeleton-block skeleton-location" />
        <div className="skeleton-block skeleton-temp" />
        <div className="skeleton-block skeleton-condition" />
        <div className="skeleton-row">
          <div className="skeleton-block skeleton-metric" />
          <div className="skeleton-block skeleton-metric" />
          <div className="skeleton-block skeleton-metric" />
        </div>
      </div>
    );
  }

  if (status === 'error' || status === 'unavailable') {
    return (
      <div className="weather-hero weather-error" role="alert">
        <div className="weather-error-icon">🌤️</div>
        <h3>Weather unavailable</h3>
        <p>{error || "We couldn't retrieve current weather data."}</p>
        <button className="weather-retry-btn" onClick={retry}>↻ Retry</button>
      </div>
    );
  }

  if (!data?.current) return null;

  const { current, location, updatedAt } = data;
  const quality = solarQualityScore(current.condition);
  const contextLabel = solarContextLabel(current.condition);

  return (
    <div className="weather-hero">
      <div className="weather-hero-top">
        <div className="weather-location">
          <span className="weather-loc-icon">📍</span>
          <span>{locationName || location}</span>
        </div>
        <div className="weather-updated">
          Updated {formatRelativeTime(updatedAt)}
          <button className="weather-refresh" onClick={retry} title="Refresh weather" aria-label="Refresh weather">
            ↻
          </button>
        </div>
      </div>

      <div className="weather-hero-main">
        <div className="weather-now">
          <div className="weather-temp">
            {current.condition.icon} {current.temperature}°
          </div>
          <div className="weather-condition">{current.condition.label}</div>
          <div className="weather-feels">Feels like {current.feelsLike}°C</div>
        </div>

        <div className="weather-metrics">
          <div className="weather-metric">
            <span className="weather-metric-icon">💧</span>
            <div>
              <div className="weather-metric-label">Humidity</div>
              <div className="weather-metric-value">{current.humidity}%</div>
            </div>
          </div>
          <div className="weather-metric">
            <span className="weather-metric-icon">🌬️</span>
            <div>
              <div className="weather-metric-label">Wind</div>
              <div className="weather-metric-value">{current.windSpeed} km/h</div>
            </div>
          </div>
          <div className="weather-metric">
            <span className="weather-metric-icon">🌧️</span>
            <div>
              <div className="weather-metric-label">Rain</div>
              <div className="weather-metric-value">{current.precipitation} mm</div>
            </div>
          </div>
          <div className="weather-metric">
            <span className="weather-metric-icon">☁️</span>
            <div>
              <div className="weather-metric-label">Cloud</div>
              <div className="weather-metric-value">{current.cloudCover}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="weather-solar-context">
        <div className="solar-quality-bar">
          <div
            className="solar-quality-fill"
            style={{ width: `${quality}%` }}
          />
        </div>
        <div className="solar-quality-label">
          ☀️ {contextLabel}
          <span className="solar-quality-score">{quality}/100</span>
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(date) {
  if (!date) return 'recently';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}