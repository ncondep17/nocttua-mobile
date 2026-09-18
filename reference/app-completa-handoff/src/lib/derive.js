import { toMin, fmt, dur, avg, one } from './time';
import { REC, DAYS, FEED_EVENTS, PUMP_WEEK, PUMP_BASE_STOCK } from '../data/records';

/**
 * EL MOTOR DE CÁLCULO.
 * Todo lo que la app afirma sale de aquí: nada está escrito a mano en las
 * pantallas. Si un número de la UI no coincide con el diseño, el bug está en
 * esta capa, no en el JSX.
 *
 * Regla del producto: la analítica DESCRIBE, no califica. No hay rachas ni
 * puntuaciones; se comparan los datos reales contra el rango de la edad.
 */

/** Registros de un bebé (0 = Mía, 1 = Lía). */
export const perBaby = b => REC.filter(r => r.b === b);

/** Ventana de vigilia de la mañana: de despertar a dormirse la siesta. */
export const windowOf = r => toMin(r.asleep) - toMin(r.wake);
/** Latencia: cuánto tardó en dormirse desde que empezaron a acostarla. */
export const latencyOf = r => toMin(r.asleep) - toMin(r.start);
export const napLenOf = r => toMin(r.end) - toMin(r.asleep);

export const avgWindow = () => avg(REC.map(windowOf));
export const avgLatency = () => avg(REC.map(latencyOf));
export const avgNapLen = () => avg(REC.map(napLenOf));
/** Media de despertares nocturnos. Es la línea base contra la que se comparan los factores. */
export const baseWakes = () => avg(REC.map(r => r.wakes));
export const avgNightFeeds = () => avg(REC.map(r => r.nf));
export const avgFeeds = () => avg(REC.map(r => r.feeds));

/** Intervalos de un registro en minutos desde las 6:00 de ese día (0..1440). */
export function intervals(r) {
  const o = 360;
  return { wake: toMin(r.wake) - o, asleep: toMin(r.asleep) - o, end: toMin(r.end) - o, night: toMin(r.night) - o };
}

/**
 * Plan del día derivado del perfil de edad: despertar → N siestas → noche.
 * Cada bloque trae la hora de cada bebé. El despertar es el único "registrado";
 * el resto son sugerencias del plan (borde violeta punteado en la UI).
 */
export function planBlocks(p) {
  const wake = [toMin('6:20'), toMin('6:15')];
  const out = [{ key: 'wake', label: 'Despertar de la mañana', logged: true, times: [fmt(wake[0]), fmt(wake[1])], details: ['buen humor', 'llorando'] }];
  const cursor = wake.slice();
  for (let i = 0; i < p.naps; i++) {
    out.push({
      key: 'nap' + i,
      label: p.naps === 1 ? 'Siesta' : 'Siesta ' + (i + 1),
      logged: i === 0 && p.naps === 1,
      times: cursor.map(c => fmt(c + p.windowMin)),
      details: ['ventana ' + dur(p.windowMin), 'ventana ' + dur(p.windowMin)],
    });
    for (let b = 0; b < 2; b++) cursor[b] = cursor[b] + p.windowMin + p.napMin;
  }
  out.push({ key: 'night', label: 'Noche', logged: false, times: cursor.map(c => fmt(c + p.windowMin)), details: ['rutina 45 min antes', 'rutina 45 min antes'] });
  return out;
}

/** Reloj simulado del prototipo: 38 min antes de la primera siesta del plan. */
export function nowMinutes(p) {
  return toMin(planBlocks(p)[1].times[0]) - 38;
}

/** Hora de un evento de alimentación, normalizada (2:40 de madrugada va al final del día). */
export const feedAt = e => { const v = toMin(e.t); return v < 300 ? v + 1440 : v; };

/** Los eventos de alimentación ya ocurridos a la hora simulada. */
export function feedsDone(p) {
  const now = nowMinutes(p);
  return FEED_EVENTS.filter(e => feedAt(e) <= now);
}

