import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { logTelemetry } from './telemetry';

/**
 * Motor de aviso de la próxima ventana — implementa CONTRATO-AVISO-VENTANA.md.
 *
 * Local primero (§1): se agenda en el dispositivo con expo-notifications,
 * nunca depende de red. Una alerta viva por bebé (§3): `alertKey` es
 * `babyId + windowStartLocalISO`; recalcular la ventana de un bebé cancela
 * la alerta anterior y agenda la nueva (idempotente). Sin permiso, sin
 * promesa (§4): si el permiso no está concedido, no se agenda nada — el
 * degradado de copy en la UI es responsabilidad de la pantalla que muestra
 * la ventana, no de este módulo. Se mide o no existe (§5): cada agendado
 * (o intento fallido) deja un evento de telemetría.
 *
 * NOTA HONESTA: todavía no existe el algoritmo que calcula `windowStartLocalISO`
 * a partir de los registros reales (ver plan, "Fases siguientes" — cálculo de
 * ventana por edad). Este módulo es el motor de agendado, listo para conectarse
 * el día que exista una predicción real; hoy nadie lo llama con una hora real.
 */
const STORAGE_KEY = 'nocttua.windowAlerts.v1';

async function loadMap() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}
async function saveMap(map) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export async function getNotificationPermissionState() {
  const { status } = await Notifications.getPermissionsAsync();
  return status; // 'granted' | 'denied' | 'undetermined'
}

/**
 * Agenda (o reprograma) el aviso de la próxima ventana de un bebé.
 * No lanza si falta permiso o si la hora ya pasó: devuelve el motivo.
 */
export async function scheduleWindowAlert({ babyId, babyName, windowStartLocalISO, leadMinutes = 20 }) {
  const permission = await getNotificationPermissionState();
  if (permission !== 'granted') {
    await logTelemetry('alert_scheduled', { babyId, ok: false, reason: 'no_permission' });
    return { ok: false, reason: 'no_permission' };
  }

  const alertKey = `${babyId}:${windowStartLocalISO}`;
  const map = await loadMap();
  const existing = map[babyId];

  if (existing?.alertKey === alertKey) {
    return { ok: true, reason: 'already_scheduled' };
  }
  if (existing?.notificationId) {
    await Notifications.cancelScheduledNotificationAsync(existing.notificationId).catch(() => {});
  }

  const triggerAt = new Date(new Date(windowStartLocalISO).getTime() - leadMinutes * 60000);
  if (triggerAt.getTime() <= Date.now()) {
    delete map[babyId];
    await saveMap(map);
    await logTelemetry('alert_scheduled', { babyId, ok: false, reason: 'window_in_past' });
    return { ok: false, reason: 'window_in_past' };
  }

  // Ver el mismo try/catch en lib/openNapAlerts.js: antes, un fallo de
  // scheduleNotificationAsync acá no dejaba rastro — el aviso simplemente no
  // se agendaba y nadie se enteraba nunca, ni siquiera en telemetría.
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Nocttua',
        body: `${babyName}: ventana ${new Date(windowStartLocalISO).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}.`,
        data: { alertKey, babyId, kind: 'window' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerAt },
    });
    map[babyId] = { alertKey, notificationId };
    await saveMap(map);
    await logTelemetry('alert_scheduled', { babyId, ok: true, alertKey, triggerAt: triggerAt.toISOString() });
  } catch (err) {
    await logTelemetry('alert_scheduled', { babyId, ok: false, reason: 'schedule_failed', error: String(err?.message ?? err) });
    return { ok: false, reason: 'schedule_failed' };
  }
  return { ok: true };
}

export async function cancelWindowAlert(babyId) {
  const map = await loadMap();
  const existing = map[babyId];
  if (!existing) return;
  await Notifications.cancelScheduledNotificationAsync(existing.notificationId).catch(() => {});
  delete map[babyId];
  await saveMap(map);
}

/** Se registra una vez en el punto de entrada de la app (App.js). */
export function observeDeliveredWindowAlerts() {
  return Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data;
    if (data?.kind === 'window') {
      logTelemetry('alert_delivered', { babyId: data.babyId, alertKey: data.alertKey });
    }
  });
}
