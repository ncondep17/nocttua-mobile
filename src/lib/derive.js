import { toMin, fmt, dur, avg, one } from './time';
import { predictedWindowMin } from './assessment';

/**
 * EL MOTOR DE CÁLCULO — portado del paquete de diseño aprobado, adaptado
 * para operar sobre `records` reales (ver data/dayRecords.js) en vez del
 * REC fijo del prototipo. La forma de cada función es la misma; donde el
 * prototipo importaba REC/DAYS a nivel de módulo, acá se reciben como
 * parámetro.
 *
 * Regla del producto (sin cambios): la analítica DESCRIBE, no califica.
 */

export const perBaby = (records, b) => records.filter((r) => r.b === b);

export const windowOf = (r) => toMin(r.asleep) - toMin(r.wake);
export const latencyOf = (r) => toMin(r.asleep) - toMin(r.start);
export const napLenOf = (r) => toMin(r.end) - toMin(r.asleep);

/** Solo los registros con siesta completa (start/asleep/end): sin eso no hay latencia ni ventana. */
const withNap = (records) => records.filter((r) => r.start && r.asleep && r.end && r.wake);

export const avgWindow = (records) => avg(withNap(records).map(windowOf));
export const avgLatency = (records) => avg(withNap(records).map(latencyOf));
export const avgNapLen = (records) => avg(withNap(records).map(napLenOf));
export const baseWakes = (records) => avg(records.map((r) => r.wakes));
export const avgNightFeeds = (records) => avg(records.map((r) => r.nf));
export const avgFeeds = (records) => avg(records.map((r) => r.feeds));
/** ml promedio tomados en despertares nocturnos por noche — para separar "se despierta" de "se despierta y toma mucho". */
export const avgNightFeedMl = (records) => avg(records.map((r) => r.nightFeedMl ?? 0));

/** Intervalos de un registro en minutos desde las 6:00 de ese día (0..1440). */
export function intervals(r) {
  const o = 360;
  return {
    wake: r.wake ? toMin(r.wake) - o : null,
    asleep: r.asleep ? toMin(r.asleep) - o : null,
    end: r.end ? toMin(r.end) - o : null,
    night: toMin(r.night) - o,
  };
}

/**
 * Plan del día derivado del perfil de edad: despertar → N siestas → noche.
 * `todayWake` son las horas reales de despertar de hoy si ya se registraron
 * (una por bebé, en minutos); si falta, ese bloque queda como "sugerido"
 * igual que el resto en vez de inventar una hora.
 *
 * `todayNaps` (opcional, una lista por bebé de {start,end} ya registrados
 * hoy — ver dayRecords.getTodayNaps) y `todayNightStart` (opcional, minuto
 * en que empezó la noche de hoy, si ya se registró) hacen que cada bloque
 * refleje lo que YA pasó de verdad en vez de mostrar siempre la sugerencia
 * teórica: la siesta ya registrada ancla la ventana de la siguiente.
 *
 * `recentRecords` (opcional, el `records` de buildDayRecords con `.b` por
 * bebé) hace que las horas SUGERIDAS dejen de salir siempre de la tabla de
 * edad (`p.windowMin`/`p.napMin`) y usen la mediana real una vez que un bebé
 * tiene ≥3 sueños medidos (ver predictedWindowMin en lib/assessment.js —
 * regla 3 del README del assessment). Como 01_TodayScreen y MorningScreen ya
 * llaman a planBlocks(), pasar `recentRecords` actualiza la cuenta regresiva,
 * "El plan de hoy" y el horario predicho de Mañana a la vez, sin que quede
 * un número personalizado al lado de uno genérico para el mismo bebé.
 */
