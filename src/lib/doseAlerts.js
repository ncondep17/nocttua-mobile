import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { logTelemetry } from './telemetry';
import { getNotificationPermissionState } from './windowAlerts';
import { logDose } from '../data/meds';

/**
 * Motor de aviso de próxima dosis — misma capa que windowAlerts.js
 * (CONTRATO-AVISO-VENTANA.md): local primero, una alerta viva por
 * medicina+bebé (recalcular cancela y reagenda), sin permiso no se agenda
 * nada, y cada intento deja telemetría.
 *
 * Dos diferencias con windowAlerts.js, por el README del handoff de
 * medicinas: (1) el disparo es `remindMinutesBefore` ANTES de la dosis, no
 * en la hora exacta; (2) trae acciones rápidas (Dosis dada/Posponer 15
 * min/Saltar) vía categoría de notificación, con una segunda notificación
 * de repaso a los 30 min si nadie respondió — se cancela sola en cuanto
 * llega cualquier respuesta a la primera.
 *
 * Sigue siendo local-only (un solo dispositivo, el que tiene la app
 * abierta) — notificar a otros miembros de turno necesita push entre
 * dispositivos, que quedó fuera de esta pasada a propósito.
 */
const STORAGE_KEY = 'nocttua.doseAlerts.v1';
const CATEGORY = 'dose';
const REPEAT_AFTER_MIN = 30;
const SNOOZE_MIN = 15;

async function loadMap() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}
async function saveMap(map) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/** Se registra una vez en el punto de entrada de la app (App.js), antes de agendar nada. */
export async function registerDoseNotificationCategory() {
  await Notifications.setNotificationCategoryAsync(CATEGORY, [
    { identifier: 'dose_given', buttonTitle: 'Dosis dada', options: { opensAppToForeground: false } },
    { identifier: 'dose_snooze', buttonTitle: 'Posponer 15 min', options: { opensAppToForeground: false } },
    { identifier: 'dose_skip', buttonTitle: 'Saltar', options: { opensAppToForeground: false, isDestructive: true } },
  ]);
}

async function cancelIds(notificationId, repeatId) {
  if (notificationId) await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => {});
  if (repeatId) await Notifications.cancelScheduledNotificationAsync(repeatId).catch(() => {});
}

/** Agenda (o reprograma) el aviso de la próxima dosis de una medicina para un bebé, `remindMinutesBefore` antes de que toque. */
export async function scheduleDoseAlert({ familyId, prescriptionId, babyId, babyName, medName, doseMl, doseAt, remindMinutesBefore = 5 }) {
  const permission = await getNotificationPermissionState();
  if (permission !== 'granted') {
    await logTelemetry('dose_alert_scheduled', { prescriptionId, babyId, ok: false, reason: 'no_permission' });
    return { ok: false, reason: 'no_permission' };
  }

  const mapKey = `${prescriptionId}:${babyId}`;
  const reminderAt = new Date(doseAt.getTime() - remindMinutesBefore * 60000);
  const alertKey = `${mapKey}:${reminderAt.toISOString()}`;
  const map = await loadMap();
  const existing = map[mapKey];

  if (existing?.alertKey === alertKey) {
    return { ok: true, reason: 'already_scheduled' };
  }
  await cancelIds(existing?.notificationId, existing?.repeatId);

  if (reminderAt.getTime() <= Date.now()) {
    delete map[mapKey];
    await saveMap(map);
    await logTelemetry('dose_alert_scheduled', { prescriptionId, babyId, ok: false, reason: 'dose_in_past' });
    return { ok: false, reason: 'dose_in_past' };
  }

  const data = { alertKey, prescriptionId, babyId, babyName, medName, doseMl, familyId, doseAt: doseAt.toISOString(), remindMinutesBefore, kind: 'dose' };
  const body = `${medName} para ${babyName}: ${doseMl}, ${remindMinutesBefore <= 0 ? 'le toca ahora' : 'le toca en ' + remindMinutesBefore + ' min'}.`;

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: { title: 'Nocttua', body, data, categoryIdentifier: CATEGORY },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderAt },
  });

  const repeatAt = new Date(reminderAt.getTime() + REPEAT_AFTER_MIN * 60000);
  let repeatId = null;
  if (repeatAt.getTime() > Date.now()) {
    repeatId = await Notifications.scheduleNotificationAsync({
      content: { title: 'Nocttua', body: 'Todavía pendiente — ' + body, data, categoryIdentifier: CATEGORY },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: repeatAt },
    });
  }

  map[mapKey] = { alertKey, notificationId, repeatId };
  await saveMap(map);
  await logTelemetry('dose_alert_scheduled', { prescriptionId, babyId, ok: true, alertKey, triggerAt: reminderAt.toISOString() });
  return { ok: true };
}

export async function cancelDoseAlert(prescriptionId, babyId) {
  const map = await loadMap();
  const mapKey = `${prescriptionId}:${babyId}`;
  const existing = map[mapKey];
  if (!existing) return;
  await cancelIds(existing.notificationId, existing.repeatId);
  delete map[mapKey];
  await saveMap(map);
}

/**
 * Se registra una vez en App.js. Cualquier respuesta a la primera o a la
 * segunda notificación (repaso de los 30 min) cancela la otra — no tiene
 * sentido seguir insistiendo si ya se contestó.
 */
export function observeDoseNotificationResponses() {
  return Notifications.addNotificationResponseReceivedListener(async (response) => {
    const data = response.notification.request.content.data;
    if (data?.kind !== 'dose') return;
    const { prescriptionId, babyId, familyId, medName, babyName, doseMl, remindMinutesBefore } = data;
    await cancelDoseAlert(prescriptionId, babyId).catch(() => {});

    if (response.actionIdentifier === 'dose_given') {
      await logDose(familyId, prescriptionId, babyId, new Date()).catch(() => {});
    } else if (response.actionIdentifier === 'dose_skip') {
      await logDose(familyId, prescriptionId, babyId, new Date(), false, true).catch(() => {});
    } else if (response.actionIdentifier === 'dose_snooze') {
      const doseAt = new Date(Date.now() + SNOOZE_MIN * 60000 + (remindMinutesBefore ?? 5) * 60000);
      await scheduleDoseAlert({ familyId, prescriptionId, babyId, babyName, medName, doseMl, doseAt, remindMinutesBefore }).catch(() => {});
    }
    // Tocar la notificación sin elegir una acción (abrir la app) no hace nada acá — se sigue viendo el estado real en Equipo/Tratamiento activo.
  });
}
