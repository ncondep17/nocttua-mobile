import { supabase } from '../lib/supabase';
import { correctedAgeMonths, derivePlanFromAssessment } from '../lib/assessment';

const TONES = ['a', 'b'];

/**
 * Cierre del assessment del onboarding (A1–A6): crea la família recién
 * autenticada, sus bebés, un `Plan` (sleep_plans) + las respuestas crudas
 * (assessments) + una línea base por bebé (baselines) — NUNCA un
 * SleepLog/events: ver README §4 regla 1, y el criterio de aceptación §6.8
 * ("la base, al terminar el assessment, contiene cero SleepLog").
 */
export async function completeAssessmentOnboarding(draft) {
  const { data: familyId, error: familyError } = await supabase.rpc('create_family');
  if (familyError) throw familyError;

  // siblingType decide comportamiento en Hoy (si el desfase entre mellizas
  // es una anomalía a resolver o ni corresponde calcularlo) — antes solo
  // vivía en el borrador del assessment, sin persistir a nivel família.
  const { error: siblingTypeError } = await supabase.from('families').update({ sibling_type: draft.siblingType }).eq('id', familyId);
  if (siblingTypeError) throw siblingTypeError;

  const gestationWeeks = draft.premature === 'si' ? draft.gestationWeeks : null;

  const babyRows = draft.babies.map((b, i) => ({
    family_id: familyId,
    name: b.name.trim(),
    initial: b.name.trim()[0]?.toUpperCase() ?? '?',
    tone: TONES[i],
    birth_date: draft.birthDate.slice(0, 10),
    current_naps: draft.naps ?? 0,
    gender: b.gender,
    gestation_weeks: gestationWeeks,
  }));

  const { data: insertedBabies, error: babiesError } = await supabase.from('babies').insert(babyRows).select('id');
  if (babiesError) throw babiesError;

  const referenceAgeMonths = correctedAgeMonths(draft.birthDate, gestationWeeks);
  const plan = derivePlanFromAssessment(draft, referenceAgeMonths);

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id ?? null;

  const { error: planError } = await supabase.from('sleep_plans').insert({
    family_id: familyId,
    version: 1,
    source: 'assessment',
    wake_time: plan.wakeTime,
    bedtime: plan.bedtime,
    wake_window_min: plan.wakeWindowMin,
    naps: plan.naps,
    nap_schedule: plan.napSchedule,
    tolerance_min: plan.toleranceMin,
    twin_sync_default: plan.twinSyncDefault,
    updated_by: userId,
  });
  if (planError) throw planError;

  const { error: assessmentError } = await supabase.from('assessments').insert({
    family_id: familyId,
    version: 1,
    answers: draft,
  });
  if (assessmentError) throw assessmentError;

  // Misma línea base para las dos con 'multiple' en esta pasada — A5 pregunta
  // una sola vez por hogar, no por bebé (staggered, que sí lo pediría por
  // bebé, queda fuera de este pase, ver el plan).
  const baselineRows = insertedBabies.map((row) => ({
    baby_id: row.id,
    wakings_per_night: draft.baseline.wakingsPerNight,
    fall_asleep_method: draft.baseline.fallAsleepMethod,
    latency_min: draft.baseline.latencyMin,
    night_feeds: draft.baseline.nightFeeds,
  }));
  const { error: baselineError } = await supabase.from('baselines').insert(baselineRows);
  if (baselineError) throw baselineError;

  return familyId;
}

/** Camino "con código": une al usuario a una família existente sin crear bebés nuevos. */
export async function joinFamilyWithCode(code) {
  const { data: familyId, error } = await supabase.rpc('redeem_invite', { invite_code: code });
  if (error) throw error;
  return familyId;
}
