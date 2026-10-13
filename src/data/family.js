import { supabase } from '../lib/supabase';

async function currentUserId() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

/**
 * family_id del usuario autenticado. Hoy un usuario debería pertenecer a una
 * sola família; se ordena por created_at para que, si alguna vez hay más de
 * una fila (no debería pasar en uso normal), el resultado sea siempre el
 * mismo en vez de que Postgres devuelva una al azar en cada consulta.
 */
export async function getMyFamilyId() {
  const { data, error } = await supabase.from('family_members').select('family_id').order('created_at', { ascending: true }).limit(1).single();
  if (error) throw error;
  return data.family_id;
}

/** 'single' | 'multiple' — decide si el desfase entre mellizas es una anomalía a resolver (ver README, sección de desfase). */
export async function getSiblingType(familyId) {
  const { data, error } = await supabase.from('families').select('sibling_type').eq('id', familyId).single();
  if (error) throw error;
  return data.sibling_type;
}

export async function getBabies(familyId) {
  // Ordenado por tone: toda la app asume que babies[0] es siempre la misma
  // niña (tone 'a') de una pantalla a otra y de una carga a otra — sin este
  // order(), Postgres no garantiza el orden de fila y "la primera bebé"
  // podía cambiar entre refrescos.
  const { data, error } = await supabase.from('babies').select('id, name, initial, tone, birth_date, gender').eq('family_id', familyId).order('tone');
  if (error) throw error;
  return data;
}

/** 'breastfeeding' (pecho/extracción, con banco de leche) o 'bottle_only' (solo fórmula/biberón, sin banco). */
export async function getFeedingMode(familyId) {
  const { data, error } = await supabase.from('families').select('feeding_mode').eq('id', familyId).single();
  if (error) throw error;
  return data.feeding_mode;
}

export async function updateFeedingMode(familyId, feedingMode) {
  const { error } = await supabase.from('families').update({ feeding_mode: feedingMode }).eq('id', familyId);
  if (error) throw error;
}

export async function updateBaby(babyId, { name, birthDate, gender }) {
  const { error } = await supabase.from('babies').update({
    name: name.trim(),
    initial: name.trim()[0]?.toUpperCase() ?? '?',
    birth_date: birthDate.toISOString().slice(0, 10),
    ...(gender !== undefined ? { gender } : {}),
  }).eq('id', babyId);
  if (error) throw error;
}

/** Agrega un bebé nuevo al tono libre ('a' o 'b' — hoy la app soporta hasta 2). */
export async function addBaby(familyId, { name, birthDate, tone, gender }) {
  const trimmed = name.trim();
  const { error } = await supabase.from('babies').insert({
    family_id: familyId,
    name: trimmed,
    initial: trimmed[0]?.toUpperCase() ?? '?',
    tone,
    birth_date: birthDate.toISOString().slice(0, 10),
    ...(gender ? { gender } : {}),
  });
  if (error) throw error;
}

/** Borra un bebé y, en cascada, todo su historial de sueño/tomas/medicinas. */
export async function deleteBaby(babyId) {
  const { error } = await supabase.from('babies').delete().eq('id', babyId);
  if (error) throw error;
}

/**
 * Borra la cuenta por completo — requisito de Apple (Guideline 5.1.1(v)):
 * si la cuenta se crea desde la app, se tiene que poder borrar desde la
 * app. Si es la única integrante de su família, se lleva la família entera
 * (bebés, eventos, medicinas). Sin vuelta atrás.
 */
export async function deleteMyAccount() {
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
}

/** Rol de la persona dentro del equipo (Papá/Mamá/Niñera/Otro) — ver RoleScreen. */
export async function setMyRelationship(relationship) {
  const { error } = await supabase.rpc('set_my_relationship', { target_relationship: relationship });
  if (error) throw error;
}

export async function getMyProfileAndRelationship() {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;
  const { data, error } = await supabase
    .from('family_members')
    .select('relationship, profiles(display_name)')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return { displayName: data.profiles?.display_name ?? '', relationship: data.relationship };
}

export async function updateMyDisplayName(displayName) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;
  const { error } = await supabase.from('profiles').update({ display_name: displayName.trim() }).eq('id', userId);
  if (error) throw error;
}

/** Eventos del día en curso (medianoche local hasta ahora), del más reciente al más viejo. */
export async function getTodayEvents(familyId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return getEventsSince(familyId, startOfDay);
}

