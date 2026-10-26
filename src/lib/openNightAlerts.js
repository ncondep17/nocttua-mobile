import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { logTelemetry } from './telemetry';
import { getNotificationPermissionState } from './windowAlerts';
import { getOpenNightEvents } from '../data/family';

/**
 * Aviso de "noche sin cerrar" — mismo motor que los demás, keyed por bebé
 * como windowAlerts.js (con mellizas cada una puede tener su propia noche
 * abierta o cerrada por separado). THRESHOLD_HOURS da margen a una noche
 * larga real antes de sospechar que se olvidó cerrarla.
 *
 * No se agenda desde cada guardado puntual — se llama `refreshOpenNightAlerts`
 * (relee el estado real de "noches abiertas" contra la base) al abrir la app
 * y después de cualquier acción que pueda abrir o cerrar una noche
 * (guardar sueño, cerrar noche, borrar evento). Es más robusto que tratar
 * de adivinar desde cada handler si esta guardada en particular abrió o
 * cerró algo.
 */
const STORAGE_KEY = 'nocttua.openNightAlert.v1';
const THRESHOLD_HOURS = 14;

async function loadMap() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}
async function saveMap(map) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

async function scheduleOpenNightAlert({ babyId, babyName, referenceAtMs }) {
  const permission = await getNotificationPermissionState();
  if (permission !== 'granted') {
    await logTelemetry('open_night_alert_scheduled', { babyId, ok: false, reason: 'no_permission' });
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

  const body = `La noche de ${babyName} sigue abierta — ¿ya se despertó? Cierra la noche para que los patrones no se desordenen.`;
  const immediate = triggerAt.getTime() <= Date.now();
  // Ver el mismo try/catch en openNapAlerts.js: antes, un fallo acá no
  // dejaba rastro — el aviso no se agendaba y nadie se enteraba nunca.
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: { title: 'Nocttua', body, data: { kind: 'open_night', babyId } },
      trigger: immediate ? null : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerAt },
    });
    map[babyId] = { alertKey, notificationId };
    await saveMap(map);
    await logTelemetry('open_night_alert_scheduled', { babyId, ok: true, immediate, triggerAt: triggerAt.toISOString() });
  } catch (err) {
    await logTelemetry('open_night_alert_scheduled', { babyId, ok: false, reason: 'schedule_failed', error: String(err?.message ?? err) });
  }
}

async function cancelOpenNightAlert(babyId) {
  const map = await loadMap();
  const existing = map[babyId];
  if (!existing) return;
  await Notifications.cancelScheduledNotificationAsync(existing.notificationId).catch(() => {});
  delete map[babyId];
  await saveMap(map);
}

/** Relee las noches abiertas reales y agenda/cancela por bebé según corresponda. Llamar después de cualquier cambio en sueños de noche. */
export async function refreshOpenNightAlerts(familyId, babies) {
  const openNights = await getOpenNightEvents(familyId);
  const byBabyId = Object.fromEntries(openNights.map((n) => [n.baby_id, n]));

  for (const baby of babies) {
    const night = byBabyId[baby.id];
    if (night) {
      const referenceAtMs = new Date(night.fell_asleep_at || night.started_at).getTime();
      await scheduleOpenNightAlert({ babyId: baby.id, babyName: baby.name, referenceAtMs });
    } else {
      await cancelOpenNightAlert(baby.id);
    }
  }
}
