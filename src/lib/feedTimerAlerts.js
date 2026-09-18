import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { logTelemetry } from './telemetry';
import { getNotificationPermissionState } from './windowAlerts';

/**
 * Aviso de "¿seguís con el cronómetro de lactancia abierto?" — se dispara 1h
 * después de arrancar el timer si todavía no se cerró, para el caso real de
 * dejarlo corriendo sin querer (se cambia de pantalla, se olvida "Terminar").
 * Mismo motor que doseAlerts.js/windowAlerts.js: local, una sola alerta viva
 * a la vez, sin permiso no se agenda nada, cada intento deja telemetría.
 */
const STORAGE_KEY = 'nocttua.feedTimerAlert.v1';
const REMINDER_MINUTES = 60;

async function loadEntry() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}
async function saveEntry(entry) {
  if (entry) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  else await AsyncStorage.removeItem(STORAGE_KEY);
}

/** Agenda el aviso para 1h después de `startedAtMs` — el inicio real de la sesión, no de cada cambio de lado (eso no reprograma nada). */
export async function scheduleFeedTimerAlert(startedAtMs) {
  const permission = await getNotificationPermissionState();
  if (permission !== 'granted') {
    await logTelemetry('feed_timer_alert_scheduled', { ok: false, reason: 'no_permission' });
    return { ok: false, reason: 'no_permission' };
  }

  const existing = await loadEntry();
  if (existing?.notificationId) {
    await Notifications.cancelScheduledNotificationAsync(existing.notificationId).catch(() => {});
  }

  const triggerAt = new Date(startedAtMs + REMINDER_MINUTES * 60000);
  if (triggerAt.getTime() <= Date.now()) {
    await saveEntry(null);
    await logTelemetry('feed_timer_alert_scheduled', { ok: false, reason: 'trigger_in_past' });
    return { ok: false, reason: 'trigger_in_past' };
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Nocttua',
      body: '¿Sigues dando pecho? El cronómetro lleva una hora corriendo — tócalo para pararlo si ya terminaste.',
      data: { kind: 'feed_timer' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerAt },
  });

  await saveEntry({ notificationId });
  await logTelemetry('feed_timer_alert_scheduled', { ok: true, triggerAt: triggerAt.toISOString() });
  return { ok: true };
}

/** Al cerrar/cancelar el timer (Terminar o descartar) — nada que recordar. */
export async function cancelFeedTimerAlert() {
  const existing = await loadEntry();
  if (!existing) return;
  await Notifications.cancelScheduledNotificationAsync(existing.notificationId).catch(() => {});
  await saveEntry(null);
}
