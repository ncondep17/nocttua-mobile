import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persistencia local (un solo dispositivo, igual que los motores de aviso)
 * de los hitos ya celebrados — para no repetir el mismo banner cada mañana
 * y para alimentar "Ver otros wins". `id` viene de milestones.js y es
 * estable por hito (no por día), así que una vez visto no vuelve.
 */
const STORAGE_KEY = 'nocttua.milestoneLog.v1';
const MAX_ENTRIES = 50;

async function loadLog() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function hasSeenMilestone(id) {
  const log = await loadLog();
  return log.some((m) => m.id === id);
}

/** Lo agrega al log (si es nuevo) y de paso lo marca como visto — se llama apenas se detecta, independiente de si el banner llega a mostrarse (después de medio día, por ejemplo). */
export async function recordMilestone(milestone) {
  const log = await loadLog();
  if (log.some((m) => m.id === milestone.id)) return;
  log.unshift({ ...milestone, achievedAt: new Date().toISOString() });
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(log.slice(0, MAX_ENTRIES)));
}

export async function getMilestoneLog() {
  return loadLog();
}
