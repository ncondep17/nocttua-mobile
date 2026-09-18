import { supabase } from '../lib/supabase';

/**
 * Arma "un registro por día por bebé" (la forma que espera derive.js) a
 * partir de eventos reales de `events`. Es la pieza que reemplaza al REC
 * fijo del prototipo.
 *
 * Convención (igual que el diseño original): el registro del día D trae el
 * despertar de ESA mañana (que es el final de la sesión de noche que empezó
 * el día D-1) y la noche que EMPIEZA el día D (que termina la mañana de D+1).
 *
 * Simplificación consciente para v1: se toma una sola siesta "principal" por
 * día (la primera registrada) para latencia/ventana — en edades con varias
 * siestas esto es una aproximación, no la suma real de todas. Se documenta
 * acá para no perder el rastro cuando haya que refinarlo.
 */
function dayKey(iso) {
  const d = new Date(iso);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function fmtTime(iso) {
  const d = new Date(iso);
  return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
}
function prevDayKey(key) {
  const d = new Date(key + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  return dayKey(d.toISOString());
}

export async function getDayRecords(familyId, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const [{ data: sleepEvents, error: sleepErr }, { data: feedEvents, error: feedErr }] = await Promise.all([
    supabase.from('events').select('*').eq('family_id', familyId).eq('type', 'sleep').gte('started_at', since.toISOString()).order('started_at', { ascending: true }),
    supabase.from('events').select('*').eq('family_id', familyId).in('type', ['feed', 'pump']).gte('started_at', since.toISOString()).order('started_at', { ascending: true }),
  ]);
  if (sleepErr) throw sleepErr;
  if (feedErr) throw feedErr;

  return { sleepEvents, feedEvents };
}

/** Un evento le pertenece a `babyId` si es suyo o si se guardó "aplicar a ambas" (baby_id null). */
const belongsTo = (e, babyId) => e.baby_id === babyId || e.baby_id === null;

/**
 * La "toma antes de dormir" del log de sueño se guarda sobre el propio
 * evento de sueño (kind/volume_ml/feed_minutes), no como una fila type=feed
 * aparte — getDayRecords() solo trae type=feed/pump, así que sin este merge
 * esa toma queda invisible para todo lo que cuenta tomas del día (Hoy,
 * Analíticas), aunque Leche sí la muestre (getRecentEvents trae type=sleep
 * a propósito para esto mismo).
 */
export function withEmbeddedFeeds(sleepEvents, feedEvents) {
  return feedEvents.concat(sleepEvents.filter((e) => e.kind));
}

/** babyIds: array ordenada [tone 'a' baby id, tone 'b' baby id?] — define el índice 0/1 que usa derive.js. */

/**
 * El evento de noche cuyo despertar (ended_at) cae hoy, por bebé — el que
 * "es" el bloque Despertar de la mañana. Filtra por "terminó hoy" ANTES de
 * elegir el más reciente: si no, un registro suelto con fecha mal puesta
 * (started_at más nuevo pero ended_at de otro día) le gana el sorteo a uno
 * bueno y lo tapa sin ningún aviso — pasó de verdad con un registro
 * corregido a mano.
 */
export function getTodayWakeEvent(sleepEvents, babyIds) {
  const todayStr = new Date().toDateString();
  const sinceMs = Date.now() - 24 * 3600000;
  return babyIds.map((babyId) => {
    // "Noche" ya no carga la hora de despertar (queda null hasta que
    // "Mañana" la completa) — acá se busca tanto la noche que ya se cerró
    // hoy como la que sigue abierta desde las últimas 24 h, para que
    // "Mañana" siempre encuentre qué completar en vez de perder la noche
    // que se cargó sin despertar todavía.
    const nights = sleepEvents.filter((e) => belongsTo(e, babyId) && e.session === 'night' && (
      (e.ended_at && new Date(e.ended_at).toDateString() === todayStr) ||
      (!e.ended_at && new Date(e.started_at).getTime() >= sinceMs)
    ));
    return nights.sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0] ?? null;
  });
}

/** Hora de despertar de hoy por bebé, en minutos. Null si no hay o si la noche sigue abierta (sin completar todavía). */
export function getTodayWakeMinutes(sleepEvents, babyIds) {
  return getTodayWakeEvent(sleepEvents, babyIds).map((e) => {
    if (!e || !e.ended_at) return null;
    const d = new Date(e.ended_at);
    return d.getHours() * 60 + d.getMinutes();
  });
}

/** Siestas de hoy, empezadas o ya terminadas, por bebé, en orden — los eventos reales (para poder completarlas o editarlas). */
export function getTodayNapEvents(sleepEvents, babyIds) {
  const todayStr = new Date().toDateString();
  return babyIds.map((babyId) =>
    sleepEvents
      .filter((e) => belongsTo(e, babyId) && e.session === 'nap' && new Date(e.started_at).toDateString() === todayStr)
      .sort((a, b) => new Date(a.started_at) - new Date(b.started_at))
  );
}

/** Siestas de hoy por bebé, en minutos — `end: null` significa que ya empezó pero todavía no se completó. */
export function getTodayNaps(sleepEvents, babyIds) {
  return getTodayNapEvents(sleepEvents, babyIds).map((naps) =>
    naps.map((e) => ({
      start: new Date(e.started_at).getHours() * 60 + new Date(e.started_at).getMinutes(),
      end: e.ended_at ? new Date(e.ended_at).getHours() * 60 + new Date(e.ended_at).getMinutes() : null,
    }))
  );
}

/** El evento de noche que empezó hoy, por bebé (la noche de esta noche, el bloque Noche) — si ya se registró. */
export function getTodayNightEvent(sleepEvents, babyIds) {
  const todayStr = new Date().toDateString();
  return babyIds.map((babyId) => {
    const started = sleepEvents.filter((e) => belongsTo(e, babyId) && e.session === 'night' && new Date(e.started_at).toDateString() === todayStr);
    return started.sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0] ?? null;
  });
}