/**
 * Factores asociados a más despertares.
 * Regla dura: un factor solo se muestra con 3+ noches registradas, y se
 * etiqueta como asociación, nunca como causa.
 */
export function correlations() {
  const base = baseWakes();
  const defs = [
    { label: 'Ventana de la mañana por encima de 6 h', rows: REC.filter(r => windowOf(r) > 360) },
    { label: 'Se durmió en brazos o cargada', rows: REC.filter(r => r.place === 'En brazos' || r.contact === 'Cargada') },
    { label: 'Se durmió con la toma en la boca', rows: REC.filter(r => r.contact === 'Con la toma') },
    { label: 'Dos o más tomas nocturnas', rows: REC.filter(r => r.nf >= 2) },
    { label: 'Teething marcado', rows: REC.filter(r => r.factors.indexOf('Teething') >= 0) },
    { label: 'Cena escasa', rows: REC.filter(r => r.factors.indexOf('Cena escasa') >= 0) },
    { label: 'Se durmió sola en cuna o cama Montessori', rows: REC.filter(r => (r.place === 'Su cuna' || r.place === 'Cama Montessori') && r.contact !== 'Cargada') },
  ];
  return defs
    .filter(c => c.rows.length >= 3)
    .map(c => {
      const m = avg(c.rows.map(r => r.wakes));
      const up = m > base;
      return { label: c.label, n: c.rows.length + ' noches', raw: m, up, mean: m,
        value: one(m) + (up ? ' ↑' : ' ↓'), pct: Math.round((m / 6.5) * 100),
        color: up ? '#D9705A' : '#7FB09A' };
    })
    .sort((a, b) => b.raw - a.raw);
}

/**
 * Cumplimiento del plan: cada umbral del plan se evalúa noche por noche.
 * Verde ≥70%, ámbar ≥40%, coral por debajo.
 */
export function compliance(planDraft) {
  const d = planDraft;
  const checks = [
    { label: 'Inicio de siesta', threshold: '±30 min de ' + fmt(d.napStart),
      real: r => toMin(r.start), fmtR: v => fmt(Math.round(v)),
      ok: r => Math.abs(toMin(r.start) - d.napStart) <= 30 },
    { label: 'Duración de siesta', threshold: 'máx ' + dur(d.napMax),
      real: r => napLenOf(r), fmtR: v => dur(Math.round(v)),
      ok: r => napLenOf(r) <= d.napMax + 10 },
    { label: 'Hora de dormir', threshold: '±30 min de ' + fmt(d.night),
      real: r => toMin(r.night), fmtR: v => fmt(Math.round(v)),
      ok: r => Math.abs(toMin(r.night) - d.night) <= 30 },
    { label: 'Se durmió sin brazos', threshold: 'cuna o Montessori',
      real: r => (r.contact === 'Cargada' ? 0 : 1), fmtR: v => Math.round(v * REC.length) + '/' + REC.length,
      ok: r => r.contact !== 'Cargada' },
    { label: 'Despertares nocturnos', threshold: 'máx ' + d.wakes,
      real: r => r.wakes, fmtR: v => one(v), ok: r => r.wakes <= d.wakes },
    { label: 'Sin tomas nocturnas', threshold: '0 por noche',
      real: r => r.nf, fmtR: v => one(v), ok: r => r.nf === 0 },
  ];
  const rows = checks.map(c => {
    const hits = REC.filter(c.ok).length;
    const pct = Math.round((hits / REC.length) * 100);
    const good = pct >= 70, mid = pct >= 40;
    return { label: c.label, threshold: c.threshold, real: c.fmtR(avg(REC.map(c.real))), pct, good, mid,
      icon: good ? '✓' : mid ? '~' : '✕',
      iconBg: good ? '#DCEDE4' : mid ? '#FFF3E3' : '#FBE4DF',
      iconFg: good ? '#3F7A62' : mid ? '#B07A3C' : '#C0533C',
      tone: good ? '#3F7A62' : mid ? '#B07A3C' : '#D9705A' };
  });
  const okN = rows.filter(r => r.good).length;
  const midN = rows.filter(r => r.mid && !r.good).length;
  const badN = rows.length - okN - midN;
  const pct = Math.round(avg(rows.map(r => r.pct)));
  const worst = rows.slice().sort((a, b) => a.pct - b.pct)[0];
  return {
    rows, pct, ok: okN, total: rows.length,
    bar: [{ n: okN, color: '#3F7A62' }, { n: midN, color: '#F0A868' }, { n: badN, color: '#D9705A' }]
      .filter(x => x.n > 0)
      .map(x => ({ width: ((x.n / rows.length) * 100).toFixed(1) + '%', color: x.color })),
    note: badN > 0
      ? 'Lo que más se está saliendo del plan son los ' + worst.label.toLowerCase() + '. El inicio de siesta y la hora de dormir sí se están respetando, así que el problema no es de ejecución sino de umbral.'
      : 'El plan se está ejecutando como se acordó. Si la noche no mejora, hay que ajustar el plan, no la ejecución.',
  };
}