export function planBlocks(p, todayWake, todayNaps, todayNightStart, recentRecords) {
  const naps = todayNaps ?? todayWake.map(() => []);
  const nightStart = todayNightStart ?? todayWake.map(() => null);

  const wakeLogged = todayWake.map((w) => w != null);
  const wake = todayWake.map((w) => w ?? toMin('6:30'));
  const out = [{
    key: 'wake', label: 'Mañana', logged: wakeLogged.every(Boolean),
    times: wake.map((w) => fmt(w)), atMin: wake.slice(), details: wakeLogged.map((l) => (l ? 'registrado' : 'No has registrado el despertar')),
  }];
  const cursor = wake.slice();
  const windowMinFor = (b) => (recentRecords ? predictedWindowMin(perBaby(recentRecords, b), 'window', p.windowMin) : p.windowMin);
  const napMinFor = (b) => (recentRecords ? predictedWindowMin(perBaby(recentRecords, b), 'nap', p.napMin) : p.napMin);
  // Cuántos cuadros de siesta mostrar: el número esperado para la edad, o
  // los que ya se registraron de verdad hoy si son más — así un día de 2
  // siestas con un bebé de "1 siesta" no pierde la segunda del mapa.
  const napCount = Math.max(p.naps, ...naps.map((n) => n.length));
  for (let i = 0; i < napCount; i++) {
    const real = naps.map((n) => n[i] ?? null);
    const suggested = cursor.map((c, b) => c + windowMinFor(b));
    const atMin = real.map((r, b) => r?.start ?? suggested[b]);
    out.push({
      key: 'nap' + i,
      label: p.naps === 1 ? 'Siesta' : 'Siesta ' + (i + 1),
      // "logged" quiere decir COMPLETA — una siesta que sigue abierta (end
      // null, se está durmiendo ahora mismo) no cuenta como registrada
      // todavía: si contara, la próxima ventana "saltaba" la siesta en
      // curso y mostraba la hora de acostarse de esta noche como si la
      // siesta ya hubiera pasado.
      logged: real.every((r) => r != null && r.end != null),
      open: real.some((r) => r != null && r.end == null),
      times: atMin.map(fmt), atMin,
      // Tres estados: sin empezar (ventana sugerida), empezada pero sin
      // completar (end null — se está durmiendo ahora), o completa.
      details: real.map((r) => (!r ? 'No has registrado la siesta' : r.end == null ? 'durmiendo ahora' : 'durmió ' + dur(r.end - r.start))),
    });
    // El cursor es "desde cuándo contar la próxima ventana": si la siesta ya
    // terminó de verdad, es su hora real de fin; si sigue abierta o no
    // empezó, la cadena teórica (una siesta sin completar no puede anclar
    // la ventana de la siguiente con un dato que todavía no existe).
    for (let b = 0; b < cursor.length; b++) {
      cursor[b] = (real[b] && real[b].end != null) ? real[b].end : cursor[b] + windowMinFor(b) + napMinFor(b);
    }
  }
  const suggestedNight = cursor.map((c, b) => c + windowMinFor(b));
  const nightAtMin = nightStart.map((n, b) => n ?? suggestedNight[b]);
  out.push({
    key: 'night', label: 'Noche', logged: nightStart.every((n) => n != null),
    times: nightAtMin.map(fmt), atMin: nightAtMin,
    // Este bloque es siempre la noche que ARRANCA hoy (la de esta noche, no
    // la de anoche — ver getTodayNightStart) — "No has registrado el sueño
    // de noche" a las 8am se leía como un reclamo sobre anoche en vez de
    // "todavía no empezó la de hoy", que es lo que de verdad dice.
    details: nightStart.map((n) => (n != null ? 'registrado' : 'Sugerida para esta noche, todavía no empezó')),
  });
  return out;
}

/** Hora de un evento de alimentación, normalizada (madrugada va al final del día). */
export const feedAt = (e) => {
  const d = new Date(e.started_at);
  const v = d.getHours() * 60 + d.getMinutes();
  return v < 300 ? v + 1440 : v;
};

/**
 * Eventos de alimentación de las últimas 24 h. Por reloj corrido, no por
 * fecha de calendario: una toma de las 11pm de anoche sigue "reciente" a las
 * 6am, y con el filtro de calendario desaparecía apenas cruzaba la
 * medianoche — mismo criterio que usa Leche, que sí las mostraba.
 */
export function feedsDone(feedEvents) {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  return feedEvents.filter((e) => new Date(e.started_at).getTime() >= since);
}

/**
 * Factores asociados a más despertares.
 * Regla dura: un factor solo se muestra con 3+ noches registradas, y se
 * etiqueta como asociación, nunca como causa.
 */
export function correlations(records) {
  const base = baseWakes(records);
  const napped = withNap(records);
  const defs = [
    { label: 'Ventana de la mañana por encima de 6 h', rows: napped.filter((r) => windowOf(r) > 360) },
    { label: 'Se durmió en brazos o cargada', rows: records.filter((r) => r.place === 'En brazos' || r.contact === 'Cargada') },
    { label: 'Se durmió con la toma en la boca', rows: records.filter((r) => r.contact === 'Con la toma') },
    { label: 'Dos o más tomas nocturnas', rows: records.filter((r) => r.nf >= 2) },
    { label: 'Costó mucho para dormirse', rows: records.filter((r) => r.fallAsleepMood === 'Costó mucho') },
    { label: 'Berrinche a la hora de dormir', rows: records.filter((r) => r.fallAsleepMood === 'Con berrinche') },
    { label: 'Teething marcado', rows: records.filter((r) => (r.factors || []).indexOf('Teething') >= 0) },
    { label: 'Cena escasa', rows: records.filter((r) => (r.factors || []).indexOf('Cena escasa') >= 0) },
    { label: 'Se durmió sola en cuna o cama Montessori', rows: records.filter((r) => (r.place === 'Su cuna' || r.place === 'Cama Montessori') && r.contact !== 'Cargada') },
  ];
  return defs
    .filter((c) => c.rows.length >= 8)
    .map((c) => {
      const m = avg(c.rows.map((r) => r.wakes));
      const up = m > base;
      return {
        label: c.label, n: c.rows.length + ' noches', raw: m, up, mean: m,
        value: one(m) + (up ? ' ↑' : ' ↓'), pct: Math.round((m / 6.5) * 100),
        color: up ? '#D9705A' : '#7FB09A',
      };
    })
    .sort((a, b) => b.raw - a.raw);
}

