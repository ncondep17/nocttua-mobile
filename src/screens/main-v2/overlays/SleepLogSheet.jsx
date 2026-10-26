import { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@nocttua/theme/native';
import { Chip, SegTabs, Stepper, TimeStepper, UnitToggle, ToggleRow, GroupLabel, PrimaryButton, DangerButton, CategoryIcon } from '../../../components/v2/primitives';
import { SheetV2 } from '../../../components/v2/MobileChrome';
import { TimeField } from '../../../components/forms/TimeField';
import { DayPicker } from '../../../components/forms/DayPicker';
import { PLACES, CONTACTS, FEED_TYPES, MOODS, FALL_ASLEEP_MOODS, FACTORS, profileForBirthDate } from '../../../data/profiles';
import { genderLabel, plural, agree } from '../../../lib/grammar';
import { dur, fmt, minutesOfDay } from '../../../lib/time';
import { stepVolume, fmtVolume } from '../../../lib/volume';
import { addDays, daysBetween, startOfDay, snapAfter } from '../../../lib/dates';
import { getDayRecords, getTodayWakeMinutes, getTodayNaps, getTodayNightStart, buildDayRecords } from '../../../data/dayRecords';
import { planBlocks } from '../../../lib/derive';
import { profileWithPlan } from '../../../lib/assessment';
import { getLatestSleepPlan } from '../../../data/family';

// Captura rápida (PROMPT-hoy-v3.md §2): stepper de hora absoluta (±5 min)
// para "¿a qué hora se durmió?" + chips de latencia para "¿cuánto tardó?".
const LATENCY_OPTIONS = [
  { min: 5, label: '5 min', summary: '5 min' },
  { min: 10, label: '10 min', summary: '10 min' },
  { min: 15, label: '15 min', summary: '15 min' },
  { min: 20, label: '20 min', summary: '20 min' },
  { min: 35, label: '+30 min', summary: 'más de 30 min' },
];

/**
 * Hoja de registro de sueño — el formulario más importante del producto.
 * No se puede saber la hora de despertar en el momento de acostarla, así
 * que ninguna sesión pide las dos puntas a la vez — se abre en una de tres
 * fases, la misma lógica para Noche/Mañana y para una siesta:
 *  - startOnly: recién arranca (Noche nueva, o una siesta que se acaba de
 *    empezar a dormir). Pide cuándo empezó y cuándo se durmió — nada de
 *    hora de despertar ni humor, porque todavía no pasó.
 *  - completeOnly (Mañana, o una siesta que ya empezó y sigue abierta):
 *    pide SOLO la hora de despertar y el humor — el resto ya se contestó
 *    al empezarla.
 *  - completo (editando algo que ya terminó, por evento o porque Noche se
 *    corrige después de que Mañana la cerró): todos los campos, para poder
 *    corregir cualquiera.
 *
 * Diferencia real a propósito respecto del handoff: las horas se eligen con
 * el selector nativo (TimeField), no con un stepper de 5 minutos — para una
 * noche de 8-11h esto ya generó la queja correcta la primera vez que se
 * probó con steppers.
 */
export function SleepLogSheet({ open, session, label, wakeOnly = false, babies, initialBaby = 0, editing = null, presetStartAt = null, familyId, onClose, onSave, onDelete }) {
  const [b, setB] = useState(initialBaby);

  // `editing` viene del bebé con el que se ABRIÓ la hoja — si adentro se
  // cambia de pestaña a otra bebé (SegTabs), ese registro ya no le
  // pertenece a la pestaña activa. Sin este filtro, el formulario seguía
  // mostrando (y podía terminar guardando encima) el registro de la
  // primera bebé mientras la pestaña visible ya decía la segunda — así se
  // duplicó una Noche entera la primera vez que pasó esto.
  const relevantEditing = editing && (editing.baby_id === babies[b]?.id || editing.baby_id == null) ? editing : null;

  const nocheMode = session === 'night' && !wakeOnly;
  // Mañana es siempre minimalista, tenga o no una Noche previa que completar
  // — si alguien arranca a usar el app recién a la mañana, tiene que poder
  // cargar el despertar igual, sin que el formulario le pida antes una
  // noche que nunca existió.
  const mananaMode = wakeOnly;
  const napOpen = session === 'nap' && !!relevantEditing && relevantEditing.ended_at == null;
  const startOnly = nocheMode || (session === 'nap' && !relevantEditing);
  const [editStart, setEditStart] = useState(false); // siesta abierta: "corregir hora de inicio" fuerza el modo completo
  // "Mañana" sin ninguna Noche previa cargada: antes esto igual quedaba en
  // completeOnly y payload() mandaba started_at/fell_asleep_at inventados
  // (20:00/20:15 del día anterior, ver resetFieldsFor) sin mostrarlos ni
  // dejarlos corregir — se guardaban como si fueran reales. Ahora se cae al
  // formulario completo para pedirlos de verdad.
  const noPriorNightToComplete = mananaMode && !relevantEditing;
  const completeOnly = (mananaMode || napOpen) && !editStart && !noPriorNightToComplete;
  // Si se corrige el inicio de una siesta que sigue abierta, no hay por qué
  // obligar a dar también la hora de despertar en el mismo toque.
  const [stillSleeping, setStillSleeping] = useState(false);
  const completingWake = !startOnly && !(napOpen && editStart && stillSleeping);

  const [day, setDay] = useState(startOfDay(new Date()));
  const [start, setStart] = useState(new Date());
  const [asleep, setAsleep] = useState(new Date());
  const [end, setEnd] = useState(new Date());
  const [place, setPlace] = useState('Su cuna');
  const [endPlace, setEndPlace] = useState('Su cuna');
  const [contact, setContact] = useState('Palmaditas');
  const [feedType, setFeedType] = useState('Sin toma');
  const [feedAmountMl, setFeedAmountMl] = useState(120);
  const [feedMin, setFeedMin] = useState(12);
  const [unit, setUnit] = useState('ml');
  const [due, setDue] = useState(true);
  const [fedToSleep, setFedToSleep] = useState(false);
  const [fallAsleepMood, setFallAsleepMood] = useState('Tranquila');
  const [mood, setMood] = useState('Tranquila');
  const [wakeCount, setWakeCount] = useState(0);
  const [wakeDurations, setWakeDurations] = useState([]); // un valor por despertar — no todos duran lo mismo
  const [factors, setFactors] = useState([]);

  // Captura rápida (10-hoja-sueno.png) — solo para una entrada NUEVA que
  // recién arranca (no completar un despertar, no editar un registro viejo).
  // Reemplaza los dos TimeField absolutos por dos grupos de chips relativos
  // a "ahora"; `start`/`asleep` (los mismos estados de siempre) se derivan
  // de estas dos elecciones, así que payload() no cambia en nada.
  const [quickSleepType, setQuickSleepType] = useState(session === 'night' ? 'night' : 'nap');
  const [latencyChipMin, setLatencyChipMin] = useState(10);
  const [showDetails, setShowDetails] = useState(false);
  // Si la usuaria ya movió el stepper a mano, dejar de pisarlo con la
  // sugerencia del plan cuando cambia Siesta/Noche (ver efecto más abajo).
  const [asleepTouched, setAsleepTouched] = useState(false);

  // Carga los campos del formulario para el registro que de verdad le
  // corresponde a la bebé activa (o ninguno, si es una entrada nueva).
  const resetFieldsFor = (relevant) => {
    const now = new Date();
    if (!relevant && session === 'night' && now.getHours() < 12) {
      // Noche sin nada previo, cargada retroactiva a la mañana (se te pasó
      // anotarla anoche): arranca con una hora de acostarse sugerida, no con
      // "ahora mismo" — si no, ajustar el resto termina cayendo un día
      // después del que corresponde.
      const bedtime = addDays(now, -1);
      bedtime.setHours(20, 0, 0, 0);
      setDay(startOfDay(bedtime));
      setStart(bedtime);
      setAsleep(new Date(bedtime.getTime() + 15 * 60000));
      setEnd(now);
    } else if (!relevant && presetStartAt) {
      // Propuesta de punto medio de la tarjeta de desfasadas: arranca con
      // esa hora en vez de "ahora", editable igual que cualquier otro campo.
      setDay(startOfDay(presetStartAt));
      setStart(presetStartAt);
      setAsleep(new Date(presetStartAt.getTime() + 15 * 60000));
      setEnd(new Date(presetStartAt.getTime() + (session === 'night' ? 600 : 60) * 60000));
    } else {
      setDay(startOfDay(relevant ? new Date(relevant.started_at) : now));
      setStart(relevant ? new Date(relevant.started_at) : now);
      setAsleep(relevant?.fell_asleep_at ? new Date(relevant.fell_asleep_at) : new Date(now.getTime() + 15 * 60000));
      setEnd(relevant?.ended_at ? new Date(relevant.ended_at) : new Date(now.getTime() + (session === 'night' ? 600 : 60) * 60000));
    }
    setPlace(relevant?.place ?? 'Su cuna');
    setEndPlace(relevant?.end_place ?? relevant?.place ?? 'Su cuna');
    setContact(relevant?.contact ?? 'Palmaditas');
    setFeedType(relevant?.kind ?? 'Sin toma');
    setFeedAmountMl(relevant?.volume_ml ?? 120);
    setFeedMin(relevant?.feed_minutes ?? 12);
    setDue(relevant?.was_due ?? true);
    setFedToSleep(relevant?.fell_asleep_feeding ?? false);
    setFallAsleepMood(relevant?.fall_asleep_mood ?? 'Tranquila');
    setMood(relevant?.wake_mood ?? 'Tranquila');
    // wake_minutes en la base es un total (no hay una columna por despertar
    // individual) — al editar un registro existente se reparte parejo entre
    // los despertares como punto de partida; ajustable uno por uno.
    {
      const wc = relevant?.wake_count ?? 0;
      const total = relevant?.wake_minutes ?? 0;
      setWakeCount(wc);
      if (wc > 0) {
        const base = Math.floor(total / wc);
        const rem = total - base * wc;
        setWakeDurations(Array.from({ length: wc }, (_, i) => base + (i < rem ? 1 : 0)));
      } else {
        setWakeDurations([]);
      }
    }
    setFactors(relevant?.factors ?? []);
  };

  // FamilyShell mantiene esta hoja montada y solo alterna `open`, así que sin
  // este efecto el formulario queda pegado al primer bebé/edición con el que
  // se abrió alguna vez — es lo que causaba que registrar el sueño de la
  // segunda niña guardara (o pisara) el de la primera.
  useEffect(() => {
    if (!open) return;
    setEditStart(false);
    setStillSleeping(false);
    // "Las dos" se sacó (guardaba duplicado y dejaba siestas huérfanas con
    // mellizas, ver FamilyShell/handleSaveSleepBoth) — cada sueño se guarda
    // siempre por una bebé concreta, incluso al arrancar una entrada nueva.
    setB(initialBaby);
    const relevant = editing && (editing.baby_id === babies[initialBaby]?.id || editing.baby_id == null) ? editing : null;
    resetFieldsFor(relevant);
    setQuickSleepType(session === 'night' ? 'night' : 'nap');
    setLatencyChipMin(10);
    setShowDetails(false);
    setAsleepTouched(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, initialBaby, session]);

  // Deriva start/asleep/day de los dos grupos de chips — mismos estados que
  // ya usaba el formulario completo, solo que ahora se llenan con una resta
  // en vez de con un TimeField absoluto. Nunca corre si se está completando
  // un despertar o editando algo viejo (esos flujos siguen con sus propios
  // valores, sin tocar).
  const isQuickCapture = startOnly && !relevantEditing;

  // `start` (para la latencia) se sigue derivando de `asleep` — solo cambió
  // CÓMO se elige `asleep`: antes, un offset relativo a "ahora"; ahora, un
  // stepper de hora absoluta (ver TimeStepper más abajo en el render).
  useEffect(() => {
    if (!open || !isQuickCapture) return;
    setStart(new Date(asleep.getTime() - latencyChipMin * 60000));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isQuickCapture, asleep, latencyChipMin]);

  // Cambiar de pestaña con la hoja ya abierta: `editing` sigue siendo el
  // registro de la bebé con la que se abrió — si la pestaña nueva es otra
  // bebé sin ese registro, hay que mostrarle un formulario en blanco, no
  // los datos de la otra. Antes de este efecto, cambiar de pestaña dejaba
  // los campos de la primera bebé cargados; guardar así duplicaba su
  // registro en vez de crear uno nuevo para la segunda.
  useEffect(() => {
    if (!open) return;
    const relevant = editing && (editing.baby_id === babies[b]?.id || editing.baby_id == null) ? editing : null;
    resetFieldsFor(relevant);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b]);

  // Plan del día para esta bebé — solo para un registro NUEVO (no al editar
  // uno viejo, donde ya no aplica). Mismo cálculo que usa el cuadro
  // principal de Hoy (planBlocks, con el mismo recentRecords), para no
  // duplicar el criterio ni mostrar un número genérico al lado del que ya
  // usa Hoy. Se guarda el `pb` completo (no un solo bloque) porque lo usan
  // dos cosas: el aviso de "próxima ventana en X" de siempre, y la hora
  // sugerida al elegir Siesta/Noche en la captura rápida (más abajo).
  const [planBlocksState, setPlanBlocksState] = useState(null);
  useEffect(() => {
    if (!open || relevantEditing || !familyId || !babies[b]) { setPlanBlocksState(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const [{ sleepEvents, feedEvents }, plan] = await Promise.all([getDayRecords(familyId, 10), getLatestSleepPlan(familyId)]);
        const babyIds = babies.map((bb) => bb.id);
        const wake = getTodayWakeMinutes(sleepEvents, babyIds);
        const naps = getTodayNaps(sleepEvents, babyIds);
        const nightStart = getTodayNightStart(sleepEvents, babyIds);
        const profile = profileWithPlan(profileForBirthDate(babies[b].birth_date), plan);
        const dayRecords = buildDayRecords(sleepEvents, feedEvents, babyIds);
        const pb = planBlocks(profile, babyIds.map((_, i) => wake[i]), naps, nightStart, dayRecords);
        if (!cancelled) setPlanBlocksState(pb);
      } catch {
        if (!cancelled) setPlanBlocksState(null);
      }
    })();
    return () => { cancelled = true; };
  }, [open, relevantEditing, familyId, babies, b, session]);

  const windowHint = planBlocksState ? (() => {
    const relevant = session === 'night' ? planBlocksState[planBlocksState.length - 1] : planBlocksState.slice(1, -1).find((blk) => !blk.logged) ?? null;
    return relevant ? { atMin: relevant.atMin[b] } : null;
  })() : null;

  // Al elegir Siesta/Noche en la captura rápida, la hora sugerida cambia a
  // la del bloque correspondiente del plan — pero solo mientras la usuaria
  // no haya tocado el stepper a mano (asleepTouched), para no pisarle un
  // ajuste ya hecho.
  useEffect(() => {
    if (!open || !isQuickCapture || asleepTouched || !planBlocksState) return;
    const suggestedMin = quickSleepType === 'night'
      ? planBlocksState[planBlocksState.length - 1]?.atMin[b]
      : planBlocksState.slice(1, -1).find((blk) => !blk.logged)?.atMin[b];
    if (suggestedMin == null) return;
    const d = new Date();
    d.setHours(Math.floor(suggestedMin / 60), suggestedMin % 60, 0, 0);
    setAsleep(d);
    setDay(startOfDay(d));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isQuickCapture, asleepTouched, planBlocksState, quickSleepType, b]);

  const toggleFactor = (x) => setFactors((f) => (f.indexOf(x) >= 0 ? f.filter((y) => y !== x) : f.concat([x])));

  // Cambiar el día corre las tres horas ya elegidas la misma cantidad de
  // días, así una noche que cruza la medianoche sigue cruzándola.
  const handleDayChange = (newDay) => {
    const delta = daysBetween(newDay, day);
    if (delta === 0) return;
    setDay(newDay);
    setStart((d) => addDays(d, delta));
    setAsleep((d) => addDays(d, delta));
    setEnd((d) => addDays(d, delta));
  };

  const dayBadge = (date) => {
    const diff = daysBetween(date, start);
    if (diff === 0) return null;
    return (diff > 0 ? '+' : '') + diff + ' día' + (Math.abs(diff) > 1 ? 's' : '');
  };
  const asleepBadge = dayBadge(asleep);
  const endBadge = dayBadge(end);

  const latencyMin = Math.max(0, Math.round((asleep - start) / 60000));
  const isBottle = feedType.indexOf('Biberón') === 0;
  const showFeed = feedType !== 'Sin toma';

  const payload = (babyId) => ({
    babyId, type: 'sleep', session: isQuickCapture ? quickSleepType : session,
    startedAt: start.toISOString(), fellAsleepAt: asleep.toISOString(),
    // Noche no completa el despertar todavía: si ya estaba completo (se está
    // corrigiendo Noche después de que Mañana lo cerró), se preserva tal
    // cual; si es nuevo, queda abierto (null) hasta que Mañana lo complete.
    // Misma idea al corregir el inicio de una siesta abierta sin dar todavía
    // la hora de despertar: se preserva abierta en vez de forzar un cierre.
    endedAt: completingWake ? end.toISOString() : (relevantEditing?.ended_at ?? undefined),
    // "¿Dónde terminó durmiendo?" y los despertares ya no dependen de
    // nocheMode — antes solo se podían cargar desde "Noche", nunca desde
    // "Mañana" (el flujo que de verdad se usa día a día), así que en la
    // práctica quedaban casi siempre sin completar.
    place, endPlace: completingWake ? endPlace : (relevantEditing?.end_place ?? undefined),
    contact,
    fallAsleepMood,
    kind: showFeed ? feedType : null,
    volumeMl: showFeed && isBottle ? feedAmountMl : undefined,
    feedMinutes: showFeed && !isBottle ? feedMin : undefined,
    feedContext: showFeed ? 'Antes de dormir' : undefined,
    wasDue: showFeed ? due : undefined,
    fellAsleepFeeding: showFeed ? fedToSleep : undefined,
    wakeMood: completingWake ? mood : (relevantEditing?.wake_mood ?? undefined),
    // La cantidad de despertares ahora se pide para noche Y siesta; la
    // duración de cada despertar (wakeDurations) se sigue pidiendo solo de
    // noche a propósito — para siesta alcanza con saber que hubo, sin sumar
    // otro paso al formulario.
    wakeCount: completingWake ? wakeCount : (relevantEditing?.wake_count ?? undefined),
    wakeMinutes: nocheMode ? wakeDurations.reduce((a, v) => a + v, 0) : (relevantEditing?.wake_minutes ?? undefined),
    factors,
  });

  const confirmDelete = () => {
    Alert.alert('¿Borrar este registro?', 'No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => onDelete && onDelete() },
    ]);
  };

  // Quién está seleccionada ahora mismo, para conjugar por número (tardó/
  // tardaron, se durmió/se durmieron) — ya no existe "Las dos" (ver abajo,
  // cada bebé se guarda siempre por separado), así que esto es siempre un
  // único elemento, pero plural()/agree() ya esperan un array.
  const selectedBabies = [babies[b]].filter(Boolean);

  const handleSaveMain = () => {
    onSave && onSave(payload(babies[b]?.id));
  };

  // "Cronometrar el sueño": guarda ya mismo como sesión abierta con asleep =
  // ahora — Hoy ya tiene el cronómetro en vivo para esto (tarjeta
  // "Durmiendo", ver 01_TodayScreen.jsx), no hace falta inventar uno nuevo
  // acá. Se sobreescriben start/asleep en el payload en vez de esperar a
  // que el estado se actualice, para no guardar con un valor viejo.
  const handleCronometrar = () => {
    const now = new Date();
    const overrides = { startedAt: now.toISOString(), fellAsleepAt: now.toISOString() };
    onSave && onSave({ ...payload(babies[b]?.id), ...overrides });
  };

  const showFullFields = !completeOnly && (!isQuickCapture || showDetails);

  return (
    <SheetV2
      open={open}
      onClose={onClose}
      footer={<PrimaryButton style={{ flex: 1 }} onPress={handleSaveMain}>{isQuickCapture ? 'Guardar: ' + plural(selectedBabies, 'se durmió', 'se durmieron') + ' ' + fmt(minutesOfDay(asleep)) : 'Guardar registro'}</PrimaryButton>}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
        <CategoryIcon category="sueno" size={40} />
        <View style={{ flex: 1, gap: 1 }}>
          <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 23, lineHeight: 23 * 1.05, color: '#16162B' }}>
            {relevantEditing ? 'Editar sueño' : completeOnly ? 'Completar el despertar' : 'Registrar sueño'}
          </Text>
          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: '#8A8299' }}>
            {(babies[b]?.name ?? '').toUpperCase() + ' · ' + (daysBetween(day, startOfDay(new Date())) === 0 ? 'HOY' : 'OTRO DÍA') + ' ' + new Date().getHours() + ':' + String(new Date().getMinutes()).padStart(2, '0')}
          </Text>
        </View>
        <Text onPress={onClose} style={{ fontSize: 13, color: '#6B5DD3' }}>Cerrar</Text>
      </View>

      {/* "Las dos" existió y se sacó: con mellizas, guardar "para las dos"
          mientras se completaba una siesta abierta dejaba 4 registros
          sueltos en vez de 2 cerrados (ver FamilyShell/handleSaveSleepBoth).
          En vez de perseguir ese camino hoja por hoja, se saca la opción
          entera — cada sueño se registra siempre por una bebé concreta. */}
      {babies.length > 1 ? (
        <SegTabs
          items={babies.map((baby, i) => ({ id: i, label: baby.name }))}
          active={b}
          onSelect={setB}
        />
      ) : null}

      {!relevantEditing && windowHint ? (
        <View style={{ borderRadius: 12, backgroundColor: '#FFF9F0', borderWidth: 1, borderColor: '#EFDCC4', paddingHorizontal: 13, paddingVertical: 10 }}>
          <Text style={{ fontSize: 12.5, color: '#B08A55' }}>
            {(() => {
              const now = new Date();
              const nowMin = now.getHours() * 60 + now.getMinutes();
              const diff = windowHint.atMin - nowMin;
              return diff > 0
                ? 'Próxima ventana en ' + dur(diff) + ' — idealmente empezar a dormir para esa hora.'
                : 'Ya pasó la ventana sugerida hace ' + dur(Math.abs(diff)) + '.';
            })()}
          </Text>
        </View>
      ) : null}

      {isQuickCapture ? (
        <>
          <View style={{ gap: 8 }}>
            <GroupLabel>¿Qué sueño es?</GroupLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              <Chip selected={quickSleepType === 'nap'} onPress={() => setQuickSleepType('nap')}>Siesta</Chip>
              <Chip selected={quickSleepType === 'night'} onPress={() => setQuickSleepType('night')}>Sueño de la noche</Chip>
            </View>
          </View>

          {/* QA-1: el selector de día vive siempre visible, junto al
              stepper de hora — antes estaba enterrado en "+ Agregar más
              detalles" y una noche de ayer se perdía si no se abría ese
              acordeón. */}
          <View style={{ gap: 8 }}>
            <GroupLabel>{'¿A qué hora ' + plural(selectedBabies, 'se durmió', 'se durmieron') + '?'}</GroupLabel>
            <DayPicker day={day} onChange={handleDayChange} />
            <View style={{ alignItems: 'center', paddingTop: 4, gap: 9 }}>
              <TimeStepper
                value={fmt(minutesOfDay(asleep))}
                onDec={() => { setAsleepTouched(true); setAsleep((d) => new Date(d.getTime() - 5 * 60000)); }}
                onInc={() => { setAsleepTouched(true); setAsleep((d) => new Date(d.getTime() + 5 * 60000)); }}
                dateValue={asleep}
                onChangeDate={(d) => { setAsleepTouched(true); setAsleep(d); }}
              />
              {/* Si se acaba de dormir, ir a buscar "ahora" a fuerza de +
                  desde una hora sugerida lejana (ej. la del plan, que puede
                  estar horas atrás) era justo el caso más común y el más
                  incómodo — un toque alcanza. */}
              <Pressable
                onPress={() => { setAsleepTouched(true); setAsleep(new Date()); }}
                style={{ borderRadius: 99, backgroundColor: '#EFE9DF', paddingHorizontal: 14, paddingVertical: 7 }}
              >
                <Text style={{ fontSize: 12.5, color: '#4A4459' }}>Ahora</Text>
              </Pressable>
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <GroupLabel>{'Cuánto ' + plural(selectedBabies, 'tardó', 'tardaron') + ' en dormirse'}</GroupLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {LATENCY_OPTIONS.map((o) => (
                <Chip key={o.min} selected={latencyChipMin === o.min} onPress={() => setLatencyChipMin(o.min)}>{o.label}</Chip>
              ))}
            </View>
          </View>

          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 12, color: '#8A8299' }}>
            {(quickSleepType === 'nap' ? 'Siesta' : 'Sueño de la noche') + ' · se durmió ' + fmt(minutesOfDay(asleep)) + ' · '
              + plural(selectedBabies, 'tardó', 'tardaron') + ' ' + LATENCY_OPTIONS.find((o) => o.min === latencyChipMin).summary + ' · '
              + (babies[b]?.name ?? '')}
          </Text>

          <Pressable
            onPress={handleCronometrar}
            style={{ minHeight: 54, borderRadius: 14, backgroundColor: '#F1ECFA', borderWidth: 1, borderColor: '#DCD0F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }}
          >
            <Text style={{ fontSize: 15.5, fontWeight: '600', color: '#6B5DD3' }}>Cronometrar el sueño →</Text>
          </Pressable>

          <Pressable onPress={() => setShowDetails((v) => !v)} style={{ paddingVertical: 4 }}>
            <Text style={{ fontSize: 13, color: '#6B5DD3' }}>{showDetails ? 'Ocultar detalles' : '+ Agregar más detalles'}</Text>
          </Pressable>

          {showDetails ? (
            <View style={{ gap: 13, borderTopWidth: 1, borderTopColor: '#F0EAE0', paddingTop: 13 }}>
              <TimeField label="Empecé a dormirla" value={start} onChange={setStart} />
            </View>
          ) : null}

          <Text style={{ fontSize: 12, lineHeight: 12 * 1.4, color: '#8A8299' }}>
            Queda en "Lo que ya pasó hoy" y la próxima ventana se recalcula.
          </Text>
        </>
      ) : (
        <>
          {completeOnly ? (
            <View style={{ gap: 9, borderRadius: 12, backgroundColor: '#F6F1FB', paddingHorizontal: 13, paddingVertical: 11 }}>
              {mananaMode ? (
                relevantEditing ? (
                  <>
                    <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 12.5, color: '#6B5DD3' }}>
                      Empezó a dormir {start.getHours()}:{String(start.getMinutes()).padStart(2, '0')} · se durmió {asleep.getHours()}:{String(asleep.getMinutes()).padStart(2, '0')}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#8A8299' }}>Ya cargado desde Noche — toca "Noche" si necesitas corregirlo.</Text>
                  </>
                ) : (
                  <Text style={{ fontSize: 12, color: '#8A8299' }}>Sin una noche cargada todavía — se guarda solo con la hora de despertar.</Text>
                )
              ) : (
                <>
                  <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 12.5, color: '#6B5DD3' }}>
                    Empezó a dormir {start.getHours()}:{String(start.getMinutes()).padStart(2, '0')} · se durmió {asleep.getHours()}:{String(asleep.getMinutes()).padStart(2, '0')} — falta la hora de despertar.
                  </Text>
                  <Pressable
                    onPress={() => { setEditStart(true); setStillSleeping(true); }}
                    style={{ alignSelf: 'flex-start', borderRadius: 99, backgroundColor: '#EEE7FA', paddingHorizontal: 11, paddingVertical: 6 }}
                  >
                    <Text style={{ fontSize: 12, color: '#6B5DD3', fontWeight: '500' }}>¿La hora de inicio está mal? Corrígela</Text>
                  </Pressable>
                </>
              )}
            </View>
          ) : (
            <DayPicker day={day} onChange={handleDayChange} />
          )}

          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {!completeOnly ? (
                <>
                  <TimeField label="Empecé a dormirla" value={start} onChange={setStart} />
                  <View>
                    <TimeField label="Se durmió" value={asleep} onChange={(t) => setAsleep(snapAfter(t, start))} />
                    {asleepBadge ? <Text style={{ marginTop: 3, fontFamily: theme.fontFamily.mono, fontSize: 10.5, color: '#A9A2B5' }}>{asleepBadge}</Text> : null}
                  </View>
                </>
              ) : null}
              {completingWake ? (
                <View style={completeOnly ? { flex: 1 } : undefined}>
                  <TimeField label="Se despertó" value={end} onChange={(t) => setEnd(snapAfter(t, asleep))} />
                  {endBadge ? <Text style={{ marginTop: 3, fontFamily: theme.fontFamily.mono, fontSize: 10.5, color: '#A9A2B5' }}>{endBadge}</Text> : null}
                </View>
              ) : null}
            </View>
            {napOpen && editStart ? (
              <ToggleRow label="Todavía está durmiendo" checked={stillSleeping} onChange={() => setStillSleeping((v) => !v)} />
            ) : null}
            {!completeOnly && completingWake ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 9, borderRadius: 11, backgroundColor: '#F6F1FB', paddingHorizontal: 12, paddingVertical: 9 }}>
                <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 12.5, color: '#6B5DD3' }}>tardó en dormirse {dur(latencyMin)}</Text>
                <View style={{ height: 13, width: 1, backgroundColor: '#C9C1D8' }} />
                <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 12.5, color: '#6B5DD3' }}>durmió {dur(Math.max(0, Math.round((end - asleep) / 60000)))}</Text>
              </View>
            ) : null}
          </View>
        </>
      )}

      {showFullFields ? (
        <>
          <Field label="¿Dónde se durmió?">
            {PLACES.map((x) => <Chip key={x} selected={place === x} onPress={() => setPlace(x)}>{x}</Chip>)}
          </Field>

          <Field label="¿Necesitó contacto?">
            {CONTACTS.map((x) => <Chip key={x} selected={contact === x} onPress={() => setContact(x)}>{x}</Chip>)}
          </Field>

          {/* Distinto de "¿Cómo despertó?": esto es sobre el proceso de
              dormirse, para poder separar "hizo berrinche por sobrecansancio"
              de "tardó porque todavía no le tocaba esa ventana". */}
          <View style={{ gap: 8 }}>
            <GroupLabel>¿Cómo se durmió?</GroupLabel>
            <View style={{ flexDirection: 'row', gap: 7 }}>
              {FALL_ASLEEP_MOODS.map((m) => {
                const on = fallAsleepMood === m.label;
                return (
                  <Pressable
                    key={m.label}
                    onPress={() => setFallAsleepMood(m.label)}
                    style={{
                      flex: 1, paddingVertical: 9, paddingHorizontal: 4, borderRadius: 13, alignItems: 'center', gap: 4,
                      backgroundColor: on ? '#EEF6F2' : '#FBF7F0', borderWidth: on ? 1.5 : 1, borderColor: on ? '#7FB09A' : '#DCD4C8',
                    }}
                  >
                    <Ionicons name={m.icon} size={20} color={on ? '#3F7A62' : '#8A8299'} />
                    <Text style={{ fontSize: 12.5, color: on ? '#16162B' : '#4A4459' }}>{genderLabel(m.label, selectedBabies)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <GroupLabel>Toma de leche antes de dormir</GroupLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {FEED_TYPES.map((x) => <Chip key={x} selected={feedType === x} onPress={() => setFeedType(x)}>{x}</Chip>)}
            </View>
            {showFeed ? (
              <View style={{ gap: 9, borderRadius: 12, borderWidth: 1, borderColor: '#E4DCD0', backgroundColor: '#FBF7F0', paddingHorizontal: 13, paddingVertical: 11 }}>
                {isBottle ? (
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                    <UnitToggle unit={unit} onChange={setUnit} />
                  </View>
                ) : null}
                <Stepper
                  label={isBottle ? 'Cantidad' : 'Duración (min)'}
                  value={isBottle ? fmtVolume(feedAmountMl, unit) : feedMin + ' min'}
                  onDec={() => (isBottle ? setFeedAmountMl((v) => stepVolume(v, unit, -1)) : setFeedMin((v) => Math.max(1, v - 1)))}
                  onInc={() => (isBottle ? setFeedAmountMl((v) => stepVolume(v, unit, 1)) : setFeedMin((v) => v + 1))}
                />
                <ToggleRow label="Le tocaba esta toma" hint="según la tabla de su edad" checked={due} onChange={() => setDue((v) => !v)} />
                <ToggleRow label="Se durmió durante la toma" checked={fedToSleep} onChange={() => setFedToSleep((v) => !v)} tone="coral" />
              </View>
            ) : null}
          </View>
        </>
      ) : null}

      {completingWake ? (
        <View style={{ gap: 8 }}>
          <GroupLabel>¿Cómo despertó?</GroupLabel>
          <View style={{ flexDirection: 'row', gap: 7 }}>
            {MOODS.map((m) => {
              const on = mood === m.label;
              return (
                <Pressable
                  key={m.label}
                  onPress={() => setMood(m.label)}
                  style={{
                    flex: 1, paddingVertical: 9, paddingHorizontal: 4, borderRadius: 13, alignItems: 'center', gap: 4,
                    backgroundColor: on ? '#EEF6F2' : '#FBF7F0', borderWidth: on ? 1.5 : 1, borderColor: on ? '#7FB09A' : '#DCD4C8',
                  }}
                >
                  <Ionicons name={m.icon} size={20} color={on ? '#3F7A62' : '#8A8299'} />
                  <Text style={{ fontSize: 12.5, color: on ? '#16162B' : '#4A4459' }}>{genderLabel(m.label, selectedBabies)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {nocheMode ? (
        <>
          <Stepper
            label={'Despertares (hubo que ' + agree(selectedBabies, 'consolarlo', 'consolarla') + ')'}
            value={String(wakeCount)}
            onDec={() => { setWakeCount((v) => Math.max(0, v - 1)); setWakeDurations((d) => d.slice(0, -1)); }}
            onInc={() => { setWakeCount((v) => v + 1); setWakeDurations((d) => d.concat([10])); }}
          />
          {/* Uno por despertar, no un total: un despertar de una hora a las
              3am y otro de 5 min no pesan igual — sumarlos en un solo
              número tapaba justo esa diferencia. */}
          {wakeDurations.map((minutes, i) => (
            <Stepper
              key={i}
              label={'Despertar ' + (i + 1) + ' · cuánto duró'}
              value={dur(minutes)}
              onDec={() => setWakeDurations((d) => d.map((v, j) => (j === i ? Math.max(0, v - 5) : v)))}
              onInc={() => setWakeDurations((d) => d.map((v, j) => (j === i ? v + 5 : v)))}
            />
          ))}
        </>
      ) : null}

      {/* Despertares durante la siesta — a diferencia de la noche, sin
          duración por despertar (alcanza con saber que hubo, sin sumar un
          paso más al formulario para algo que dura minutos). */}
      {session === 'nap' && completingWake ? (
        <Stepper
          label="Despertares durante la siesta"
          value={String(wakeCount)}
          onDec={() => setWakeCount((v) => Math.max(0, v - 1))}
          onInc={() => setWakeCount((v) => v + 1)}
        />
      ) : null}

      {/* Antes vivía adentro de nocheMode, así que solo se podía cargar
          desde "Noche" — nunca desde "Mañana", que es el flujo que de
          verdad se usa día a día. Ahora se pide cada vez que se completa un
          despertar, sea de noche o de siesta. */}
      {completingWake ? (
        <Field label="¿Dónde terminó durmiendo?">
          {PLACES.map((x) => <Chip key={x} selected={endPlace === x} onPress={() => setEndPlace(x)}>{x}</Chip>)}
        </Field>
      ) : null}

      {showFullFields ? (
        <Field label="Factores del día">
          {FACTORS.map((x) => <Chip key={x} selected={factors.indexOf(x) >= 0} onPress={() => toggleFactor(x)}>{x}</Chip>)}
        </Field>
      ) : null}

      {relevantEditing && onDelete ? (
        <DangerButton onPress={confirmDelete} minH={44}>Borrar este registro</DangerButton>
      ) : null}
    </SheetV2>
  );
}

function Field({ label, children }) {
  return (
    <View style={{ gap: 8 }}>
      <GroupLabel>{label}</GroupLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{children}</View>
    </View>
  );
}
export default SleepLogSheet;
