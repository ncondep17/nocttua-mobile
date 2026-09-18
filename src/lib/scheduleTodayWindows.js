import { scheduleWindowAlert } from './windowAlerts';

function localISO(minutesFromMidnight) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const target = new Date(base.getTime() + minutesFromMidnight * 60000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}:00`;
}

/**
 * Conecta el motor de windowAlerts.js a una predicción real: toma el plan
 * del día (planBlocks) y agenda, para cada bebé, el próximo bloque que
 * todavía no llegó. Salta "wake" (ya pasó o es el despertar mismo, no hay
 * nada que avisar); si ya pasaron todos los bloques de hoy, no agenda nada
 * en vez de inventar una hora de mañana.
 */
export async function scheduleTodayWindowAlerts(babies, planBlocksResult, now = new Date()) {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const actionable = planBlocksResult.filter((b) => b.key !== 'wake');
  for (let i = 0; i < babies.length; i++) {
    const next = actionable.find((b) => b.atMin[i] > nowMin);
    if (!next) continue;
    await scheduleWindowAlert({
      babyId: babies[i].id,
      babyName: babies[i].name,
      windowStartLocalISO: localISO(next.atMin[i]),
    });
  }
}