/** Eventos de las últimas `hours` horas, de cualquier tipo salvo que se filtre con `types`. */
export async function getRecentEvents(familyId, { hours = 24, types } = {}) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return getEventsSince(familyId, since, types);
}

/** Noches abiertas (sin ended_at) de cualquier día, no solo hoy — para el aviso de "noche sin cerrar". Una fila por bebé como máximo (`baby_id` no es null en estas). */
export async function getOpenNightEvents(familyId) {
  const { data, error } = await supabase
    .from('events')
    .select('id, baby_id, started_at, fell_asleep_at')
    .eq('family_id', familyId)
    .eq('type', 'sleep')
    .eq('session', 'night')
    .is('ended_at', null)
    .not('baby_id', 'is', null);
  if (error) throw error;
  return data;
}

/** El sueño más reciente que haya en la base, sin importar cuánto hace — para el aviso de inactividad. null si nunca se registró ninguno. */
export async function getLatestSleepEventAt(familyId) {
  const { data, error } = await supabase
    .from('events')
    .select('started_at')
    .eq('family_id', familyId)
    .eq('type', 'sleep')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? new Date(data.started_at) : null;
}

/**
 * Balance real del banco de leche: saldo inicial (lo que ya tenía guardado
 * antes de usar la app) + todo lo extraído con destino "Al banco" − todo lo
 * dado como "Biberón de leche materna" − ajustes manuales (se derramó,
 * venció). Sin ventana de tiempo, porque leche congelada de hace semanas
 * sigue siendo banco disponible.
 */