/**
 * La noche TODAVÍA ABIERTA de cada bebé, sin importar en qué día calendario
 * empezó — a diferencia de getTodayNightEvent (pensada para la mañana, filtra
 * por "empezó hoy"), Modo noche se usa a las 3am, cuando la noche abierta
 * casi siempre empezó "ayer" en el calendario.
 */
export function getOpenNightEvent(sleepEvents, babyIds) {
  return babyIds.map((babyId) => {
    const open = sleepEvents.filter((e) => belongsTo(e, babyId) && e.session === 'night' && !e.ended_at);
    return open.sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0] ?? null;
  });
}

/** La última noche YA CERRADA de cada bebé (para el reporte de la mañana) — el evento crudo, no la fila de buildDayRecords. */
export function getLastClosedNightEvent(sleepEvents, babyIds) {
  return babyIds.map((babyId) => {
    const closed = sleepEvents.filter((e) => belongsTo(e, babyId) && e.session === 'night' && e.ended_at);
    return closed.sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0] ?? null;
  });
}

/** Hora en que empezó la noche de hoy por bebé (si ya se registró), en minutos. Null si no hay. */
export function getTodayNightStart(sleepEvents, babyIds) {
  return getTodayNightEvent(sleepEvents, babyIds).map((e) => {
    if (!e) return null;
    const d = new Date(e.started_at);
    return d.getHours() * 60 + d.getMinutes();
  });
}

export function buildDayRecords(sleepEvents, feedEvents, babyIds) {
  const records = [];
  const allFeeds = withEmbeddedFeeds(sleepEvents, feedEvents);

  babyIds.forEach((babyId, babyIdx) => {
    const own = sleepEvents.filter((e) => belongsTo(e, babyId));
    const nights = own.filter((e) => e.session === 'night' && e.ended_at);
    const naps = own.filter((e) => e.session === 'nap');

    const nightByDay = new Map();
    nights.forEach((n) => nightByDay.set(dayKey(n.started_at), n));

    for (const [key, night] of nightByDay) {
      const prevNight = nightByDay.get(prevDayKey(key));
      const nap = naps.find((n) => dayKey(n.started_at) === key);
      const dayFeeds = allFeeds.filter((f) => (f.type === 'feed' || f.kind) && belongsTo(f, babyId) && dayKey(f.started_at) === key);
      // Tomas nocturnas por ventana real de la noche (started_at..ended_at),
      // no por día de calendario: una toma nocturna típica pasa después de
      // medianoche, ya en el día siguiente al que arrancó la noche, así que
      // filtrar por dayKey(f.started_at) === key las perdía casi siempre —
      // era la causa real de que "tomas nocturnas" diera 0 con tomas ya
      // registradas.
      const nightFeeds = allFeeds.filter((f) =>
        belongsTo(f, babyId) && f.feed_context === 'Despertar nocturno' &&
        new Date(f.started_at) >= new Date(night.started_at) && new Date(f.started_at) <= new Date(night.ended_at)
      );

      records.push({
        day: key,
        b: babyIdx,
        babyId,
        // Sin la noche anterior completa no hay wake real — usar la hora de
        // inicio de la siesta como "wake" (como hacía esto antes) mezclaba
        // la latencia de esa siesta con la ventana desde el despertar: dos
        // cosas distintas, y la ventana daba ~15 min en vez de horas.
        // `withNap()` en derive.js ya excluye los registros sin `wake`, así
        // que null es lo correcto acá, no un valor inventado.
        wake: prevNight ? fmtTime(prevNight.ended_at) : null,
        start: nap ? fmtTime(nap.started_at) : null,
        asleep: nap?.fell_asleep_at ? fmtTime(nap.fell_asleep_at) : null,
        end: nap?.ended_at ? fmtTime(nap.ended_at) : null,
        night: fmtTime(night.started_at),
        nightMin: Math.round((new Date(night.ended_at) - new Date(night.fell_asleep_at || night.started_at)) / 60000),
        wakes: night.wake_count ?? 0,
        // Para el puntaje de la noche (ver 06_MorningScreen.jsx): tiempo
        // despierta de madrugada acumulado, latencia real al dormirse, y si
        // esta noche fue confirmada con "todo normal" (no cuenta para el
        // puntaje ni para la línea de base de las demás).
        wakeMinutes: night.wake_minutes ?? 0,
        latencyMin: night.fell_asleep_at ? Math.round((new Date(night.fell_asleep_at) - new Date(night.started_at)) / 60000) : null,
        nightId: night.id,
        source: night.source ?? 'manual',
        place: nap?.place ?? night.place ?? null,
        contact: nap?.contact ?? night.contact ?? null,
        mood: night.wake_mood ?? null,
        fallAsleepMood: night.fall_asleep_mood ?? null,
        feedType: night.kind ?? 'Sin toma',
        feeds: dayFeeds.length,
        nf: nightFeeds.length,
        nightFeedMl: nightFeeds.reduce((a, f) => a + (f.volume_ml ?? 0), 0),
        factors: night.factors ?? [],
      });
    }
  });

  return records.sort((a, b) => (a.day < b.day ? -1 : 1));
}
