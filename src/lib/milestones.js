/**
 * Hitos y memoria — a propósito NO vive en derive.js: ese motor nunca
 * califica (correlations/compliance describen, no felicitan, ver su propio
 * comentario de cabecera) y está probado en producción. Esto es justo lo
 * contrario a propósito — celebra un logro puntual — así que se mantiene
 * separado para no arriesgar nada de lo que ya funciona ahí. Duplica lo
 * mínimo que necesita (ordenar, mediana) en vez de importar de derive.js.
 *
 * `records` es el `own = perBaby(dayRecords, babyIndex)` de siempre (ver
 * derive.js) — noches reales y asumidas de UN bebé, con `day`/`wakes`/
 * `source`/`babyId`. Se evalúan las reglas en orden; la primera que aplica
 * gana. `detectMilestone` es puro — no toca storage ni decide si ya se
 * mostró, eso es trabajo de milestoneLog.js.
 */
function sortedReal(records) {
  return records.filter((r) => r.source !== 'assumed').slice().sort((a, b) => (a.day < b.day ? -1 : 1));
}

function median(arr) {
  if (!arr.length) return null;
  const s = arr.slice().sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

const LOW_WAKES = 3;
const STREAK_TIERS = [7, 5, 3]; // se evalúa el escalón más alto primero

/**
 * El hito más relevante para este bebé AHORA, o null. `id` es estable (no
 * depende de la fecha de hoy, solo del bebé y del hito en sí) para que
 * milestoneLog.js pueda saber si ya se celebró.
 */
export function detectMilestone(records, babyName) {
  const nights = sortedReal(records);
  if (!nights.length) return null;
  const last = nights[nights.length - 1];

  // 1. Primera noche sin despertares, alguna vez — solo cuenta como hito de
  // HOY si la noche sin despertares es la más reciente (no una de hace dos
  // semanas que ya pasó de largo).
  if (last.wakes === 0 && nights.slice(0, -1).every((n) => n.wakes > 0)) {
    return { id: `zero:${last.babyId}`, text: `¡Primera noche sin despertares de ${babyName}!` };
  }

  // 2. Racha de noches seguidas con menos de LOW_WAKES despertares.
  let streak = 0;
  for (let i = nights.length - 1; i >= 0 && nights[i].wakes < LOW_WAKES; i--) streak++;
  const tier = STREAK_TIERS.find((t) => streak >= t);
  if (tier) {
    return { id: `streak:${last.babyId}:${tier}`, text: `${tier} noches seguidas de ${babyName} con menos de ${LOW_WAKES} despertares.` };
  }

  // 3. Tendencia: mediana de las últimas 7 noches reales vs. la mediana de
  // una ventana de 14 noches alrededor de hace ~90 días. Necesita datos de
  // los dos lados — sin eso no es tendencia, es ruido.
  const recent = nights.slice(-7);
  if (recent.length >= 5) {
    const cutoff = new Date(last.day);
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffKey = cutoff.toISOString().slice(0, 10);
    const around90 = nights.filter((n) => n.day <= cutoffKey).slice(-14);
    if (around90.length >= 5) {
      const now = median(recent.map((n) => n.wakes));
      const then = median(around90.map((n) => n.wakes));
      if (then - now >= 1) {
        const monthKey = last.day.slice(0, 7);
        return { id: `trend:${last.babyId}:${monthKey}`, text: `Hace ~3 meses ${babyName} se despertaba ${then} veces por noche; esta semana, ${now}.` };
      }
    }
  }

  return null;
}
