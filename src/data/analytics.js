import { supabase } from '../lib/supabase';

const DAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

async function getSleepEventsSince(familyId, since, session) {
  let query = supabase
    .from('events')
    .select('started_at, ended_at, place, fell_asleep_feeding, session, wake_count')
    .eq('family_id', familyId)
    .eq('type', 'sleep')
    .gte('started_at', since.toISOString())
    .not('ended_at', 'is', null);
  if (session) query = query.eq('session', session);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/** Horas de sueño de NOCHE por día, últimos 7 días (las siestas no cuentan acá, se miden aparte). */
export async function getWeekNights(familyId) {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);
  const events = await getSleepEventsSince(familyId, since, 'night');

  const byDay = new Map();
  for (let i = 0; i < 7; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    byDay.set(d.toDateString(), 0);
  }
  for (const e of events) {
    const key = new Date(e.started_at).toDateString();
    if (!byDay.has(key)) continue;
    const hours = (new Date(e.ended_at) - new Date(e.started_at)) / 3600000;
    byDay.set(key, byDay.get(key) + hours);
  }

  return Array.from(byDay.entries()).map(([dateStr, hours]) => ({
    label: DAY_LETTERS[new Date(dateStr).getDay()],
    value: Math.round(hours * 10) / 10,
    display: (Math.round(hours * 10) / 10).toString().replace('.', ','),
  }));
}

/**
 * Métricas honestas de "lo que se repite": solo lo que el schema puede
 * respaldar hoy (lugar del sueño, si se durmió tomando, despertares
 * nocturnos). Ventanas respetadas y desfase entre bebés quedan para cuando
 * exista el cálculo de ventana por edad (ver plan, "Fases siguientes") — no
 * se inventan porcentajes.
 */
export async function getSleepPatternMetrics(familyId) {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);
  const events = await getSleepEventsSince(familyId, since);

  if (events.length === 0) return [];

  const inCrib = events.filter((e) => e.place === 'Cuna').length;
  const fellAsleepFeeding = events.filter((e) => e.fell_asleep_feeding).length;
  const nights = events.filter((e) => e.session === 'night');
  const avgWakes = nights.length ? nights.reduce((s, e) => s + (e.wake_count ?? 0), 0) / nights.length : null;

  const metrics = [
    {
      label: 'Sueños en cuna (no en brazos)',
      value: `${inCrib} de ${events.length}`,
      pct: Math.round((inCrib / events.length) * 100),
      tone: 'accent',
    },
    {
      label: 'Se durmió durante la toma',
      value: `${fellAsleepFeeding} de ${events.length}`,
      pct: Math.round((fellAsleepFeeding / events.length) * 100),
      tone: 'neutral',
    },
  ];

  if (avgWakes != null) {
    metrics.push({
      label: 'Despertares por noche, en promedio',
      value: avgWakes.toFixed(1).replace('.', ','),
      pct: Math.min(100, Math.round((avgWakes / 5) * 100)),
      tone: avgWakes <= 1 ? 'success' : 'warning',
    });
  }

  return metrics;
}