/**
 * Mapa de calor de la semana: cada día es una barra de 24 h desde las 6:00.
 * noche #2C2C52 · siesta #6B5DD3 · despierta #F6EFE2 · despertar #F0A868
 */
export function heatRow(dayIndex, baby) {
  const r = REC.filter(x => x.d === DAYS[dayIndex] && x.b === baby)[0];
  const iv = intervals(r);
  const napLen = iv.end - iv.asleep;
  const segments = [
    { m: iv.wake, bg: '#2C2C52' },
    { m: iv.asleep - iv.wake, bg: '#F6EFE2' },
    { m: napLen, bg: '#6B5DD3' },
    { m: iv.night - iv.end, bg: '#F6EFE2' },
    { m: 1440 - iv.night, bg: '#2C2C52' },
  ].filter(s => s.m > 0).map(s => ({ width: ((s.m / 1440) * 100).toFixed(2) + '%', bg: s.bg }));
  const ticks = [4, 8, 12, 16, 20].map(h => ((h / 24) * 100).toFixed(2) + '%');
  const dots = [];
  for (let i = 0; i < r.wakes; i++) {
    const at = iv.night + Math.round(((i + 1) / (r.wakes + 1)) * (1440 - iv.night));
    dots.push(((at / 1440) * 100).toFixed(2) + '%');
  }
  return { day: DAYS[dayIndex].split(' ')[0], segments, ticks, dots,
    napLabel: dur(napLen), napLabelLeft: (((iv.asleep + napLen / 2) / 1440) * 100).toFixed(2) + '%' };
}

/** Detalle de un día: la hoja que se abre al tocar una fila del mapa. */
export function dayDetail(dayIndex, baby, weekdays) {
  const r = REC.filter(x => x.d === DAYS[dayIndex] && x.b === baby)[0];
  if (!r) return null;
  const win = windowOf(r), latency = latencyOf(r), napLen = napLenOf(r);
  const good = r.wakes <= 3;
  const row = (label, value, tone) => ({ label, value, tone: tone || '#16162B' });
  return {
    weekday: weekdays[dayIndex] + ' · ' + (baby === 0 ? 'Mía' : 'Lía'),
    title: DAYS[dayIndex],
    good,
    verdict: good
      ? 'Buena noche: ' + r.wakes + ' despertares con una ventana de ' + dur(win) + '.'
      : r.wakes + ' despertares. La ventana de la mañana fue de ' + dur(win) + ', ' + (win > 360 ? 'por encima del objetivo.' : 'dentro de rango — mira los factores.'),
    rows: [
      row('Despertó en la mañana', r.wake),
      row('Empezamos a dormirla', r.start),
      row('Se durmió', r.asleep, latency > 25 ? '#D9705A' : '#7FB09A'),
      row('Latencia', dur(latency), latency > 25 ? '#D9705A' : '#7FB09A'),
      row('Ventana previa', dur(win), win > 360 ? '#D9705A' : '#7FB09A'),
      row('Despertó de la siesta', r.end),
      row('Duró la siesta', dur(napLen)),
      row('Empezó la noche', r.night),
      row('Durmió de noche', dur(r.nightMin)),
      row('Despertares nocturnos', String(r.wakes), r.wakes >= 4 ? '#D9705A' : '#7FB09A'),
      row('Tomas · de noche', r.feeds + ' · ' + r.nf, r.nf >= 2 ? '#D9705A' : '#7FB09A'),
      row('Total en 24 h', dur(napLen + r.nightMin)),
    ],
    context: 'Se durmió en ' + r.place.toLowerCase() + ' con ' + r.contact.toLowerCase() + '. Despertó de ' + r.mood.toLowerCase() + '. Toma antes de dormir: ' + r.feedType.toLowerCase() + '.' + (r.factors.length ? ' Factores marcados: ' + r.factors.join(', ').toLowerCase() + '.' : ' Sin factores marcados.'),
  };
}

