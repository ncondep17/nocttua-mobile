import { toMin, fmt, dur } from './time';

/**
 * "Un día de ejemplo" — se RESUELVE, no se escribe a mano.
 *
 * Regla dura: la ventana impresa SIEMPRE cae dentro del rango que declara la
 * tabla de ventanas del mismo perfil (winLow..winHigh). Imprimir una ventana
 * más larga que la que el propio producto recomienda es el error grave acá:
 * un papá primerizo lo lee como recomendación.
 *
 * Por eso se busca la combinación (nº de siestas, ventana, duración de siesta)
 * que aterrice la noche en p.bed ± 20 min, con la ventana dentro del rango y la
 * siesta dentro de napLow..napHigh (el rango que declara `napLen`). Ambas cotas
 * son duras: el sobrante lo absorben la siesta y un margen de ±30 min en la hora
 * de acostar, nunca la ventana.
 */
const WAKE = '6:30';

export function solveSampleDay(p) {
  const wake = toMin(WAKE);
  const target = toMin(p.bed);
  const napLo = p.napLow;
  const napHi = p.napHigh;
  const mid = (p.winLow + p.winHigh) / 2;

  let best = null;
  for (let k = 1; k <= 6; k++) {
    for (let w = p.winLow; w <= p.winHigh; w += 5) {
      for (let nl = napLo; nl <= napHi; nl += 5) {
        const total = w * (k + 1) + nl * k;
        const drift = Math.abs(wake + total - target);
        if (drift > 30) continue;
        const score = drift * 0.5 + Math.abs(nl - p.napMin) + 10 * Math.abs(k - p.naps) + Math.abs(w - mid) * 0.2;
        if (!best || score < best.score) best = { naps: k, win: w, napLen: nl, score, bed: wake + total };
      }
    }
  }
  if (!best) {
    const w = Math.min(p.winHigh, Math.max(p.winLow, Math.round(((target - wake - p.naps * p.napMin) / (p.naps + 1)) / 5) * 5));
    best = { naps: p.naps, win: w, napLen: p.napMin, bed: wake + w * (p.naps + 1) + p.napMin * p.naps };
  }

  const young = p.id === 'nb' || p.id === '3-6';
  const rows = [{ t: wake, what: 'Despertar y primera toma', detail: 'de aquí sale todo el día', tone: '#F0A868' }];
  let c = wake;
  for (let i = 0; i < best.naps; i++) {
    const s = c + best.win;
    const e = s + best.napLen;
    rows.push({
      t: s,
      what: (best.naps === 1 ? 'Siesta' : 'Siesta ' + (i + 1)) + ' · hasta ' + fmt(e),
      detail: 'ventana previa ' + dur(best.win) + ' · duerme ' + dur(best.napLen),
      tone: '#6B5DD3',
    });
    c = e;
    if (i < best.naps - 1) rows.push({ t: e + 10, what: 'Toma al despertar', detail: '', tone: '#7FB09A' });
  }
  rows.push({
    t: Math.max(c + 15, best.bed - (young ? 30 : 45)),
    what: young ? 'Rutina: baño, toma y cuarto oscuro' : 'Rutina: baño, cena, cuarto oscuro',
    detail: 'siempre en el mismo orden',
    tone: '#B08A55',
  });
  rows.push({
    t: best.bed,
    what: 'A la cama despierta',
    detail: 'ventana de ' + dur(best.bed - c) + ' desde la última siesta',
    tone: '#16162B',
  });

  return {
    naps: best.naps,
    win: best.win,
    napLen: best.napLen,
    bed: fmt(best.bed),
    wake: WAKE,
    rows: rows.map((r) => ({ ...r, time: fmt(r.t) })),
    chips: [
      'Sueño total ' + p.total,
      'Ventanas de ' + dur(best.win),
      'Tomas ' + p.feedsLabel + ' / día',
      p.nightFeeds === '0' ? 'Sin tomas nocturnas' : 'Nocturnas ' + p.nightFeeds,
    ],
  };
}

export const SAMPLE_DAY_DISCLAIMER =
  'Es un ejemplo de cómo podría caer el día, no un horario a cumplir. El día real se arma desde la hora en que se despertó, cuánto durmió la siesta y sus señales de sueño.';

export const SAMPLE_DAY_TWINS =
  'Con mellizas se sincroniza el día por la que se despertó primero. Si una arranca 20 min antes, acorta su ventana; no estires la de la otra para igualarlas.';