export const DAYS_WITH_DATA_MIN = 5;

/**
 * Ventana de análisis por DÍAS CON DATO, no por calendario — si la mamá
 * falló un par de días, "últimos 7 días de calendario" salía casi vacío.
 * `records` ya debe venir escopeado (un bebé, o toda la família si aplica);
 * el día cuenta como "con dato" si tiene ≥1 registro real (source !=
 * 'assumed' — un día resuelto con "todo normal" no es una medición).
 *
 *   status 'full'         → hay >= targetDays días con dato: se toman los
 *                            últimos `targetDays`, aunque abarquen más fechas.
 *   status 'partial'      → hay entre minDays y targetDays: se toman todos,
 *                            rotulados "N días con registro".
 *   status 'insufficient' → hay menos que minDays: NUNCA se ocultan las
 *                            analíticas — se listan los días que sí hay,
 *                            más cuántos faltan para ver tendencias.
 */
export function daysWithDataWindow(records, { targetDays = 14, minDays = DAYS_WITH_DATA_MIN } = {}) {
  const measuredDayKeys = Array.from(new Set(records.filter((r) => r.source !== 'assumed').map((r) => r.day))).sort().reverse();
  const total = measuredDayKeys.length;
  if (total >= targetDays) {
    return { status: 'full', dayKeys: measuredDayKeys.slice(0, targetDays).reverse(), n: targetDays };
  }
  if (total >= minDays) {
    return { status: 'partial', dayKeys: measuredDayKeys.slice().reverse(), n: total };
  }
  return { status: 'insufficient', dayKeys: measuredDayKeys.slice().reverse(), n: total, needed: minDays - total };
}

/**
 * Cumplimiento del plan contra los umbrales guardados en plan_thresholds.
 * Verde ≥70%, ámbar ≥40%, coral por debajo.
 */
export function compliance(records, thresholds) {
  const d = thresholds;
  const napped = withNap(records);
  if (!d || napped.length === 0) return null;
  const checks = [
    { label: 'Inicio de siesta', threshold: '±30 min de ' + fmt(d.nap_start_min),
      real: (r) => toMin(r.start), fmtR: (v) => fmt(Math.round(v)),
      ok: (r) => Math.abs(toMin(r.start) - d.nap_start_min) <= 30 },
    { label: 'Duración de siesta', threshold: 'máx ' + dur(d.nap_max_min),
      real: (r) => napLenOf(r), fmtR: (v) => dur(Math.round(v)),
      ok: (r) => napLenOf(r) <= d.nap_max_min + 10 },
    { label: 'Hora de dormir', threshold: '±30 min de ' + fmt(d.night_min),
      real: (r) => toMin(r.night), fmtR: (v) => fmt(Math.round(v)),
      ok: (r) => Math.abs(toMin(r.night) - d.night_min) <= 30 },
    { label: 'Se durmió sin brazos', threshold: 'cuna o Montessori',
      real: (r) => (r.contact === 'Cargada' ? 0 : 1), fmtR: (v) => Math.round(v * napped.length) + '/' + napped.length,
      ok: (r) => r.contact !== 'Cargada' },
    { label: 'Despertares nocturnos', threshold: 'máx ' + d.wakes_max,
      real: (r) => r.wakes, fmtR: (v) => one(v), ok: (r) => r.wakes <= d.wakes_max },
    { label: 'Sin tomas nocturnas', threshold: '0 por noche',
      real: (r) => r.nf, fmtR: (v) => one(v), ok: (r) => r.nf === 0 },
  ];
  const rows = checks.map((c) => {
    const hits = napped.filter(c.ok).length;
    const pct = Math.round((hits / napped.length) * 100);
    const good = pct >= 70, mid = pct >= 40;
    return {
      label: c.label, threshold: c.threshold, real: c.fmtR(avg(napped.map(c.real))), pct, good, mid,
      icon: good ? '✓' : mid ? '~' : '✕',
      iconBg: good ? '#DCEDE4' : mid ? '#FFF3E3' : '#FBE4DF',
      iconFg: good ? '#3F7A62' : mid ? '#B07A3C' : '#C0533C',
      tone: good ? '#3F7A62' : mid ? '#B07A3C' : '#D9705A',
    };
  });
  const okN = rows.filter((r) => r.good).length;
  const midN = rows.filter((r) => r.mid && !r.good).length;
  const badN = rows.length - okN - midN;
  const pct = Math.round(avg(rows.map((r) => r.pct)));
  const worst = rows.slice().sort((a, b) => a.pct - b.pct)[0];
  return {
    rows, pct, ok: okN, total: rows.length,
    bar: [{ n: okN, color: '#3F7A62' }, { n: midN, color: '#F0A868' }, { n: badN, color: '#D9705A' }]
      .filter((x) => x.n > 0)
      .map((x) => ({ width: ((x.n / rows.length) * 100).toFixed(1) + '%', color: x.color })),
    note: badN > 0
      ? 'Lo que más se está saliendo del plan son los ' + worst.label.toLowerCase() + '. El inicio de siesta y la hora de dormir sí se están respetando, así que el problema no es de ejecución sino de umbral.'
      : 'El plan se está ejecutando como se acordó. Si la noche no mejora, hay que ajustar el plan, no la ejecución.',
  };
}

