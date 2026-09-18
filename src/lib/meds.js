import { fmt, dur, minutesOfDay } from './time';

/**
 * Motor de medicinas — igual regla que derive.js: la UI no calcula nada, solo
 * pinta lo que sale de acá. Adaptado a timestamps reales (Date) en vez de los
 * minutos-desde-medianoche de un solo día del prototipo, porque un intervalo
 * real ("cada 8 h") puede cruzar la medianoche sin problema.
 */

/** Decimales en español: 1.2 -> "1,2 ml". Toda dosis se imprime con esto. */
export const ML = (v) => String(v).replace('.', ',') + ' ml';

const fmtAt = (date) => fmt(minutesOfDay(date));
const startOfDay = (date) => { const d = new Date(date); d.setHours(0, 0, 0, 0); return d; };

export const lastDose = (doses, prescriptionId, babyId) =>
  doses.filter((d) => d.prescriptionId === prescriptionId && d.babyId === babyId).sort((a, b) => b.givenAt - a.givenAt)[0] || null;

export const doseCountToday = (doses, prescriptionId, babyId, now) => {
  const since = startOfDay(now);
  return doses.filter((d) => d.prescriptionId === prescriptionId && d.babyId === babyId && d.givenAt >= since).length;
};

/**
 * Una fila por medicina y por bebé, ordenadas por la que toca primero.
 * due = ya pasó el intervalo indicado.
 */
export function medPlan(prescriptions, doses, babyIds, now) {
  const rows = [];
  prescriptions.forEach((p) => {
    babyIds.forEach((babyId) => {
      const ml = p.doses[babyId];
      if (ml == null) return;
      const last = lastDose(doses, p.id, babyId);
      const at = last ? new Date(last.givenAt.getTime() + p.everyHours * 3600000) : now;
      rows.push({ prescription: p, babyId, doseMl: ML(ml), last, at, due: at <= now });
    });
  });
  return rows.sort((a, b) => a.at - b.at);
}

export const nextDose = (prescriptions, doses, babyIds, now) => medPlan(prescriptions, doses, babyIds, now)[0] || null;

/**
 * Tope duro: al llegar a maxPerDay la app no propone otra dosis por defecto
 * — GiveDoseSheet exige una confirmación explícita aparte (insistedPastLimit)
 * antes de dejar registrar una más. Antes esto era solo informativo.
 */
export function isAtDoseLimit(prescription, doses, babyId, now) {
  return doseCountToday(doses, prescription.id, babyId, now) >= prescription.maxDay;
}

/**
 * El aviso del overlay. Prioridad: máximo excedido > intervalo no cumplido > nota del médico.
 * Informa el intervalo/nota; el máximo lo hace cumplir isAtDoseLimit()/GiveDoseSheet.
 */
export function doseWarning(prescription, doses, babyId, now) {
  const given = doseCountToday(doses, prescription.id, babyId, now);
  const last = lastDose(doses, prescription.id, babyId);
  if (given >= prescription.maxDay)
    return 'Ya van ' + given + ' dosis hoy y el máximo indicado es ' + prescription.maxDay + '. Consulta antes de dar otra.';
  if (last && now - last.givenAt < prescription.everyHours * 3600000)
    return 'La última fue a las ' + fmtAt(last.givenAt) + ', hace ' + dur(Math.round((now - last.givenAt) / 60000)) + '. La indicación es cada ' + prescription.everyHours + ' h.';
  return prescription.altNote || '';
}

/** Historial de hoy, más nuevo primero (`doses` ya viene ordenado descendente). */
export function doseHistory(doses, prescriptions, babies, now, limit = 4) {
  const since = startOfDay(now);
  return doses.filter((d) => d.givenAt >= since).slice(0, limit).map((d) => {
    const p = prescriptions.find((x) => x.id === d.prescriptionId);
    const baby = babies.find((b) => b.id === d.babyId);
    return { time: fmtAt(d.givenAt), what: (p?.name ?? 'Medicina') + ' · ' + (baby?.name ?? '') + ' · ' + ML(p?.doses[d.babyId] ?? 0), by: d.by };
  });
}

/** Texto del recuadro de Sueño. Sin episodio activo es una entrada neutra. */
export function medStripCopy(episode, prescriptions, doses, babies, now) {
  const activeMeds = prescriptions.filter((p) => p.inUse);
  if (!activeMeds.length)
    return { title: 'Medicinas', sub: 'Marca una medicina indicada como "en uso" para ver acá cuándo toca', tag: '→', due: false };
  const babyIds = babies.map((b) => b.id);
  const next = nextDose(activeMeds, doses, babyIds, now);
  if (!next) return { title: 'Medicinas · nada pendiente', sub: 'sin dosis pendientes ahora', tag: 'Ver', due: false };
  const baby = babies.find((b) => b.id === next.babyId);
  const given = doseCountToday(doses, next.prescription.id, next.babyId, now);
  return {
    title: 'Medicinas · ' + next.prescription.name + ' a ' + (baby?.name ?? ''),
    sub: next.doseMl + ' · ' + (next.due ? 'le toca ya' : 'a las ' + fmtAt(next.at)) + ' · ' + given + ' de ' + next.prescription.maxDay + ' hoy',
    tag: next.due ? 'Dar' : 'Ver',
    due: next.due,
  };
}
