import { PROFILES } from '../data/profiles';
import { toMin, fmt, dur } from './time';

/**
 * Funciones puras del assessment del onboarding (A1–A6). Ver el README del
 * handoff y el plan en resilient-booping-dawn.md para el contrato completo.
 * Nada acá toca red/AsyncStorage — eso vive en data/onboarding.js y en el
 * estado de las pantallas.
 */

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.44;
const CORRECTION_CUTOFF_MONTHS = 24;
const MIN_GESTATION_WEEKS = 22;
const MAX_GESTATION_WEEKS = 42;
const DEFAULT_WAKE_TIME_MIN = toMin('6:30');
const DEFAULT_TOLERANCE_MIN = 15;

export function chronologicalAgeMonths(birthDate, now = Date.now()) {
  return (now - new Date(birthDate).getTime()) / MS_PER_MONTH;
}

/**
 * correctedAgeMonths = cronológica − (40 − gestationWeeks) / 4.345, aplicada
 * solo hasta los 24 meses cronológicos — a partir de ahí corrected === chrono.
 * gestationWeeks null (a término o "no sé") → cronológica sin tocar; quien
 * llama debe rotular el rango como aproximado en ese caso (ver
 * expectedSleepRange), nunca asumir 40 semanas en silencio.
 */
export function correctedAgeMonths(birthDate, gestationWeeks, now = Date.now()) {
  const chrono = chronologicalAgeMonths(birthDate, now);
  if (gestationWeeks == null || chrono > CORRECTION_CUTOFF_MONTHS) return chrono;
  return chrono - (40 - gestationWeeks) / 4.345;
}

export function profileForAgeMonths(ageMonths) {
  return PROFILES.find((p) => ageMonths >= p.minMonths && ageMonths < p.maxMonths) || PROFILES[PROFILES.length - 1];
}

/** Envoltorio fino sobre la tabla de edad ya existente — no duplica los números. */
export function expectedSleepRange(ageMonths) {
  const p = profileForAgeMonths(ageMonths);
  return { minH: p.totalLow, maxH: p.totalHigh, naps: p.naps };
}

export function synthesizeNapSchedule(wakeMin, naps, windowMin, napMin) {
  const out = [];
  let cursor = wakeMin;
  for (let i = 0; i < naps; i++) {
    const startsAt = cursor + windowMin;
    out.push({ startsAt: fmt(startsAt), durationMin: napMin });
    cursor = startsAt + napMin;
  }
  return out;
}

/**
 * answers → Plan. Cada "No sé" (null) se resuelve con el perfil de edad de
 * referencia, nunca queda null en el Plan (la tabla sleep_plans es NOT NULL
 * a propósito: el Plan siempre tiene un valor con el que Hoy puede precargar,
 * aunque la usuaria no haya contestado esa pregunta).
 */
export function derivePlanFromAssessment(answers, referenceAgeMonths) {
  const profile = profileForAgeMonths(referenceAgeMonths);
  const wakeMin = answers.wakeTime != null ? toMin(answers.wakeTime) : DEFAULT_WAKE_TIME_MIN;
  const bedMin = answers.bedtime != null ? toMin(answers.bedtime) : toMin(profile.bed);
  const wakeWindowMin = answers.wakeWindowMin ?? profile.windowMin;
  const naps = answers.naps ?? profile.naps;
  const napSchedule = answers.napSchedule && answers.napSchedule.length
    ? answers.napSchedule
    : synthesizeNapSchedule(wakeMin, naps, wakeWindowMin, profile.napMin);

  return {
    wakeTime: fmt(wakeMin),
    bedtime: fmt(bedMin),
    wakeWindowMin,
    naps,
    napSchedule,
    toleranceMin: DEFAULT_TOLERANCE_MIN,
    twinSyncDefault: answers.twinSyncDefault ?? true,
  };
}

/** Plan → filas del timeline de A6 (despertar, cada siesta con su ventana, noche con la suya). */
export function planToTimeline(plan) {
  const rows = [];
  const wakeMin = toMin(plan.wakeTime);
  rows.push({ key: 'wake', atMin: wakeMin, time: fmt(wakeMin), label: 'Se despiertan', windowMin: null });

  let cursor = wakeMin;
  plan.napSchedule.forEach((nap, i) => {
    const atMin = toMin(nap.startsAt);
    rows.push({
      key: 'nap' + i,
      atMin,
      time: fmt(atMin),
      label: (plan.napSchedule.length === 1 ? 'Siesta' : 'Siesta ' + (i + 1)) + ', ' + dur(nap.durationMin),
      windowMin: atMin - cursor,
    });
    cursor = atMin + nap.durationMin;
  });

  const bedMin = toMin(plan.bedtime);
  rows.push({ key: 'night', atMin: bedMin, time: fmt(bedMin), label: 'Noche', windowMin: bedMin - cursor });
  return rows;
}

