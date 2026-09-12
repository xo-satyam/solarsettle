import React from 'react';
import { useWeather } from '../../hooks/useWeather';

/**
 * Horizontal hourly forecast strip.
 * Self-fetching + isolated: a weather failure renders a contained error,
 * never breaking the dashboard.
 */
export default function HourlyForecast() {
  const { status, data, retry } = useWeather();

  if (status === 'loading') {
    return (
      <div className="hourly-forecast" aria-busy="true">
        <div className="section-header">
          <h3>Hourly Forecast</h3>
          <span className="section-sub">Next 12 hours</span>
        </div>
        <div className="hourly-strip">
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="skeleton-block" style={{ width: 72, height: 84 }} key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (status === 'error' || status === 'unavailable') {
    return (
      <div className="hourly-forecast weather-error" role="alert">
        <h3>Hourly forecast unavailable</h3>
        <p>We couldn't load hourly weather data.</p>
        <button className="weather-retry-btn" onClick={retry}>↻ Retry</button>
      </div>
    );
  }

  if (!data?.hourly?.length) return null;

  const hours = data.hourly.slice(0, 12); // Show next 12 hours

  return (
    <div className="hourly-forecast">
      <div className="section-header">
        <h3>Hourly Forecast</h3>
        <span className="section-sub">Next 12 hours</span>
      </div>
      <div className="hourly-strip">
        {hours.map((h, i) => (
          <div className="hourly-item" key={i}>
            <div className="hourly-time">
              {i === 0 ? 'Now' : formatHour(h.time)}
            </div>
            <div className="hourly-icon" aria-label={h.condition.label}>
              {h.condition.icon}
            </div>
            <div className="hourly-temp">{h.temperature}°</div>
            <div className="hourly-rain">
              {h.precipitationProbability > 0 ? `${h.precipitationProbability}%` : '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatHour(date) {
  if (!date) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', hour12: true });
}