/** Comparación entre las dos: cinco métricas, barras espejadas desde el centro. */
export function twinRows() {
  const metric = (label, fn, fmtFn, lowerBetter) => {
    const a = avg(perBaby(0).map(fn)), b = avg(perBaby(1).map(fn));
    const max = Math.max(a, b) || 1;
    const aWins = lowerBetter ? a <= b : a >= b;
    const bWins = lowerBetter ? b <= a : b >= a;
    return { label, a: fmtFn(a), b: fmtFn(b),
      aPct: Math.round((a / max) * 100), bPct: Math.round((b / max) * 100),
      aColor: aWins ? '#6B5DD3' : '#B9AFEA', bColor: bWins ? '#C2703F' : '#E8B694' };
  };
  return [
    metric('despertares / noche', r => r.wakes, v => one(v), true),
    metric('latencia', r => latencyOf(r), v => Math.round(v) + ' min', true),
    metric('siesta', r => napLenOf(r), v => dur(Math.round(v)), false),
    metric('noche', r => r.nightMin, v => dur(Math.round(v)), false),
    metric('tomas nocturnas', r => r.nf, v => one(v), true),
  ];
}

export function twinGap() {
  const d = Math.abs(avg(perBaby(0).map(r => r.wakes)) - avg(perBaby(1).map(r => r.wakes)));
  const parejas = d < 0.6;
  return { label: parejas ? 'Van parejas' : 'Se están separando',
    bg: parejas ? '#DCEDE4' : '#FFF3E3', fg: parejas ? '#3F7A62' : '#B07A3C' };
}

export function twinVerdict() {
  const la = avg(perBaby(0).map(latencyOf));
  const lb = avg(perBaby(1).map(latencyOf));
  const armsA = perBaby(0).filter(r => r.contact === 'Cargada').length;
  const armsB = perBaby(1).filter(r => r.contact === 'Cargada').length;
  return 'Lía tarda ' + Math.round(lb - la) + ' min más en dormirse y necesitó brazos ' + armsB + ' de 7 noches, contra ' + armsA + ' de Mía. Misma casa, mismo horario: la diferencia está en cómo la acompañamos.';
}

/** Sueño real de 24 h contra el rango esperado de la edad. */
export function restRows(p) {
  return [0, 1].map(b => {
    const r = perBaby(b)[perBaby(b).length - 1];
    const t = (napLenOf(r) + r.nightMin) / 60;
    const lo = p.totalLow, hi = p.totalHigh;
    const axLo = lo - 3, axHi = hi + 2, span = axHi - axLo;
    const pos = Math.max(0, Math.min(100, ((t - axLo) / span) * 100));
    const inRange = t >= lo && t <= hi;
    return { baby: b, value: dur(Math.round(t * 60)), inRange,
      tag: inRange ? 'en rango' : (t < lo ? 'por debajo' : 'por encima'),
      color: inRange ? '#3F7A62' : '#F0A868',
      band: lo + '–' + hi + ' h', axisLow: axLo + ' h', axisHigh: axHi + ' h',
      bandLeft: (((lo - axLo) / span) * 100).toFixed(1) + '%',
      bandRight: (((axHi - hi) / span) * 100).toFixed(1) + '%',
      dotLeft: pos.toFixed(1) + '%' };
  });
}