/**
 * Errores por campo, listos para mostrar debajo de cada bloque. Devuelve {}
 * si no hay errores. No valida existencia de campos "No sé" — null es una
 * respuesta legítima (ver README §4, regla 4).
 */
export function validateAssessment(answers) {
  const errors = {};
  const now = Date.now();
  const fiveYearsMs = 5 * 365.25 * 24 * 60 * 60 * 1000;

  const babies = answers.babies ?? [];
  babies.forEach((b, i) => {
    const name = (b.name ?? '').trim();
    if (!name) errors['babies.' + i + '.name'] = 'El nombre es obligatorio.';
    else if (name.length > 20) errors['babies.' + i + '.name'] = 'Máximo 20 caracteres.';
  });
  if (babies.length === 2) {
    const [a, b] = babies;
    if (a?.name && b?.name && a.name.trim().toLowerCase() === b.name.trim().toLowerCase()) {
      errors['babies.1.name'] = 'Ya usaste ese nombre — prueba con una inicial distinta.';
    }
  }

  if (answers.birthDate) {
    const t = new Date(answers.birthDate).getTime();
    if (t > now) errors.birthDate = 'La fecha no puede ser futura.';
    else if (now - t > fiveYearsMs) errors.birthDate = 'Revisa la fecha: es de hace más de 5 años.';
  }

  if (answers.premature === 'si') {
    const w = answers.gestationWeeks;
    if (w == null) errors.gestationWeeks = 'Indica las semanas de gestación.';
    else if (w < MIN_GESTATION_WEEKS || w > MAX_GESTATION_WEEKS) {
      errors.gestationWeeks = 'Tiene que estar entre ' + MIN_GESTATION_WEEKS + ' y ' + MAX_GESTATION_WEEKS + ' semanas.';
    }
  }

  const naps = answers.napSchedule ?? [];
  const sorted = [...naps]
    .map((n) => ({ start: toMin(n.startsAt), end: toMin(n.startsAt) + n.durationMin }))
    .sort((a, b) => a.start - b.start);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].start < sorted[i - 1].end) {
      errors.napSchedule = 'Dos siestas se solapan — ajusta el horario.';
      break;
    }
  }
  if (!errors.napSchedule && answers.bedtime != null && sorted.length) {
    const last = sorted[sorted.length - 1];
    if (last.end > toMin(answers.bedtime)) {
      errors.napSchedule = 'Una siesta termina después de la hora de acostarse.';
    }
  }

  if (answers.wakeTime != null && answers.bedtime != null) {
    const awakeSpan = toMin(answers.bedtime) - toMin(answers.wakeTime);
    const napTotal = naps.reduce((sum, n) => sum + n.durationMin, 0);
    if (awakeSpan <= 0 || awakeSpan < napTotal) {
      errors.wakeWindowMin = 'Las horas declaradas no dejan tiempo para las siestas.';
    }
  }

  return errors;
}

/**
 * Perfil de edad + el Plan del assessment superpuesto — para que planBlocks()
 * sugiera CON las horas que la família declaró (wakeTime/bedtime/wakeWindowMin/
 * naps), no con la tabla de edad genérica, mientras no haya sueños medidos.
 * Todo lo demás del perfil (rangos descriptivos, etiquetas) se deja igual.
 */
export function profileWithPlan(profile, plan) {
  if (!plan) return profile;
  const napMin = plan.napSchedule && plan.napSchedule.length
    ? Math.round(plan.napSchedule.reduce((sum, n) => sum + n.durationMin, 0) / plan.napSchedule.length)
    : profile.napMin;
  return { ...profile, naps: plan.naps, windowMin: plan.wakeWindowMin, napMin, bed: plan.bedtime };
}

export const MIN_MEASURED_FOR_PREDICTION = 3;
export const PREDICTION_SAMPLE_SIZE = 5;

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const windowMinutesOf = (r) => toMin(r.asleep) - toMin(r.wake);
const napMinutesOf = (r) => toMin(r.end) - toMin(r.asleep);

/**
 * Mediana de las últimas 5 ventanas REALES (source != 'assumed') si hay al
 * menos 3; si no, el valor del Plan/tabla de edad. `records` es el arreglo
 * ya filtrado a un solo bebé (perBaby de lib/derive.js), en el mismo orden
 * ascendente por día que ya trae buildDayRecords.
 *
 * No importa nada de derive.js a propósito (ambos módulos comparten solo
 * lib/time.js) — derive.js es quien importa esta función, no al revés.
 */
export function predictedWindowMin(records, kind, planFallbackMin) {
  const compute = kind === 'nap' ? napMinutesOf : windowMinutesOf;
  const values = records
    .filter((r) => r.source !== 'assumed' && r.wake && r.asleep && (kind !== 'nap' || r.end))
    .map(compute)
    .filter((v) => Number.isFinite(v) && v > 0);
  if (values.length < MIN_MEASURED_FOR_PREDICTION) return planFallbackMin;
  return Math.round(median(values.slice(-PREDICTION_SAMPLE_SIZE)));
}