/**
 * Mapa de calor de un día: barra de 24 h desde las 6:00.
 * noche #2C2C52 · siesta #6B5DD3 · despierta #F6EFE2 · despertar #F0A868
 */
export function heatRow(records, dayKey, baby, dayLabel) {
  const r = records.filter((x) => x.day === dayKey && x.b === baby)[0];
  if (!r) return null;
  const iv = intervals(r);
  if (iv.wake == null || iv.asleep == null || iv.end == null) return null;
  const napLen = iv.end - iv.asleep;
  const segments = [
    { m: iv.wake, bg: '#2C2C52' },
    { m: iv.asleep - iv.wake, bg: '#F6EFE2' },
    { m: napLen, bg: '#6B5DD3' },
    { m: iv.night - iv.end, bg: '#F6EFE2' },
    { m: 1440 - iv.night, bg: '#2C2C52' },
  ].filter((s) => s.m > 0).map((s) => ({ width: ((s.m / 1440) * 100).toFixed(2) + '%', bg: s.bg }));
  const ticks = [4, 8, 12, 16, 20].map((h) => ((h / 24) * 100).toFixed(2) + '%');
  const dots = [];
  for (let i = 0; i < r.wakes; i++) {
    const at = iv.night + Math.round(((i + 1) / (r.wakes + 1)) * (1440 - iv.night));
    dots.push(((at / 1440) * 100).toFixed(2) + '%');
  }
  return {
    day: dayLabel, segments, ticks, dots,
    napLabel: dur(napLen), napLabelLeft: (((iv.asleep + napLen / 2) / 1440) * 100).toFixed(2) + '%',
  };
}

/** Detalle de un día: la hoja que se abre al tocar una fila del mapa. */
export function dayDetail(records, dayKey, baby, weekdayLabel, dayTitle) {
  const r = records.filter((x) => x.day === dayKey && x.b === baby)[0];
  if (!r || !r.start) return null;
  const win = windowOf(r), latency = latencyOf(r), napLen = napLenOf(r);
  const good = r.wakes <= 3;
  const row = (label, value, tone) => ({ label, value, tone: tone || '#16162B' });
  return {
    weekday: weekdayLabel + ' · ' + (r.b === 0 ? 'A' : 'B'),
    title: dayTitle,
    good,
    verdict: good
      ? 'Buena noche: ' + r.wakes + ' despertares con una ventana de ' + dur(win) + '.'
      : r.wakes + ' despertares. La ventana de la mañana fue de ' + dur(win) + ', ' + (win > 360 ? 'por encima del objetivo.' : 'dentro de rango — mira los factores.'),
    rows: [
      row('Despertó en la mañana', r.wake),
      row('Empezamos a dormirla', r.start),
      row('Se durmió', r.asleep, latency > 25 ? '#D9705A' : '#7FB09A'),
      row('Tardó en dormirse', dur(latency), latency > 25 ? '#D9705A' : '#7FB09A'),
      row('Ventana previa', dur(win), win > 360 ? '#D9705A' : '#7FB09A'),
      row('Despertó de la siesta', r.end),
      row('Duró la siesta', dur(napLen)),
      row('Empezó la noche', r.night),
      row('Durmió de noche', dur(r.nightMin)),
      row('Despertares nocturnos', String(r.wakes), r.wakes >= 4 ? '#D9705A' : '#7FB09A'),
      row('Tomas · de noche', r.feeds + ' · ' + r.nf, r.nf >= 2 ? '#D9705A' : '#7FB09A'),
      row('Total en 24 h', dur(napLen + r.nightMin)),
    ],
    context: 'Se durmió en ' + (r.place || 'sin registrar').toLowerCase() + ' con ' + (r.contact || 'sin registrar').toLowerCase() + '.'
      + (r.mood ? ' Despertó de ' + r.mood.toLowerCase() + '.' : '') + ' Toma antes de dormir: ' + (r.feedType || 'sin toma').toLowerCase() + '.'
      + ((r.factors || []).length ? ' Factores marcados: ' + r.factors.join(', ').toLowerCase() + '.' : ' Sin factores marcados.'),
  };
}