/** Bandera suave: 5+ días por debajo del rango. Nunca alarmista, nunca diagnóstico. */
export function restFlag(p) {
  return REC.filter(r => ((napLenOf(r) + r.nightMin) / 60) < p.totalLow).length >= 5;
}

/** Cómo se durmieron: agrupa los tipos de contacto de las 14 noches. */
export function howBar() {
  const groups = [
    { label: 'Sola', keys: ['Sola', 'Mano encima'], color: '#3F7A62' },
    { label: 'Palmaditas', keys: ['Palmaditas'], color: '#6B5DD3' },
    { label: 'En brazos', keys: ['Cargada'], color: '#D9705A' },
    { label: 'Con la toma', keys: ['Con la toma'], color: '#F0A868' },
  ];
  return groups.map(g => {
    const n = REC.filter(r => g.keys.indexOf(r.contact) >= 0).length;
    return { label: g.label, count: n, color: g.color, width: ((n / REC.length) * 100).toFixed(1) + '%' };
  }).filter(x => x.count > 0);
}

/** Banco de leche: base + (extraído − consumido) de la semana. */
export function pumpStock() {
  return PUMP_BASE_STOCK + PUMP_WEEK.reduce((a, d) => a + d.out - d.used, 0);
}
export function pumpBalance() {
  return PUMP_WEEK.reduce((a, d) => a + d.out - d.used, 0);
}

/** Despertares por hora de la noche. Antes de medianoche = sobrecansancio. */
export function wakesByHour() {
  const hrs = [20, 21, 22, 23, 0, 1, 2, 3, 4, 5];
  const buckets = {};
  hrs.forEach(h => { buckets[h] = 0; });
  REC.forEach(r => {
    const nStart = toMin(r.night);
    for (let i = 0; i < r.wakes; i++) {
      const at = (nStart + Math.round(((i + 1) / (r.wakes + 1)) * ((1440 + 360) - nStart))) % 1440;
      const h = Math.floor(at / 60);
      if (buckets[h] !== undefined) buckets[h]++;
    }
  });
  const max = Math.max.apply(null, hrs.map(h => buckets[h])) || 1;
  return hrs.map(h => ({
    label: h === 0 ? '12a' : h < 12 ? h + 'a' : (h === 12 ? '12p' : (h - 12) + 'p'),
    pct: Math.max(4, Math.round((buckets[h] / max) * 92)),
    color: (h >= 20 || h === 23) ? '#F0A868' : '#6B5DD3',
  }));
}

/** Curva de despertares de la semana, en coordenadas del SVG de 340×128. */
export function wakeCurve(baby) {
  const pts = DAYS.map((d, i) => {
    const r = REC.filter(x => x.d === d && x.b === baby)[0];
    return { x: 14 + i * 52, y: +(102 - (r.wakes / 7) * 84).toFixed(1), wakes: r.wakes, day: d.split(' ')[0] };
  });
  return {
    points: pts,
    line: pts.map(p => p.x + ',' + p.y).join(' '),
    area: '14,102 ' + pts.map(p => p.x + ',' + p.y).join(' ') + ' 326,102',
  };
}

/** Dispersión ventana → despertares, en coordenadas del SVG de 340×150. */
export function scatter(p) {
  const x = m => +(34 + ((m - 240) / 200) * 290).toFixed(1);
  return {
    targetX: x(p.windowMin),
    xAxis: [270, 330, 390].map(m => ({ x: x(m), label: dur(m) })),
    yAxis: [0, 2, 4, 6].map(w => ({ y: +(118 - (w / 7) * 108 + 3).toFixed(1), label: String(w) })),
    dots: REC.map((r, i) => ({ x: x(windowOf(r)), y: +(118 - (r.wakes / 7) * 108).toFixed(1), baby: r.b, delay: (i * 0.035).toFixed(2) + 's' })),
  };
}
