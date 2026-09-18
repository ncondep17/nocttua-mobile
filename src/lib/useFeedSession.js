import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleFeedTimerAlert, cancelFeedTimerAlert } from './feedTimerAlerts';

const STORAGE_KEY = 'nocttua.activeFeedSession';

/**
 * Timer de toma/extracción con pausa y cambio de lado, para cargar con una
 * sola mano. Todo se persiste como timestamps reales (inicio, tramos,
 * pausas), no como un contador en memoria — al volver de segundo plano o de
 * cerrar la app, el tiempo se recalcula desde esos timestamps, así que no
 * hay drift ni pérdida si pasó rato con la app cerrada.
 *
 * Un tramo (`segment`) es un lado sostenido sin interrupción. Cambiar de
 * lado cierra el tramo actual y abre uno nuevo — el cronómetro total sigue
 * corriendo, no se resetea. Una pausa resta tiempo de TODOS los tramos que
 * se solapan con ella.
 *
 * Store externo compartido (useSyncExternalStore): antes cada pantalla que
 * llamaba a useFeedSession() tenía su PROPIO useState — arrancar el
 * cronómetro desde la hoja de registro actualizaba esa única instancia y
 * AsyncStorage, pero Hoy (montada aparte, con su propia instancia del hook)
 * nunca se enteraba, así que la tarjeta "en curso" no aparecía hasta el
 * próximo remount completo. Con un store module-level + notify(), las dos
 * instancias leen y reaccionan al mismo estado.
 */

let sessionState = null;
let hydrated = false;
const listeners = new Set();

function notify() {
  listeners.forEach((l) => l());
}

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  AsyncStorage.getItem(STORAGE_KEY)
    .then((raw) => { if (raw) { sessionState = JSON.parse(raw); notify(); } })
    .catch(() => {});
}

function persist(next) {
  sessionState = next;
  notify();
  if (next) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  else AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
}

function subscribe(cb) {
  listeners.add(cb);
  hydrate();
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return sessionState;
}

function overlapMs(pauses, from, to) {
  return pauses.reduce((sum, p) => {
    const pStart = Math.max(p.startedAt, from);
    const pEnd = Math.min(p.endedAt ?? to, to);
    return sum + Math.max(0, pEnd - pStart);
  }, 0);
}

function segmentMs(seg, pauses, now) {
  const end = seg.endedAt ?? now;
  return Math.max(0, end - seg.startedAt - overlapMs(pauses, seg.startedAt, end));
}

export function useFeedSession() {
  const session = useSyncExternalStore(subscribe, getSnapshot);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [session]);

  const start = useCallback((kind, babyId, side) => {
    const now = Date.now();
    persist({ kind, babyId, startedAt: now, segments: [{ side: side ?? null, startedAt: now, endedAt: null }], pauses: [] });
    // 1h después, por si se olvida "Terminar" — se cancela sola al parar o
    // descartar. No se reprograma al cambiar de lado: es sobre el tiempo
    // total corrido, no por tramo.
    scheduleFeedTimerAlert(now).catch(() => {});
  }, []);

  const togglePause = useCallback(() => {
    if (!sessionState) return;
    const now = Date.now();
    const paused = sessionState.pauses.length > 0 && sessionState.pauses[sessionState.pauses.length - 1].endedAt == null;
    const pauses = paused
      ? sessionState.pauses.slice(0, -1).concat([{ ...sessionState.pauses[sessionState.pauses.length - 1], endedAt: now }])
      : sessionState.pauses.concat([{ startedAt: now, endedAt: null }]);
    persist({ ...sessionState, pauses });
  }, []);

  const switchSide = useCallback((newSide) => {
    if (!sessionState) return;
    const now = Date.now();
    const segments = sessionState.segments.slice(0, -1).concat([{ ...sessionState.segments[sessionState.segments.length - 1], endedAt: now }]);
    segments.push({ side: newSide, startedAt: now, endedAt: null });
    persist({ ...sessionState, segments });
  }, []);

  /** Cierra la sesión y devuelve un resumen con ms por tramo — no persiste sola, hay que guardar el registro con eso. */
  const stop = useCallback(() => {
    if (!sessionState) return null;
    const now = Date.now();
    const pauses = sessionState.pauses.length && sessionState.pauses[sessionState.pauses.length - 1].endedAt == null
      ? sessionState.pauses.slice(0, -1).concat([{ ...sessionState.pauses[sessionState.pauses.length - 1], endedAt: now }])
      : sessionState.pauses;
    const segments = sessionState.segments
      .map((seg) => ({ side: seg.side, startedAt: seg.startedAt, endedAt: seg.endedAt ?? now, ms: segmentMs(seg, pauses, now) }))
      .filter((s) => s.ms > 0);
    const totalMs = segments.reduce((a, s) => a + s.ms, 0);
    const result = { kind: sessionState.kind, babyId: sessionState.babyId, startedAt: sessionState.startedAt, endedAt: now, segments, totalMs };
    persist(null);
    cancelFeedTimerAlert().catch(() => {});
    return result;
  }, []);

  const cancel = useCallback(() => {
    persist(null);
    cancelFeedTimerAlert().catch(() => {});
  }, []);

  const now = Date.now();
  const isPaused = !!session && session.pauses.length > 0 && session.pauses[session.pauses.length - 1].endedAt == null;
  const currentSide = session ? session.segments[session.segments.length - 1].side : null;
  const totalElapsedMs = session ? session.segments.reduce((a, seg) => a + segmentMs(seg, session.pauses, now), 0) : 0;

  return { session, isPaused, currentSide, totalElapsedMs, start, togglePause, switchSide, stop, cancel };
}