/** Comparación entre dos bebés: cinco métricas, barras espejadas desde el centro. Null si hay un solo bebé. */
export function twinRows(records) {
  const a = withNap(perBaby(records, 0)), b = withNap(perBaby(records, 1));
  if (a.length === 0 || b.length === 0) return null;
  const metric = (label, fn, fmtFn, lowerBetter) => {
    const av = avg(a.map(fn)), bv = avg(b.map(fn));
    const max = Math.max(av, bv) || 1;
    const aWins = lowerBetter ? av <= bv : av >= bv;
    const bWins = lowerBetter ? bv <= av : bv >= av;
    return {
      label, a: fmtFn(av), b: fmtFn(bv),
      aPct: Math.round((av / max) * 100), bPct: Math.round((bv / max) * 100),
      aColor: aWins ? '#6B5DD3' : '#B9AFEA', bColor: bWins ? '#C2703F' : '#E8B694',
    };
  };
  return [
    metric('despertares / noche', (r) => r.wakes, (v) => one(v), true),
    metric('tardó en dormirse', (r) => latencyOf(r), (v) => Math.round(v) + ' min', true),
    metric('siesta', (r) => napLenOf(r), (v) => dur(Math.round(v)), false),
    metric('noche', (r) => r.nightMin, (v) => dur(Math.round(v)), false),
    metric('tomas nocturnas', (r) => r.nf, (v) => one(v), true),
  ];
}

export function twinGap(records) {
  const a = perBaby(records, 0), b = perBaby(records, 1);
  if (a.length === 0 || b.length === 0) return null;
  const d = Math.abs(avg(a.map((r) => r.wakes)) - avg(b.map((r) => r.wakes)));
  const parejas = d < 0.6;
  return { label: parejas ? 'Van parejas' : 'Se están separando', bg: parejas ? '#DCEDE4' : '#FFF3E3', fg: parejas ? '#3F7A62' : '#B07A3C' };
}

export function twinVerdict(records, names) {
  const a = withNap(perBaby(records, 0)), b = withNap(perBaby(records, 1));
  if (a.length === 0 || b.length === 0) return null;
  const la = avg(a.map(latencyOf)), lb = avg(b.map(latencyOf));
  const armsA = perBaby(records, 0).filter((r) => r.contact === 'Cargada').length;
  const armsB = perBaby(records, 1).filter((r) => r.contact === 'Cargada').length;
  const diff = Math.round(lb - la);
  const [nameA, nameB] = names;
  return diff === 0
    ? nameA + ' y ' + nameB + ' tardan lo mismo en dormirse esta semana.'
    : (diff > 0 ? nameB : nameA) + ' tarda ' + Math.abs(diff) + ' min más en dormirse y necesitó brazos ' + (diff > 0 ? armsB : armsA) + ' de ' + Math.max(a.length, b.length) + ' noches, contra ' + (diff > 0 ? armsA : armsB) + ' de ' + (diff > 0 ? nameA : nameB) + '. Misma casa, mismo horario: la diferencia está en cómo la acompañamos.';
}

/**
 * Sueño real de 24 h contra el rango esperado de la edad. `babyIndices` es
 * la lista de bebés a mostrar — normalmente solo la seleccionada en la
 * pantalla (ver 03_AnalyticsScreen.jsx), para no mezclar con el resto de la
 * pantalla, que ya filtra por esa misma selección.
 */
export function restRows(p, records, babyIndices) {
  return babyIndices.map((b) => {
    const own = withNap(perBaby(records, b));
    const r = own[own.length - 1];
    if (!r) return null;
    const t = (napLenOf(r) + r.nightMin) / 60;
    const lo = p.totalLow, hi = p.totalHigh;
    const axLo = lo - 3, axHi = hi + 2, span = axHi - axLo;
    const pos = Math.max(0, Math.min(100, ((t - axLo) / span) * 100));
    const inRange = t >= lo && t <= hi;
    return {
      baby: b, value: dur(Math.round(t * 60)), inRange,
      tag: inRange ? 'en rango' : t < lo ? 'por debajo' : 'por encima',
      color: inRange ? '#3F7A62' : '#F0A868',
      band: lo + '–' + hi + ' h', axisLow: axLo + ' h', axisHigh: axHi + ' h',
      bandLeft: (((lo - axLo) / span) * 100).toFixed(1) + '%',
      bandRight: (((axHi - hi) / span) * 100).toFixed(1) + '%',
      dotLeft: pos.toFixed(1) + '%',
    };
  }).filter(Boolean);
}

/** Bandera suave: 5+ días por debajo del rango. Nunca alarmista, nunca diagnóstico. */
export function restFlag(p, records) {
  return withNap(records).filter((r) => (napLenOf(r) + r.nightMin) / 60 < p.totalLow).length >= 5;
}

