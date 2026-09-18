import { supabase } from '../lib/supabase';

async function currentUserId() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

/** Episodio de enfermedad activo (si hay uno), con el día calculado desde started_at. */
export async function getActiveEpisode(familyId) {
  const { data, error } = await supabase
    .from('med_episodes')
    .select('id, label, started_at')
    .eq('family_id', familyId)
    .is('ended_at', null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const day = Math.max(1, Math.floor((Date.now() - new Date(data.started_at).getTime()) / 86400000) + 1);
  return { id: data.id, label: data.label, startedAt: data.started_at, day, active: true };
}

/** Activa un episodio nuevo (falla si ya hay uno abierto — un índice único lo garantiza). */
export async function startEpisode(familyId, label = 'Fiebre / resfriado') {
  const { error } = await supabase.from('med_episodes').insert({ family_id: familyId, label, created_by: await currentUserId() });
  if (error) throw error;
}

/** Cierra el episodio activo: "Ya está bien". */
export async function endEpisode(episodeId) {
  const { error } = await supabase.from('med_episodes').update({ ended_at: new Date().toISOString() }).eq('id', episodeId);
  if (error) throw error;
}

/** Todos los episodios que se cruzan con los últimos `days` días — para excluirlos de la analítica. */
export async function getRecentEpisodes(familyId, days = 14) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await supabase
    .from('med_episodes')
    .select('id, started_at, ended_at')
    .eq('family_id', familyId)
    .or(`ended_at.is.null,ended_at.gte.${since}`);
  if (error) throw error;
  return data;
}

/** Medicinas indicadas, activas, con su dosis por bebé. `inUse` es independiente de `active`: catálogo guardado vs. "la estamos dando ahora". */
export async function getPrescriptions(familyId) {
  const { data, error } = await supabase
    .from('med_prescriptions')
    .select('id, name, conc, every_hours, max_day, doctor, prescribed_on, note, alt_note, in_use, photo_url, remind_minutes_before, med_prescription_doses(baby_id, ml)')
    .eq('family_id', familyId)
    .eq('active', true)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map((p) => ({
    id: p.id,
    name: p.name,
    conc: p.conc,
    everyHours: p.every_hours,
    maxDay: p.max_day,
    doctor: p.doctor,
    prescribedOn: p.prescribed_on,
    note: p.note,
    altNote: p.alt_note,
    inUse: p.in_use,
    photoUrl: p.photo_url,
    remindMinutesBefore: p.remind_minutes_before,
    doses: Object.fromEntries(p.med_prescription_doses.map((d) => [d.baby_id, Number(d.ml)])),
  }));
}

/** Marca una medicina como "la estamos dando ahora" (o la saca de uso) — decide qué aparece en el plan de dosis y en las notificaciones. */
export async function setPrescriptionInUse(id, inUse) {
  const { error } = await supabase.from('med_prescriptions').update({ in_use: inUse }).eq('id', id);
  if (error) throw error;
}

/** Un log por campo que cambió, con el valor anterior — misma regla que event_edits. */
async function logPrescriptionEdits(prescriptionId, previousRow, nextRow) {
  if (!previousRow) return;
  const changed = Object.keys(nextRow).filter((field) => field !== 'family_id'
    && JSON.stringify(previousRow[field] ?? null) !== JSON.stringify(nextRow[field] ?? null));
  if (!changed.length) return;
  const editedBy = await currentUserId();
  const rows = changed.map((field) => ({ prescription_id: prescriptionId, field, previous_value: previousRow[field] ?? null, edited_by: editedBy }));
  await supabase.from('med_prescription_edits').insert(rows);
}

/** Crea o actualiza una receta y reemplaza su dosis por bebé. Solo acceso total (RLS lo exige). */
export async function upsertPrescription(familyId, { id, name, conc, everyHours, maxDay, doctor, prescribedOn, note, altNote, doses, photoUrl }) {
  const row = {
    family_id: familyId, name: name.trim(), conc: conc.trim(), every_hours: everyHours, max_day: maxDay,
    doctor: doctor.trim(), prescribed_on: prescribedOn, note: note.trim(), alt_note: altNote.trim(),
    ...(photoUrl !== undefined ? { photo_url: photoUrl } : {}),
  };
  let prescriptionId = id;
  if (id) {
    // Se trae la fila cruda de antes de pisarla — así el diff de logPrescriptionEdits
    // compara snake_case contra snake_case, sin depender de que el caller tenga
    // a mano la forma exacta de la fila (los callers solo tienen la versión
    // camelCase que devuelve getPrescriptions()).
    const { data: previousRow } = await supabase.from('med_prescriptions').select('*').eq('id', id).maybeSingle();
    const { error } = await supabase.from('med_prescriptions').update({ ...row, edited_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    logPrescriptionEdits(id, previousRow, row).catch(() => {});
  } else {
    const { data, error } = await supabase.from('med_prescriptions').insert({ ...row, created_by: await currentUserId() }).select('id').single();
    if (error) throw error;
    prescriptionId = data.id;
  }

  await supabase.from('med_prescription_doses').delete().eq('prescription_id', prescriptionId);
  const doseRows = doses.filter((d) => d.ml > 0).map((d) => ({ prescription_id: prescriptionId, baby_id: d.babyId, ml: d.ml }));
  if (doseRows.length) {
    const { error } = await supabase.from('med_prescription_doses').insert(doseRows);
    if (error) throw error;
  }
  return prescriptionId;
}

/** Retira una medicina de la lista de indicadas (no borra el historial de dosis ya dadas). */
export async function deactivatePrescription(id) {
  const { error } = await supabase.from('med_prescriptions').update({ active: false }).eq('id', id);
  if (error) throw error;
}

/** Dosis dadas desde `since` — alcanza para calcular intervalos, máximos diarios e historial. */
export async function getDosesSince(familyId, since) {
  const { data, error } = await supabase
    .from('med_doses')
    .select('id, prescription_id, baby_id, given_at, profiles(display_name)')
    .eq('family_id', familyId)
    .gte('given_at', since.toISOString())
    .order('given_at', { ascending: false });
  if (error) throw error;
  return data.map((d) => ({ id: d.id, prescriptionId: d.prescription_id, babyId: d.baby_id, givenAt: new Date(d.given_at), by: d.profiles?.display_name || 'Alguien' }));
}

/**
 * Registra que se dio una dosis (o que se saltó). Cualquier cuidador puede
 * hacerlo, no solo admin. `insistedPastLimit` marca que se dio pasado el
 * tope diario, con confirmación explícita. `skipped` viene de la acción
 * "Saltar" de la notificación — deja una fila en vez de un hueco silencioso.
 */
export async function logDose(familyId, prescriptionId, babyId, givenAt, insistedPastLimit = false, skipped = false) {
  const { error } = await supabase.from('med_doses').insert({
    family_id: familyId, prescription_id: prescriptionId, baby_id: babyId,
    given_at: givenAt.toISOString(), given_by: await currentUserId(),
    insisted_past_limit: insistedPastLimit, skipped,
  });
  if (error) throw error;
}
