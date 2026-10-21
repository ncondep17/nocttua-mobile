import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { logTelemetry } from './telemetry';
import { getNotificationPermissionState } from './windowAlerts';
import { getOpenNapEvents } from '../data/family';

/**
 * Aviso de "siesta sin cerrar" — mismo motor que openNightAlerts.js, con un
 * THRESHOLD_HOURS mucho más corto: una siesta que sigue "abierta" a las 2-3
 * horas ya es rara (a diferencia de una noche, que dura eso de por sí), y es
 * mucho más fácil que se pase por alto a media tarde que una noche entera.
 *
 * Mismo patrón que los demás: keyed por bebé, se relee con
 * `refreshOpenNapAlerts` (no se intenta adivinar desde cada handler si esta
 * guardada abrió o cerró algo).
 */
const STORAGE_KEY = 'nocttua.openNapAlert.v1';
const THRESHOLD_HOURS = 2.5;

async function loadMap() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}
async function saveMap(map) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

async function scheduleOpenNapAlert({ babyId, babyName, referenceAtMs }) {
  const permission = await getNotificationPermissionState();
  if (permission !== 'granted') {
    await logTelemetry('open_nap_alert_scheduled', { babyId, ok: false, reason: 'no_permission' });
    return;
  }

  const triggerAt = new Date(referenceAtMs + THRESHOLD_HOURS * 60 * 60000);
  const alertKey = `${babyId}:${triggerAt.toISOString()}`;
  const map = await loadMap();
  const existing = map[babyId];
  if (existing?.alertKey === alertKey) return;
  if (existing?.notificationId) {
    await Notifications.cancelScheduledNotificationAsync(existing.notificationId).catch(() => {});
  }

  const body = `La siesta de ${babyName} sigue abierta hace más de 2 horas y media — ¿ya se despertó?`;
  const immediate = triggerAt.getTime() <= Date.now();
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: { title: 'Nocttua', body, data: { kind: 'open_nap', babyId } },
    trigger: immediate ? null : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerAt },
  });

  map[babyId] = { alertKey, notificationId };
  await saveMap(map);
  await logTelemetry('open_nap_alert_scheduled', { babyId, ok: true, immediate, triggerAt: triggerAt.toISOString() });
}

async function cancelOpenNapAlert(babyId) {
  const map = await loadMap();
  const existing = map[babyId];
  if (!existing) return;
  await Notifications.cancelScheduledNotificationAsync(existing.notificationId).catch(() => {});
  delete map[babyId];
  await saveMap(map);
}

/** Relee las siestas abiertas reales y agenda/cancela por bebé según corresponda. Llamar después de cualquier cambio en sueños de siesta. */
export async function refreshOpenNapAlerts(familyId, babies) {
  const openNaps = await getOpenNapEvents(familyId);
  const byBabyId = Object.fromEntries(openNaps.map((n) => [n.baby_id, n]));

  for (const baby of babies) {
    const nap = byBabyId[baby.id];
    if (nap) {
      const referenceAtMs = new Date(nap.fell_asleep_at || nap.started_at).getTime();
      await scheduleOpenNapAlert({ babyId: baby.id, babyName: baby.name, referenceAtMs });
    } else {
      await cancelOpenNapAlert(baby.id);
    }
  }
}