/** Cómo se durmieron: agrupa los tipos de contacto de la semana. */
export function howBar(records) {
  const total = records.length;
  if (total === 0) return [];
  const groups = [
    // 'Sola' es el valor viejo (antes de renombrar el chip) — se sigue
    // agrupando junto al nuevo para no perder los registros históricos.
    { label: 'Sola', keys: ['Sola', 'No necesitó contacto', 'Mano encima'], color: '#3F7A62' },
    { label: 'Palmaditas', keys: ['Palmaditas'], color: '#6B5DD3' },
    { label: 'En brazos', keys: ['Cargada'], color: '#D9705A' },
    { label: 'Con la toma', keys: ['Con la toma'], color: '#F0A868' },
  ];
  return groups.map((g) => {
    const n = records.filter((r) => g.keys.indexOf(r.contact) >= 0).length;
    return { label: g.label, count: n, color: g.color, width: ((n / total) * 100).toFixed(1) + '%' };
  }).filter((x) => x.count > 0);
}

/** Despertares por hora de la noche. Antes de medianoche = sobrecansancio. */
export function wakesByHour(records) {
  const hrs = [20, 21, 22, 23, 0, 1, 2, 3, 4, 5];
  const buckets = {};
  hrs.forEach((h) => { buckets[h] = 0; });
  records.forEach((r) => {
    const nStart = toMin(r.night);
    for (let i = 0; i < r.wakes; i++) {
      const at = (nStart + Math.round(((i + 1) / (r.wakes + 1)) * (1440 + 360 - nStart))) % 1440;
      const h = Math.floor(at / 60);
      if (buckets[h] !== undefined) buckets[h]++;
    }
  });
  const max = Math.max.apply(null, hrs.map((h) => buckets[h])) || 1;
  return hrs.map((h) => ({
    label: h === 0 ? '12a' : h < 12 ? h + 'a' : h === 12 ? '12p' : h - 12 + 'p',
    pct: Math.max(4, Math.round((buckets[h] / max) * 92)),
    color: h >= 20 || h === 23 ? '#F0A868' : '#6B5DD3',
  }));
}

/** Curva de despertares de la semana, en coordenadas del SVG de 340×128. */
/**
 * `dayKeys` puede ser de largo variable (14/30/90, ver daysWithDataWindow) —
 * los días sin dato NO entran como punto en 0: se saltan, para que la línea
 * conecte los días reales sin fingir un despertar medido que no existió.
 */
export function wakeCurve(records, baby, dayKeys) {
  const withData = dayKeys
    .map((key) => ({ key, r: records.filter((x) => x.day === key && x.b === baby)[0] }))
    .filter((d) => d.r);
  const n = withData.length;
  const step = n > 1 ? 312 / (n - 1) : 0;
  const pts = withData.map((d, i) => ({
    x: +(14 + i * step).toFixed(1), y: +(102 - (d.r.wakes / 7) * 84).toFixed(1), wakes: d.r.wakes, day: d.key.slice(8, 10),
  }));
  return {
    points: pts,
    n,
    line: pts.map((p) => p.x + ',' + p.y).join(' '),
    area: pts.length ? '14,102 ' + pts.map((p) => p.x + ',' + p.y).join(' ') + ' 326,102' : '',
  };
}

/** Dispersión ventana → despertares, en coordenadas del SVG de 340×150. */
export function scatter(p, records) {
  const napped = withNap(records);
  const x = (m) => +(34 + ((m - 240) / 200) * 290).toFixed(1);
  return {
    targetX: x(p.windowMin),
    xAxis: [270, 330, 390].map((m) => ({ x: x(m), label: dur(m) })),
    yAxis: [0, 2, 4, 6].map((w) => ({ y: +(118 - (w / 7) * 108 + 3).toFixed(1), label: String(w) })),
    dots: napped.map((r, i) => ({ x: x(windowOf(r)), y: +(118 - (r.wakes / 7) * 108).toFixed(1), baby: r.b, delay: (i * 0.035).toFixed(2) + 's' })),
  };
}

/**
 * Patrones de tomas al pecho para Leche. `feeds` ya debe venir mezclado con
 * las tomas embebidas en registros de sueño (ver withEmbeddedFeeds) — si no,
 * toda toma "antes de dormir" queda invisible acá también, mismo bug que ya
 * se encontró en Hoy y Analíticas.
 */

/** Cuántas tomas fueron de cada lado — para saber si conviene ofrecer más el otro. */
export function feedSideBalance(feeds) {
  const left = feeds.filter((e) => e.kind === 'Pecho izq.').length;
  const right = feeds.filter((e) => e.kind === 'Pecho der.').length;
  const total = Math.max(1, left + right);
  return { left, right, leftPct: Math.round((left / total) * 100), rightPct: Math.round((right / total) * 100) };
}

/** Duración promedio (min) de las tomas al pecho por día, últimos `days` días. */
export function feedDurationByDay(feeds, days = 7) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const dayFeeds = feeds.filter((e) => new Date(e.started_at).toDateString() === key && e.feed_minutes != null);
    const avgMin = dayFeeds.length ? Math.round(dayFeeds.reduce((a, e) => a + e.feed_minutes, 0) / dayFeeds.length) : 0;
    out.push({ day: d.getDate(), avgMin });
  }
  return out;
}

