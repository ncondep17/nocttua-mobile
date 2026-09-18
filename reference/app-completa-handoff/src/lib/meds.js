import { MEDS, getMed, ML } from '../data/meds';
import { NAMES } from '../data/profiles';
import { fmt, dur } from './time';

/**
 * Motor de medicinas. Igual que derive.js para el sueño: la UI no calcula nada,
 * solo pinta lo que sale de acá.
 */

export const lastDose = (doses, medId, baby) =>
  doses.filter(d => d.med === medId && d.b === baby).sort((a, b) => b.t - a.t)[0] || null;

export const doseCount = (doses, medId, baby) =>
  doses.filter(d => d.med === medId && d.b === baby).length;

/**
 * Una fila por medicina y por niña, ordenadas por la que toca primero.
 * due = ya pasó el intervalo indicado.
 */
export function medPlan(doses, now) {
  const rows = [];
  MEDS.forEach(m => {
    [0, 1].forEach(b => {
      const last = lastDose(doses, m.id, b);
      const at = last ? last.t + m.everyH * 60 : now;
      rows.push({ med: m, baby: b, dose: ML(m.ml[b]), last, at, due: at <= now });
    });
  });
  return rows.sort((a, b) => a.at - b.at);
}

export const nextDose = (doses, now) => medPlan(doses, now)[0] || null;

/**
 * El aviso del overlay. Prioridad: máximo excedido > intervalo no cumplido > nota del médico.
 * Nunca bloquea la acción: informa. Quien decide es el cuidador.
 */
export function doseWarning(med, doses, baby, at) {
  const given = doseCount(doses, med.id, baby);
  const last = lastDose(doses, med.id, baby);
  if (given >= med.maxDay)
    return 'Ya van ' + given + ' dosis hoy y el máximo indicado es ' + med.maxDay + '. Consultá antes de dar otra.';
  if (last && at - last.t < med.everyH * 60)
    return 'La última fue a las ' + fmt(last.t) + ', hace ' + dur(at - last.t) + '. La indicación es cada ' + med.everyH + ' h.';
  return med.altNote || '';
}

/** Historial del día, más reciente primero. */
export function doseHistory(doses, limit = 4) {
  return doses
    .slice()
    .sort((a, b) => b.t - a.t)
    .slice(0, limit)
    .map(d => {
      const m = getMed(d.med);
      return { time: fmt(d.t), what: m.name + ' · ' + NAMES[d.b] + ' · ' + ML(m.ml[d.b]), by: d.by };
    });
}

/** Texto del recuadro de Sueño. Sin episodio activo es una entrada neutra. */
export function medStripCopy(episode, doses, now) {
  if (!episode.active)
    return { title: 'Medicinas', sub: 'Si están enfermas, tené las dosis del doctor a mano', tag: '→', due: false };
  const next = nextDose(doses, now);
  if (!next) return { title: 'Medicinas · nada pendiente', sub: 'día ' + episode.day + ' del episodio', tag: 'Ver', due: false };
  const given = doseCount(doses, next.med.id, next.baby);
  return {
    title: 'Medicinas · ' + next.med.name + ' a ' + NAMES[next.baby],
    sub: next.dose + ' · ' + (next.due ? 'le toca ya' : 'a las ' + fmt(next.at)) + ' · ' + given + ' de ' + next.med.maxDay + ' hoy',
    tag: next.due ? 'Dar' : 'Ver',
    due: next.due,
  };
}
