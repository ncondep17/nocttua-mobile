import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { logTelemetry } from './telemetry';
import { getNotificationPermissionState } from './windowAlerts';

/**
 * Aviso de "hace tiempo que no registrás sueño" — mismo motor que
 * windowAlerts.js/doseAlerts.js/feedTimerAlerts.js: local, una sola alerta
 * viva a la vez (por família, no por bebé — con mellizas alcanza con un
 * aviso), sin permiso no se agenda nada, cada intento deja telemetría.
 *
 * Se reagenda cada vez que se guarda un sueño nuevo (push a `REMINDER_HOURS`
 * desde ahora) y una vez al abrir FamilyShell con el último sueño real que
 * haya en la base — así cubre tanto "se te pasó hoy" como "reabriste la app
 * después de días sin tocarla y nunca te avisó nada".
 */
const STORAGE_KEY = 'nocttua.inactivityAlert.v1';
const REMINDER_HOURS = 24;
const BODY = 'Hace más de un día que no registras el sueño — anota algo cuando puedas.';

async function loadEntry() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}
async function saveEntry(entry) {
  if (entry) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  else await AsyncStorage.removeItem(STORAGE_KEY);
}

/** Agenda (o reprograma) el aviso para `REMINDER_HOURS` después de `lastSleepAtMs`. */
export async function scheduleInactivityAlert(lastSleepAtMs) {
  const permission = await getNotificationPermissionState();
  if (permission !== 'granted') {
    await logTelemetry('inactivity_alert_scheduled', { ok: false, reason: 'no_permission' });
    return { ok: false, reason: 'no_permission' };
  }

  const triggerAt = new Date(lastSleepAtMs + REMINDER_HOURS * 60 * 60000);
  const alertKey = triggerAt.toISOString();
  const existing = await loadEntry();
  if (existing?.alertKey === alertKey) return { ok: true, reason: 'already_scheduled' };
  if (existing?.notificationId) {
    await Notifications.cancelScheduledNotificationAsync(existing.notificationId).catch(() => {});
  }

  // Si ya pasaron las REMINDER_HOURS (p. ej. se reabre la app después de
  // varios días sin registrar nada), avisa ya en vez de agendar algo en el
  // pasado — una sola vez, porque alertKey no cambia hasta el próximo sueño.
  const content = { title: 'Nocttua', body: BODY, data: { kind: 'inactivity' } };
  const immediate = triggerAt.getTime() <= Date.now();
  const notificationId = await Notifications.scheduleNotificationAsync({
    content,
    trigger: immediate ? null : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerAt },
  });

  await saveEntry({ alertKey, notificationId });
  await logTelemetry('inactivity_alert_scheduled', { ok: true, immediate, triggerAt: triggerAt.toISOString() });
  return { ok: true, immediate };
}

export async function cancelInactivityAlert() {
  const existing = await loadEntry();
  if (!existing) return;
  await Notifications.cancelScheduledNotificationAsync(existing.notificationId).catch(() => {});
  await saveEntry(null);
}
