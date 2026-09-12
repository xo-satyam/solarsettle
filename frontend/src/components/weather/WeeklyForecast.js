import React from 'react';
import { useWeather } from '../../hooks/useWeather';

/**
 * 7-day weather forecast strip.
 * Self-fetching + isolated: a weather failure renders a contained error,
 * never breaking the dashboard.
 */
export default function WeeklyForecast() {
  const { status, data, retry } = useWeather();

  if (status === 'loading') {
    return (
      <div className="weekly-forecast" aria-busy="true">
        <div className="section-header">
          <h3>7-Day Forecast</h3>
          <span className="section-sub">Weekly outlook</span>
        </div>
        <div className="weekly-strip">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="skeleton-block" style={{ width: '100%', height: 44 }} key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (status === 'error' || status === 'unavailable') {
    return (
      <div className="weekly-forecast weather-error" role="alert">
        <h3>Weekly forecast unavailable</h3>
        <p>We couldn't load the 7-day outlook.</p>
        <button className="weather-retry-btn" onClick={retry}>↻ Retry</button>
      </div>
    );
  }

  if (!data?.daily?.length) return null;

  const days = data.daily.slice(0, 7);

  return (
    <div className="weekly-forecast">
      <div className="section-header">
        <h3>7-Day Forecast</h3>
        <span className="section-sub">Weekly outlook</span>
      </div>
      <div className="weekly-strip">
        {days.map((d, i) => (
          <div className="weekly-item" key={i}>
            <div className="weekly-day">
              {i === 0 ? 'Today' : formatDay(d.date)}
            </div>
            <div className="weekly-icon" aria-label={d.condition.label}>
              {d.condition.icon}
            </div>
            <div className="weekly-temps">
              <span className="weekly-high">{d.maxTemp}°</span>
              <span className="weekly-low">{d.minTemp}°</span>
            </div>
            <div className="weekly-rain">
              {d.precipitationProbability > 0 ? `${d.precipitationProbability}%` : '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDay(date) {
  if (!date) return '';
  return date.toLocaleDateString([], { weekday: 'short' });
}