/** Horarios de toma de la semana, en coordenadas de un SVG de 340×120 (x = día, y = hora del día). */
export function feedTimeScatter(feeds, days = 7) {
  const today0 = new Date();
  today0.setHours(0, 0, 0, 0);
  const keys = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today0);
    d.setDate(d.getDate() - i);
    keys.push(d.toDateString());
  }
  const xOf = (i) => +(30 + (i / Math.max(1, days - 1)) * 300).toFixed(1);
  const yOf = (minOfDay) => +(112 - (minOfDay / 1440) * 100).toFixed(1);
  return {
    xAxis: keys.map((k, i) => ({ x: xOf(i), label: String(new Date(k).getDate()) })),
    yAxis: [0, 360, 720, 1080, 1440].map((m) => ({ y: yOf(m), label: m === 0 ? '0h' : String(m / 60) + 'h' })),
    dots: feeds
      .map((e) => {
        const d = new Date(e.started_at);
        const idx = keys.indexOf(d.toDateString());
        if (idx < 0) return null;
        return { x: xOf(idx), y: yOf(d.getHours() * 60 + d.getMinutes()), side: e.kind };
      })
      .filter(Boolean),
  };
}

/**
 * Puntaje de la noche (0–10) — README del handoff, sección "Puntaje de la
 * noche". Cuatro componentes ponderados; el README fija los PESOS y contra
 * qué se compara cada uno, pero no la fórmula exacta de normalización a
 * 0–1 — esta es la que se implementó, documentada para poder ajustarla:
 *
 *  - Sueño nocturno vs. rango de edad (peso 0,35): 1.0 si cae dentro del
 *    rango (profile.nightLow–nightHigh); se penaliza linealmente por cada
 *    minuto fuera, hasta 0 a un 30% de desvío del límite que cruzó.
 *  - Despertares / tiempo despierto / latencia (pesos 0,30 + 0,20 + 0,15):
 *    se comparan contra la MEDIANA PROPIA del bebé en sus últimas 14 noches
 *    reales (no 'assumed') anteriores a esta — 0.5 si es igual a esa
 *    mediana, sube hacia 1.0 si mejora, baja hacia 0 si empeora, a razón de
 *    "una mediana completa de diferencia = ±0.5".
 *
 * Una noche 'assumed' no se puntúa (score: null) — no fue medida.
 */