export async function getBankBalance(familyId) {
  const [{ data: toBanco, error: e1 }, { data: fromBanco, error: e2 }, { data: adjustments, error: e3 }, { data: fam, error: e4 }] = await Promise.all([
    supabase.from('events').select('volume_ml').eq('family_id', familyId).eq('type', 'pump').eq('pump_dest', 'Al banco'),
    supabase.from('events').select('volume_ml').eq('family_id', familyId).eq('type', 'feed').eq('kind', 'Biberón de leche materna'),
    supabase.from('events').select('volume_ml').eq('family_id', familyId).eq('type', 'bank_adjustment'),
    supabase.from('families').select('milk_bank_starting_ml').eq('id', familyId).single(),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  if (e3) throw e3;
  if (e4) throw e4;
  const totalToBanco = toBanco.reduce((a, e) => a + (e.volume_ml ?? 0), 0);
  const totalFromBanco = fromBanco.reduce((a, e) => a + (e.volume_ml ?? 0), 0);
  const totalLost = adjustments.reduce((a, e) => a + (e.volume_ml ?? 0), 0);
  const startingMl = fam?.milk_bank_starting_ml ?? 0;
  return { startingMl, totalToBanco, totalFromBanco, totalLost, balance: startingMl + totalToBanco - totalFromBanco - totalLost };
}

/** Ajusta el saldo inicial del banco (la reserva de antes de usar la app) — se puede corregir cuando haga falta, no es de una sola vez. */
export async function setMilkBankStartingMl(familyId, ml) {
  const { error } = await supabase.from('families').update({ milk_bank_starting_ml: ml }).eq('id', familyId);
  if (error) throw error;
}

/** Registra una pérdida (se derramó, venció) — resta del banco sin ser una toma real. */
export async function logBankLoss(familyId, ml, note) {
  return insertEvent(familyId, { babyId: null, type: 'bank_adjustment', startedAt: new Date().toISOString(), volumeMl: ml, note: note || null });
}

async function getEventsSince(familyId, since, types) {
  let query = supabase
    .from('events')
    .select('id, baby_id, type, started_at, ended_at, fell_asleep_at, place, kind, side, volume_ml, note, to_reserve, session, wake_count, contact, wake_mood, fall_asleep_mood, factors, feed_minutes, pump_dest, feed_context, fell_asleep_feeding, was_due, babies(tone)')
    .eq('family_id', familyId)
    .gte('started_at', since.toISOString())
    .order('started_at', { ascending: false });
  if (types) query = query.in('type', types);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

function eventRow({ familyId, babyId, type, startedAt, fellAsleepAt, endedAt, place, endPlace, kind, side, volumeMl, note, fellAsleepFeeding, wasDue, toReserve, session, wakeCount, wakeMinutes, contact, wakeMood, fallAsleepMood, factors, feedMinutes, pumpDest, feedContext, source, lastWakeMethod, wakings }) {
  return {
    ...(familyId ? { family_id: familyId } : {}),
    baby_id: babyId,
    ...(type ? { type } : {}),
    // Omitido si no se pasa, a propósito: en un insert cae al default de la
    // columna ('manual'); en un update no pisa el valor que ya tenía la fila
    // (ej. corregir la hora de un registro "assumed" lo promueve a 'manual'
    // solo si el caller lo manda explícito — ver logNormalNight en family.js).
    ...(source ? { source } : {}),
    started_at: startedAt,
    fell_asleep_at: fellAsleepAt ?? null,
    ended_at: endedAt ?? null,
    place: place ?? null,
    end_place: endPlace ?? null,
    kind: kind ?? null,
    side: side ?? null,
    volume_ml: volumeMl ?? null,
    note: note ?? null,
    fell_asleep_feeding: !!fellAsleepFeeding,
    was_due: !!wasDue,
    to_reserve: !!toReserve,
    session: session ?? null,
    wake_count: wakeCount ?? null,
    wake_minutes: wakeMinutes ?? null,
    contact: contact ?? null,
    wake_mood: wakeMood ?? null,
    fall_asleep_mood: fallAsleepMood ?? null,
    factors: factors ?? null,
    feed_minutes: feedMinutes ?? null,
    pump_dest: pumpDest ?? null,
    feed_context: feedContext ?? null,
    ...(lastWakeMethod !== undefined ? { last_wake_method: lastWakeMethod } : {}),
    ...(wakings !== undefined ? { wakings } : {}),
  };
}

/** Inserta un registro de sueño/toma/extracción. `babyId` null = "a las dos". Devuelve la fila creada. */
export async function insertEvent(familyId, payload) {
  const row = { ...eventRow({ familyId, ...payload }), created_by: await currentUserId() };
  const { data, error } = await supabase.from('events').insert(row).select().single();
  if (error) throw error;
  return data;
}

/**
 * Un log por campo que cambió, con el valor anterior — nunca se sobrescribe
 * en silencio (regla del README). `previousRow` es la fila cruda (snake_case)
 * de antes de editar; sin ella no hay con qué comparar y no se audita nada
 * (por ejemplo, un insert nuevo nunca pasa por acá).
 */
async function logEventEdits(eventId, previousRow, nextRow) {
  if (!previousRow) return;
  const changed = Object.keys(nextRow).filter((field) => field !== 'family_id'
    && JSON.stringify(previousRow[field] ?? null) !== JSON.stringify(nextRow[field] ?? null));
  if (!changed.length) return;
  const editedBy = await currentUserId();
  const rows = changed.map((field) => ({ event_id: eventId, field, previous_value: previousRow[field] ?? null, edited_by: editedBy }));
  await supabase.from('event_edits').insert(rows);
}

/**
 * `previousRow` (la fila cruda de antes de editar, si el caller ya la tiene
 * a mano) deja auditoría en `event_edits` de qué campo cambió y con qué
 * valor — la asesora necesita ver que una hora cambió y quién la cambió,
 * no solo el valor final.
 */
export async function updateEvent(eventId, payload, previousRow) {
  const nextRow = eventRow(payload);
  const { error } = await supabase.from('events').update({ ...nextRow, edited_at: new Date().toISOString() }).eq('id', eventId);
  if (error) throw error;
  logEventEdits(eventId, previousRow, nextRow).catch(() => {});
}

/** Reconstruye el payload camelCase completo de una fila existente de `events` (snake_case → camelCase) — necesario porque `eventRow`/`updateEvent` recomponen la fila entera, no aplican un patch parcial; sin esto, confirmar solo la hora de despertar borraría el resto de los campos ya cargados. */
function payloadFromRow(row) {
  return {
    babyId: row.baby_id, type: row.type, startedAt: row.started_at, fellAsleepAt: row.fell_asleep_at,
    endedAt: row.ended_at, place: row.place, endPlace: row.end_place, kind: row.kind, side: row.side,
    volumeMl: row.volume_ml, note: row.note, fellAsleepFeeding: row.fell_asleep_feeding, wasDue: row.was_due,
    toReserve: row.to_reserve, session: row.session, wakeCount: row.wake_count, wakeMinutes: row.wake_minutes,
    contact: row.contact, wakeMood: row.wake_mood, fallAsleepMood: row.fall_asleep_mood, factors: row.factors,
    feedMinutes: row.feed_minutes, pumpDest: row.pump_dest, feedContext: row.feed_context, source: row.source,
    lastWakeMethod: row.last_wake_method, wakings: row.wakings,
  };
}

/**
 * "Sí, todo normal" — confirma el despertar de una noche ya cargada (la hora
 * de acostarse fue real, en vivo) usando la hora de siempre en vez de abrir
 * el formulario completo. Preserva todos los demás campos del registro
 * (lugar, contacto, cómo se durmió...) y marca source:'assumed' para que
 * más adelante no contamine los promedios de diagnóstico como si la hora de
 * despertar fuera medida de verdad.
 */
export async function confirmNormalWake(existingRow, wakeTimeISO) {
  await updateEvent(existingRow.id, { ...payloadFromRow(existingRow), endedAt: wakeTimeISO, source: 'assumed' }, existingRow);
}

/**
 * ¿Hay una noche abierta para este bebé ahora mismo? La usa savePechoSession
 * para clasificar una toma cronometrada como 'Despertar nocturno' sin
 * preguntarlo: si la noche ya empezó y sigue abierta, la toma es nocturna
 * por definición, sin importar la hora del reloj.
 */
export async function hasOpenNight(familyId, babyId) {
  const { data, error } = await supabase
    .from('events')
    .select('id')
    .eq('family_id', familyId)
    .eq('baby_id', babyId)
    .eq('type', 'sleep')
    .eq('session', 'night')
    .is('ended_at', null)
    .limit(1);
  if (error) throw error;
  return (data ?? []).length > 0;
}

/**
 * Cierra una noche abierta — desde el héroe de Hoy ("Ya despertaron") o desde
 * una fila abierta en "Lo que ya pasó hoy". A diferencia de confirmNormalWake
 * (atajo de un toque con la hora de siempre), acá la hora y la cantidad de
 * despertares las eligió la usuaria a mano, así que queda como 'manual'.
 * `wakeCount: null` ("No sé") se guarda tal cual — no se asume 0 — para que
 * el puntaje de la noche caiga en su regla existente de "sin dato" → `—`.
 */
export async function closeNight(nightRow, { endedAt, wakeCount }) {
  await updateEvent(nightRow.id, { ...payloadFromRow(nightRow), endedAt, wakeCount }, nightRow);
}

/**
 * Modo noche — registra un despertar sobre la noche YA ABIERTA de un bebé.
 * `wakings` (jsonb) es la fuente de verdad nueva — una entrada por
 * despertar con su hora exacta, para que Mañana pueda dibujar cada uno en
 * su posición real. `wake_count`/`wake_minutes` se siguen sumando en
 * paralelo (acumulados) porque el puntaje de la noche ya los usa así.
 * `method` (clave estable, ver CONTACT_KEYS) no toca `contact`/
 * `fall_asleep_mood` — esos son de la hora de acostarse, no de un despertar
 * a mitad de la noche.
 */
export async function logNightWake(nightRow, { minutes, method }) {
  const wakings = (nightRow.wakings ?? []).concat([{ at: new Date().toISOString(), durationMin: minutes, method: method ?? null }]);
  await updateEvent(nightRow.id, {
    ...payloadFromRow(nightRow),
    wakeCount: (nightRow.wake_count ?? 0) + 1,
    wakeMinutes: (nightRow.wake_minutes ?? 0) + minutes,
    lastWakeMethod: method ?? nightRow.last_wake_method,
    wakings,
  }, nightRow);
}

/** Agregados simples de las últimas 24h para la pestaña Leche, calculados en cliente sobre `events`. */
export function summarizeMilkEvents(events) {
  const pumpMl = events.filter((e) => e.type === 'pump').reduce((sum, e) => sum + (e.volume_ml ?? 0), 0);
  const reserveMl = events.filter((e) => e.type === 'pump' && e.to_reserve).reduce((sum, e) => sum + (e.volume_ml ?? 0), 0);
  const breastFeeds = events.filter((e) => e.type === 'feed' && e.kind === 'Pecho').length;
  const formulaMl = events.filter((e) => e.type === 'feed' && e.kind === 'Fórmula').reduce((sum, e) => sum + (e.volume_ml ?? 0), 0);
  return { pumpMl, reserveMl, breastFeeds, formulaMl };
}

export async function deleteEvent(eventId) {
  const { error } = await supabase.from('events').delete().eq('id', eventId);
  if (error) throw error;
}

/** Si ya hay una asesora vinculada, sus analíticas quedan incluidas sin costo. */
export async function hasLinkedCoach(familyId) {
  const { data, error } = await supabase
    .from('family_members')
    .select('profiles!inner(role)')
    .eq('family_id', familyId)
    .eq('profiles.role', 'coach')
    .limit(1);
  if (error) throw error;
  return (data ?? []).length > 0;
}

/** Genera un código de invitación para la família del usuario actual. */
export async function createInvite(permissionLevel = 'full') {
  const { data, error } = await supabase.rpc('create_invite', { target_permission_level: permissionLevel });
  if (error) throw error;
  return data;
}

/** Cambia el nivel de acceso de otro miembro del equipo. */
export async function updateMemberPermission(userId, newLevel) {
  const { error } = await supabase.rpc('update_member_permission', { target_user_id: userId, new_level: newLevel });
  if (error) throw error;
}

/** Quita a otro miembro del equipo. */
export async function removeMember(userId) {
  const { error } = await supabase.rpc('remove_family_member', { target_user_id: userId });
  if (error) throw error;
}

/**
 * Canjea el código de una asesora (generado con create_client_family) desde
 * una família que ya existe con datos reales. A diferencia de
 * redeem_invite/joinFamilyWithCode (solo onboarding, família nueva), esto
 * vincula a la asesora a TU família actual sin tocar bebés/plan/historial.
 */
export async function redeemAdvisorInvite(code) {
  const { data, error } = await supabase.rpc('redeem_advisor_invite', { invite_code: code });
  if (error) throw error;
  return data;
}

/** Roster de la família: perfil + rol de permiso + turnos de noche de cada miembro. */
export async function getTeamMembers(familyId) {
  const { data, error } = await supabase
    .from('family_members')
    .select('permission_level, relationship, night_shift_dates, profiles(id, display_name, initial, role)')
    .eq('family_id', familyId);
  if (error) throw error;
  return data;
}

/** Marca (o saca) a alguien de turno de noche HOY — "hoy toca a X" en Equipo. */
export async function setNightShiftToday(userId, onDuty) {
  const { error } = await supabase.rpc('set_night_shift_today', { target_user_id: userId, on_duty: onDuty });
  if (error) throw error;
}

/**
 * Si nadie marcó turno hoy, todo el mundo recibe los avisos de ventana como
 * siempre (no romper a las famílias que no usan "Equipo"). Si alguien SÍ
 * está de turno hoy, solo esa cuenta los recibe — las demás se quedan
 * calladas en vez de duplicar el aviso en varios teléfonos a la vez.
 */
export async function shouldReceiveWindowAlerts(familyId) {
  const myId = await currentUserId();
  if (!myId) return true;
  const members = await getTeamMembers(familyId);
  const todayStr = new Date().toISOString().slice(0, 10);
  const anyOnDuty = members.some((m) => (m.night_shift_dates ?? []).includes(todayStr));
  if (!anyOnDuty) return true;
  const me = members.find((m) => m.profiles?.id === myId);
  return (me?.night_shift_dates ?? []).includes(todayStr);
}

/** Última versión publicada del plan de sueño (si la asesora ya dejó una). */
export async function getLatestPlan(familyId) {
  const { data: version, error: versionError } = await supabase
    .from('plan_versions')
    .select('id, version_label, published_at, profiles(display_name)')
    .eq('family_id', familyId)
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (versionError) throw versionError;
  if (!version) return null;

  const { data: fields, error: fieldsError } = await supabase
    .from('plan_fields')
    .select('key, label, value, position')
    .eq('plan_version_id', version.id)
    .order('position', { ascending: true });
  if (fieldsError) throw fieldsError;

  return { ...version, fields };
}

/**
 * El Plan estructurado que dejó el assessment (o su última edición desde
 * Ajustes) — distinto de getLatestPlan(), que trae el plan de texto libre de
 * la asesora. Hoy lo usa para precargar horarios cuando todavía no hay
 * ninguna noche real registrada (ver README del assessment §4 regla 3).
 */
export async function getLatestSleepPlan(familyId) {
  const { data, error } = await supabase
    .from('sleep_plans')
    .select('wake_time, bedtime, wake_window_min, naps, nap_schedule, tolerance_min, twin_sync_default, version')
    .eq('family_id', familyId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    wakeTime: data.wake_time.slice(0, 5),
    bedtime: data.bedtime.slice(0, 5),
    wakeWindowMin: data.wake_window_min,
    naps: data.naps,
    napSchedule: data.nap_schedule ?? [],
    toleranceMin: data.tolerance_min,
    twinSyncDefault: data.twin_sync_default,
    version: data.version,
  };
}
