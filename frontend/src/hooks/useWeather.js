import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWeather } from '../services/weatherService';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const STALE_AFTER_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Weather data hook with explicit loading / loaded / stale / error / unavailable states.
 * Isolated from the rest of the dashboard — a weather failure must never
 * take down SolarSettle.
 */
export function useWeather(coords = null) {
  const [state, setState] = useState({
    status: 'loading', // loading | loaded | stale | error | unavailable
    data: null,
    error: null,
    updatedAt: null,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const controllerRef = useRef(null);

  const load = useCallback(async () => {
    // Cancel any in-flight request
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setState((prev) => ({ ...prev, status: prev.data ? 'stale' : 'loading' }));

    try {
      const data = await fetchWeather(coords, { signal: controller.signal });
      setState({
        status: 'loaded',
        data,
        error: null,
        updatedAt: new Date(),
      });
    } catch (e) {
      if (e.name === 'AbortError') return;
      setState((prev) => ({
        status: 'error',
        data: prev.data || null, // keep stale data if we have it
        error: e.message,
        updatedAt: prev.updatedAt,
      }));
    }
  }, [coords]);

  // Initial load + refresh interval
  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      clearInterval(t);
      controllerRef.current?.abort();
    };
  }, [load, refreshKey]);

  // Mark as stale after threshold
  useEffect(() => {
    if (state.status !== 'loaded') return;
    const t = setTimeout(() => {
      setState((prev) =>
        prev.status === 'loaded' ? { ...prev, status: 'stale' } : prev
      );
    }, STALE_AFTER_MS);
    return () => clearTimeout(t);
  }, [state.status, state.updatedAt]);

  const retry = useCallback(() => setRefreshKey((k) => k + 1), []);
  const dismissError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: prev.data ? 'stale' : 'unavailable',
    }));
  }, []);

  return {
    ...state,
    retry,
    dismissError,
    isWeatherReady: state.status === 'loaded' || state.status === 'stale',
  };
}

export default useWeather;