function median(arr) {
  if (!arr.length) return null;
  const s = arr.slice().sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function rangeScore01(valueMin, lowH, highH) {
  const low = lowH * 60, high = highH * 60;
  if (valueMin >= low && valueMin <= high) return 1;
  const over = valueMin < low ? low - valueMin : valueMin - high;
  const tolerance = (valueMin < low ? low : high) * 0.3;
  return tolerance > 0 ? Math.max(0, 1 - over / tolerance) : 0.5;
}

function ownHistoryScore01(value, history) {
  // Siempre "menos es mejor" para los tres componentes que usan esto
  // (despertares, minutos despierta, latencia) — no hace falta un parámetro
  // de dirección.
  if (value == null || !history.length) return 0.5;
  const base = median(history);
  const scale = base || 1;
  return Math.max(0, Math.min(1, 0.5 + (base - value) / (scale * 2)));
}

/** Puntaje 0–10 de UNA noche ya cerrada, dado su registro y las noches reales anteriores (mismo bebé, ordenadas, sin la actual). */
function nightScoreRaw(night, priorReal, profile) {
  if (night.source === 'assumed') return null;
  const last14 = priorReal.slice(-14);
  const s1 = rangeScore01(night.nightMin, profile.nightLow, profile.nightHigh);
  const s2 = ownHistoryScore01(night.wakes, last14.map((n) => n.wakes));
  const s3 = ownHistoryScore01(night.wakeMinutes, last14.map((n) => n.wakeMinutes));
  const s4 = ownHistoryScore01(night.latencyMin, last14.map((n) => n.latencyMin).filter((v) => v != null));
  return Math.round((s1 * 0.35 + s2 * 0.3 + s3 * 0.2 + s4 * 0.15) * 100) / 10;
}

/**
 * Puntaje + delta de una noche, para mostrar en Mañana. `nights` son todos
 * los registros de noche de ESE bebé (recientes primero o no, se ordena
 * acá), ya con `day`/`source`/`wakes`/`wakeMinutes`/`latencyMin`/`nightMin`
 * (ver buildDayRecords). El delta compara contra la media de los puntajes
 * de las hasta 14 noches reales anteriores (cada una puntuada con SU propio
 * histórico previo, no con el de hoy) — mismo criterio de "14 días con
 * dato" que el resto de las analíticas.
 */
// Tres de los cuatro componentes se normalizan contra la mediana PROPIA del
// bebé (ver ownHistoryScore01) — sin noches previas, esos tres caen al
// valor neutro 0.5 por falta de dato, no porque la noche haya sido normal.
// Un puntaje construido 65% de relleno neutro se ve como un número real
// pero no lo es, así que no se muestra hasta tener algo de historial propio
// contra qué compararse.
const MIN_HISTORY_NIGHTS = 3;

export function nightScoreWithDelta(nights, targetNightId, profile) {
  const sorted = nights.slice().sort((a, b) => (a.day < b.day ? -1 : 1));
  const idx = sorted.findIndex((n) => n.nightId === targetNightId);
  if (idx < 0) return null;
  const night = sorted[idx];
  const priorAll = sorted.slice(0, idx);
  const priorReal = priorAll.filter((n) => n.source !== 'assumed');

  if (night.source === 'assumed') {
    return { score: null, assumed: true, wakes: night.wakes, wakeMinutes: night.wakeMinutes, latencyMin: night.latencyMin };
  }
  if (priorReal.length < MIN_HISTORY_NIGHTS) {
    return {
      score: null, assumed: false, insufficientHistory: true, nightsNeeded: MIN_HISTORY_NIGHTS - priorReal.length,
      wakes: night.wakes, wakeMinutes: night.wakeMinutes, latencyMin: night.latencyMin,
    };
  }

  const score = nightScoreRaw(night, priorReal, profile);
  const priorScores = priorReal.slice(-14).map((n, i, arr) => nightScoreRaw(n, arr.slice(0, i), profile)).filter((v) => v != null);
  const baseline = priorScores.length ? avg(priorScores) : null;
  return {
    score, assumed: false,
    delta: baseline != null ? Math.round((score - baseline) * 10) / 10 : null,
    wakes: night.wakes, wakeMinutes: night.wakeMinutes, latencyMin: night.latencyMin,
  };
}

/**
 * "Hoy, una sola cosa" — README del handoff. Se evalúan las reglas en
 * orden y se devuelve la primera que aplique; si ninguna aplica, un logro
 * (nunca una tarjeta vacía). `records` son los registros de ESE bebé
 * (buildDayRecords + perBaby), del más viejo al más reciente.
 */
export function oneThingToday(records, profile) {
  const withWindow = withNap(records).map((r) => ({ r, win: windowOf(r) }));
  const medWindow = median(withWindow.map((x) => x.win));
  const medWakes = median(records.map((r) => r.wakes));

  // 1. Ventana de la mañana larga: ≥30 min sobre la mediana en 2+ de los
  // últimos 4 días, y esas noches tuvieron más despertares que la mediana.
  if (medWindow != null && medWakes != null) {
    const longDays = withWindow.slice(-4).filter(({ r, win }) => win - medWindow >= 30 && r.wakes > medWakes);
    if (longDays.length >= 2) {
      const suggestedMin = toMin(longDays[longDays.length - 1].r.asleep) - Math.round(medWindow);
      return { text: 'Adelanta la primera siesta a las ' + fmt(((suggestedMin % 1440) + 1440) % 1440) + '.', kind: 'window' };
    }
  }

  // 2. Última siesta termina muy cerca de la noche (menos de 2h30 antes de
  // la hora de acostarse de referencia de su edad).
  const lastWithNap = records.slice().reverse().find((r) => r.end);
  if (lastWithNap) {
    const bedMin = toMin(profile.bed);
    const endMin = toMin(lastWithNap.end);
    if (bedMin - endMin < 150 && bedMin - endMin >= 0) {
      return { text: 'Corta la última siesta a las ' + fmt(Math.max(0, bedMin - 150)) + '.', kind: 'nap' };
    }
  }

  // 3. Latencia alta: más de 25 min en 3 de las últimas 5 noches.
  const last5Lat = records.slice(-5).filter((r) => r.latencyMin != null);
  if (last5Lat.filter((r) => r.latencyMin > 25).length >= 3) {
    return { text: 'Corre la rutina 15 minutos más temprano.', kind: 'latency' };
  }

  // 4. Se durmió cargada o con la toma en 70%+ de los inicios (con datos suficientes).
  const withContact = records.filter((r) => r.contact);
  const heldOrFed = withContact.filter((r) => r.contact === 'Cargada' || r.contact === 'Con la toma');
  if (withContact.length >= 3 && heldOrFed.length / withContact.length >= 0.7) {
    return { text: 'Prueba el siguiente paso de la escalera del plan.', kind: 'method' };
  }

  // 5. Nada aplica: un logro si lo hay, si no, aliento a seguir registrando.
  const lastTwo = records.slice(-2);
  if (lastTwo.length === 2 && lastTwo.every((r) => r.wakes <= 2)) {
    return { text: 'Dos noches seguidas con 2 despertares o menos.', kind: 'achievement' };
  }
  return { text: 'Sigue registrando para que esta sección empiece a decir algo.', kind: 'none' };
}
