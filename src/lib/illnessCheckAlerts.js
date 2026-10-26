import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { logTelemetry } from './telemetry';
import { getNotificationPermissionState } from './windowAlerts';
import { endEpisode } from '../data/meds';

/**
 * Aviso de "¿ya está bien? revisa el modo enfermedad" — mismo motor que los
 * demás (windowAlerts.js/doseAlerts.js/feedTimerAlerts.js/inactivityAlerts.js):
 * local, una sola alerta viva a la vez (un único índice único de
 * med_episodes garantiza que nunca hay más de un episodio abierto por
 * família), sin permiso no se agenda nada, cada intento deja telemetría.
 *
 * Se reagenda `REMINDER_HOURS` desde la última señal real de que la
 * enfermedad sigue activa — la última dosis dada, o el inicio del episodio
 * si todavía no se dio ninguna. Trae una acción rápida "Ya está bien" que
 * cierra el episodio sin abrir la app, igual que las de doseAlerts.js.
 */
const STORAGE_KEY = 'nocttua.illnessCheckAlert.v1';
const CATEGORY = 'illness_check';
const REMINDER_HOURS = 48;

async function loadEntry() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}
async function saveEntry(entry) {
  if (entry) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  else await AsyncStorage.removeItem(STORAGE_KEY);
}

/** Se registra una vez en el punto de entrada de la app (App.js), antes de agendar nada. */
export async function registerIllnessCheckCategory() {
  await Notifications.setNotificationCategoryAsync(CATEGORY, [
    { identifier: 'illness_resolved', buttonTitle: 'Ya está bien', options: { opensAppToForeground: false } },
    { identifier: 'illness_still_sick', buttonTitle: 'Sigue enferma', options: { opensAppToForeground: false } },
  ]);
}

/** Agenda (o reprograma) el aviso para `REMINDER_HOURS` después de `lastActivityAtMs`. */
export async function scheduleIllnessCheckAlert({ episodeId, familyId, lastActivityAtMs }) {
  const permission = await getNotificationPermissionState();
  if (permission !== 'granted') {
    await logTelemetry('illness_check_alert_scheduled', { episodeId, ok: false, reason: 'no_permission' });
    return { ok: false, reason: 'no_permission' };
  }

  const triggerAt = new Date(lastActivityAtMs + REMINDER_HOURS * 60 * 60000);
  const alertKey = `${episodeId}:${triggerAt.toISOString()}`;
  const existing = await loadEntry();
  if (existing?.alertKey === alertKey) return { ok: true, reason: 'already_scheduled' };
  if (existing?.notificationId) {
    await Notifications.cancelScheduledNotificationAsync(existing.notificationId).catch(() => {});
  }

  const body = 'Hace 2 días que no registras una dosis — ¿ya está bien? Puedes cerrar el modo enfermedad en Equipo.';
  const data = { kind: 'illness_check', episodeId, familyId };
  const immediate = triggerAt.getTime() <= Date.now();

  // Ver el mismo try/catch en openNapAlerts.js: antes, un fallo acá no
  // dejaba rastro — el aviso no se agendaba y nadie se enteraba nunca.
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: { title: 'Nocttua', body, data, categoryIdentifier: CATEGORY },
      trigger: immediate ? null : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerAt },
    });
    await saveEntry({ alertKey, notificationId, episodeId });
    await logTelemetry('illness_check_alert_scheduled', { episodeId, ok: true, immediate, triggerAt: triggerAt.toISOString() });
    return { ok: true, immediate };
  } catch (err) {
    await logTelemetry('illness_check_alert_scheduled', { episodeId, ok: false, reason: 'schedule_failed', error: String(err?.message ?? err) });
    return { ok: false, reason: 'schedule_failed' };
  }
}

export async function cancelIllnessCheckAlert() {
  const existing = await loadEntry();
  if (!existing) return;
  await Notifications.cancelScheduledNotificationAsync(existing.notificationId).catch(() => {});
  await saveEntry(null);
}

/**
 * Se registra una vez en App.js. "Ya está bien" cierra el episodio directo
 * desde la notificación; "Sigue enferma" solo empuja el aviso 48h más —no
 * tiene sentido seguir insistiendo el mismo día que ya se contestó.
 */
export function observeIllnessCheckResponses() {
  return Notifications.addNotificationResponseReceivedListener(async (response) => {
    const data = response.notification.request.content.data;
    if (data?.kind !== 'illness_check') return;
    const { episodeId, familyId } = data;

    if (response.actionIdentifier === 'illness_resolved') {
      await cancelIllnessCheckAlert();
      await endEpisode(episodeId).catch(() => {});
    } else if (response.actionIdentifier === 'illness_still_sick') {
      await scheduleIllnessCheckAlert({ episodeId, familyId, lastActivityAtMs: Date.now() }).catch(() => {});
    }
    // Tocar la notificación sin elegir una acción no hace nada acá — el estado real se ve en Equipo.
  });
}
