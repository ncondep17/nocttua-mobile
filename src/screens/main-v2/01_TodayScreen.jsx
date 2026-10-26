import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Alert, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '@nocttua/theme/native';
import { ScreenTitle, NightCard, Eyebrow, SectionRule, Avatar, CategoryIcon, Glyph } from '../../components/v2/primitives';
import { ScreenBody } from '../../components/v2/MobileChrome';
import { MedStrip } from '../../components/v2/MedStrip';
import { ACCENT, profileForBirthDate } from '../../data/profiles';
import { planBlocks, perBaby } from '../../lib/derive';
import { detectMilestone } from '../../lib/milestones';
import { hasSeenMilestone, recordMilestone } from '../../lib/milestoneLog';
import { dur, fmt, minutesOfDay, toMin } from '../../lib/time';
import { getMyFamilyId, getBabies, getRecentEvents, getLatestSleepPlan, getSiblingType, shouldReceiveWindowAlerts } from '../../data/family';
import { profileWithPlan } from '../../lib/assessment';
import { agree, plural } from '../../lib/grammar';
import {
  getDayRecords, getTodayWakeMinutes, getTodayNaps, getTodayNightStart,
  getTodayWakeEvent, getTodayNapEvents, getOpenNightEvent, buildDayRecords,
} from '../../data/dayRecords';
import { getShiftNotes, addShiftNote } from '../../data/shiftNotes';
import { scheduleTodayWindowAlerts } from '../../lib/scheduleTodayWindows';
import { cancelWindowAlert } from '../../lib/windowAlerts';
import { supabase } from '../../lib/supabase';
import { useNowTick } from '../../lib/useNowTick';
import { useFeedSession } from '../../lib/useFeedSession';
import { savePechoSession } from '../../lib/feedSessionSave';
import { navigate } from '../../navigation/navigationRef';

/** Colores de punto por categoría — mismos tokens que CATEGORY_ICONS en primitives.jsx (README §Iconografía), para "Lo que ya pasó hoy". */
const DOT = { sueno: '#6B5DD3', despertar: '#F0A868', toma: '#4E8FA8', extraccion: '#8A6BC4', panal: '#3F7A62' };

/** Anillo de progreso de la ventana — mismo concepto visual que el handoff (conic-gradient), hecho con dos círculos SVG apilados. */
function WindowRing({ percent, size = 76, children }) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, Math.max(0, percent)));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#2A2848" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r} stroke="#8C7DF0" strokeWidth={stroke} fill="none"
          strokeDasharray={`${c} ${c}`} strokeDashoffset={offset} strokeLinecap="round"
        />
      </Svg>
      {children}
    </View>
  );
}

/** Punto que respira — "en curso" en el héroe de noche (mismo patrón que BreathingRing de NightModeScreen, en un punto en vez de un aro). */
function BreathingDot({ color = '#A79FE0', size = 8 }) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={{ width: size, height: size, borderRadius: 99, backgroundColor: color, opacity }} />;
}

const TODAY_LABEL = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' });

function hm(iso) {
  const d = new Date(iso);
  return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
}

/** "Hoy" / "Ayer" / "Lun 20 oct" — para separar los días en "Lo que ya pasó hoy" cuando se expande a VER 7 DÍAS, donde una sola lista de horas sin fecha no decía de qué día era cada una. */
function dayLabel(ts) {
  const d = new Date(ts);
  const startOfDay = new Date(d); startOfDay.setHours(0, 0, 0, 0);
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const diffDays = Math.round((startOfToday.getTime() - startOfDay.getTime()) / 86400000);
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** "21 meses" / "2 años" — igual que profileForBirthDate, en base al primer bebé (ver nota de simplificación arriba). */
function ageLabel(birthDate) {
  if (!birthDate) return '';
  const months = Math.round((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 1) return 'recién nacida';
  if (months < 24) return months + (months === 1 ? ' mes' : ' meses');
  const years = Math.floor(months / 12);
  return years + (years === 1 ? ' año' : ' años');
}

/**
 * Hoy — la pantalla que se abre a las 3 de la mañana. Rediseño v3
 * (design_handoff_nocttua_ux 5 / PROMPT-hoy-v3.md, posterior al testing real):
 * héroe de 3 variantes mutuamente excluyentes según el estado de las noches
 * (abierta / desfasada / mañana), plan no tocable, un solo lugar para
 * registrar (los 4 tiles + el botón del héroe) y "Lo que ya pasó hoy" con
 * todos los tipos de registro de verdad.
 *
 * Simplificación real declarada: el plan de hoy usa la franja de edad del
 * primer bebé para ambas (ver profiles.js) — si algún día hay hermanos de
 * edades muy distintas, cada uno necesitará su propio perfil.
 */
export function TodayScreen({ onOpenLog, episode, prescriptions, doses, onOpenMeds, onLogDiaper, onOpenSettings, onOpenMorning, onOpenWins, onOpenPlan, onOpenCloseNight, refreshKey }) {
  useNowTick();
  const [babies, setBabies] = useState([]);
  const [profile, setProfile] = useState(null);
  const [diaperEvents, setDiaperEvents] = useState([]);
  const [todayWake, setTodayWake] = useState([]);
  const [todayNaps, setTodayNaps] = useState([]);
  const [todayNightStart, setTodayNightStart] = useState([]);
  const [wakeEvents, setWakeEvents] = useState([]);
  const [napEvents, setNapEvents] = useState([]);
  const [openNights, setOpenNights] = useState([]);
  const [rawSleep, setRawSleep] = useState([]);
  const [rawFeed, setRawFeed] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [sleepPlan, setSleepPlan] = useState(null);
  const [siblingType, setSiblingType] = useState('single');
  const [notes, setNotes] = useState([]);
  const [familyId, setFamilyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [winBanner, setWinBanner] = useState(null); // { id, text } — ver milestones.js; se apaga solo pasado el medio día
  const [showWeek, setShowWeek] = useState(false);
  // "Dejar cada una" en la tarjeta de mellizas desfasadas — no se resetea en
  // cada load() a propósito (load() corre en cada focus de la pestaña), solo
  // dura mientras la pantalla sigue montada.
  const [forceSeparate, setForceSeparate] = useState(false);
  const [gridBaby, setGridBaby] = useState(0);
  const { session: feedSession, totalElapsedMs, stop: stopFeedSession, cancel: cancelFeedSession } = useFeedSession();

  const load = useCallback(async () => {
    try {
      const fid = await getMyFamilyId();
      setFamilyId(fid);
      // Ninguna de estas cinco depende del resultado de las otras — solo
      // necesitan fid — así que van todas juntas en vez de en serie.
      // 10 días en vez de 2: alcanza para "Lo que ya pasó hoy" (hoy + VER 7
      // DÍAS) además del historial que ya usaban los cálculos de plan.
      const [babiesData, { sleepEvents, feedEvents }, notesData, diaperData, plan, siblingTypeData] = await Promise.all([
        getBabies(fid), getDayRecords(fid, 10), getShiftNotes(fid), getRecentEvents(fid, { hours: 24 * 10, types: ['diaper'] }), getLatestSleepPlan(fid), getSiblingType(fid),
      ]);
      setBabies(babiesData);
      setProfile(profileForBirthDate(babiesData[0]?.birth_date));
      setSleepPlan(plan);
      setSiblingType(siblingTypeData);
      setNotes(notesData);
      setDiaperEvents(diaperData);
      setRawSleep(sleepEvents);
      setRawFeed(feedEvents);

      const babyIds = babiesData.map((b) => b.id);
      const dayRecords = buildDayRecords(sleepEvents, feedEvents, babyIds);
      setRecentRecords(dayRecords);
      // Hitos (ver milestones.js): el primero que aplique y no se haya
      // celebrado todavía gana. Se registra siempre en el log — se MUESTRA
      // como banner solo si todavía es antes del medio día (ver el render).
      (async () => {
        for (let i = 0; i < babiesData.length; i++) {
          const m = detectMilestone(perBaby(dayRecords, i), babiesData[i].name);
          if (m && !(await hasSeenMilestone(m.id))) {
            await recordMilestone(m);
            setWinBanner(m);
            break;
          }
        }
      })().catch(() => {});
      const wake = getTodayWakeMinutes(sleepEvents, babyIds);
      setTodayWake(wake);
      const naps = getTodayNaps(sleepEvents, babyIds);
      setTodayNaps(naps);
      const nightStart = getTodayNightStart(sleepEvents, babyIds);
      setTodayNightStart(nightStart);
      setWakeEvents(getTodayWakeEvent(sleepEvents, babyIds));
      setNapEvents(getTodayNapEvents(sleepEvents, babyIds));
      // La noche TODAVÍA ABIERTA de cada bebé, sin importar en qué día
      // calendario empezó (a las 3am casi siempre "empezó ayer") — es lo que
      // decide qué variante del héroe se muestra. getTodayNightEvent (filtra
      // por "empezó hoy") no sirve para esto: una noche abierta desde ayer a
      // la noche quedaba invisible hasta que cruzaba la medianoche calendario.
      setOpenNights(getOpenNightEvent(sleepEvents, babyIds));

      const babyProfile = profileWithPlan(profileForBirthDate(babiesData[0]?.birth_date), plan);
      // Si hay alguien de turno hoy y no soy yo, me quedo callada en vez de
      // sumar un aviso más al teléfono de quien no está cuidando ahora.
      shouldReceiveWindowAlerts(fid).then((shouldNotify) => {
        if (shouldNotify) {
          scheduleTodayWindowAlerts(babiesData, planBlocks(babyProfile, babyIds.map((_, i) => wake[i]), naps, nightStart, dayRecords)).catch(() => {});
        } else {
          babiesData.forEach((b) => cancelWindowAlert(b.id).catch(() => {}));
        }
      }).catch(() => {});
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Ver la nota equivalente en CareScreen.jsx: refreshKey ya no remonta la
  // pantalla (MainTabs dejó de pasarlo como `key`), solo dispara un refetch.
  const isFirstRefresh = useRef(true);
  useEffect(() => {
    if (isFirstRefresh.current) { isFirstRefresh.current = false; return; }
    load();
  }, [refreshKey, load]);

  const handleAddNote = () => {
    Alert.prompt('Nota de relevo', 'Qué le dejas al siguiente turno', async (text) => {
      if (!text?.trim()) return;
      const { data } = await supabase.auth.getSession();
      await addShiftNote(familyId, data.session.user.id, text);
      load();
    });
  };

  if (loading || !profile) {
    return (
      <ScreenBody>
        <Text style={{ fontFamily: theme.fontFamily.uiApp, color: '#8A8299' }}>Cargando…</Text>
      </ScreenBody>
    );
  }

  const effectiveProfile = profileWithPlan(profile, sleepPlan);
  const pb = planBlocks(effectiveProfile, babies.map((_, i) => todayWake[i]), todayNaps, todayNightStart, recentRecords);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  // El primer bloque después del despertar que todavía no se registró (y
  // que no está en curso — una siesta abierta no es "próxima", ya empezó)
  // — así "Próxima ventana" avanza sola cuando ya se cargó la siesta
  // anterior, en vez de saltearse la que sigue durmiendo ahora mismo.
  const nextBlock = pb.slice(1).find((b) => !b.logged && !b.open) ?? pb[pb.length - 1];
  const note = 'A ' + profile.short + ' esperamos ' + profile.napsLabel + ' siesta(s), ventanas de ' + profile.window + ' y noche sobre las ' + pb[pb.length - 1].times[0] + '.';

  // Hora sugerida para "cerrar la noche" — la del plan de la família (no una
  // heurística por bebé): CloseNightSheet arranca el stepper ahí.
  const planWakeMinArr = babies.map(() => (sleepPlan?.wakeTime ? toMin(sleepPlan.wakeTime) : 390));

  // Estado del héroe: 3 variantes mutuamente excluyentes según cuántas
  // noches siguen abiertas — ver PROMPT-hoy-v3.md §1.1. Independiente del
  // desfase de VENTANA diurna (showDesfasadas más abajo), que es otro eje.
  const allNightsOpen = babies.length > 0 && openNights.every(Boolean);
  const noNightsOpen = openNights.length > 0 && openNights.every((n) => !n);
  const mixedNights = babies.length > 1 && !allNightsOpen && !noNightsOpen;

  // Guarda directo desde Hoy — mismo helper que usa Leche (savePechoSession)
  // para no mantener la lógica de "un evento por tramo" en dos lugares. Solo
  // para pecho: extracción necesita el paso de cargar cuánto sacó, que hoy
  // solo existe en Leche (PumpAmountSheet).
  const handleStopFeedTimer = async () => {
    const result = stopFeedSession();
    try {
      const fid = await getMyFamilyId();
      const saved = await savePechoSession(fid, result);
      if (saved.tooShort) {
        Alert.alert('Muy corto para guardar', 'Prueba de nuevo.');
        return;
      }
      if (saved.allFailed) {
        Alert.alert('No se pudo guardar', saved.failReason?.message ?? String(saved.failReason));
      } else if (saved.partial) {
        Alert.alert('Se guardó solo una parte', 'Revisa el registro en Leche y complétalo a mano si hace falta.');
      }
    } catch (err) {
      Alert.alert('No se pudo guardar', err.message ?? String(err));
    }
  };

  // Estado por bebé para la variante "mañana" del héroe (ver más abajo) —
  // acá nunca hay noche abierta (es la precondición de esta variante), así
  // que "durmiendo ahora" solo puede ser una siesta.
  const babyStates = babies.map((baby, i) => {
    const openNapI = (napEvents[i] || []).find((e) => !e.ended_at) ?? null;
    // wakeWindow = now − lastSleepEnd real (README): el ancla de la ventana
    // avanza con cada siesta que se completa, no se queda fija en el
    // despertar de la mañana — si no, el % del anillo daba una fracción
    // chica de más después de la primera siesta del día.
    const completedNapEndsI = (todayNaps[i] || []).filter((n) => n.end != null).map((n) => n.end);
    const lastSleepEndCandidatesI = [todayWake[i], ...completedNapEndsI].filter((v) => v != null);
    const lastSleepEndI = lastSleepEndCandidatesI.length ? Math.max(...lastSleepEndCandidatesI) : null;
    return {
      baby,
      openNapI,
      sleepingNowI: openNapI,
      wakeLoggedI: todayWake[i] != null,
      nextWindowTimeI: nextBlock?.atMin[i] ?? null,
      windowStartI: lastSleepEndI,
    };
  });
  // Mellizas desfasadas (ventana diurna, no la noche): si las dos ya
  // despertaron y su próxima ventana difiere 20 min o más, una sola tarjeta
  // por bebé escondería que no van sincronizadas. El desfase solo es una
  // anomalía a resolver con siblingType 'multiple'.
  const bothWindowKnown = siblingType === 'multiple' && babies.length === 2
    && babyStates[0].nextWindowTimeI != null && babyStates[1].nextWindowTimeI != null;
  const offsetMin = bothWindowKnown ? Math.abs(babyStates[0].nextWindowTimeI - babyStates[1].nextWindowTimeI) : null;
  const bothAwakeWaiting = bothWindowKnown && babyStates.every((s) => s.wakeLoggedI && !s.sleepingNowI);
  const showDesfasadas = !forceSeparate && bothAwakeWaiting && offsetMin >= 20;
  const showSynced = !forceSeparate && bothAwakeWaiting && offsetMin < 20;
  // Punto medio real: solo se ofrece unir si mover a CADA bebé a esa hora
  // cabe dentro de su tolerancia declarada en el plan.
  const toleranceMin = sleepPlan?.toleranceMin ?? 15;
  const midpointMin = showDesfasadas ? Math.min(babyStates[0].nextWindowTimeI, babyStates[1].nextWindowTimeI) + offsetMin / 2 : null;
  const midpointWithinTolerance = showDesfasadas && babyStates.every((s) => Math.abs(midpointMin - s.nextWindowTimeI) <= toleranceMin);

  // "Lo que ya pasó hoy" — todos los tipos de registro de verdad, no solo
  // sueño. `days` = 1 muestra solo hoy calendario; 7 amplía con los mismos
  // datos que ya trajo load() (getDayRecords(fid, 10) alcanza de sobra).
  const buildFeedRows = (days) => {
    const since = days <= 1 ? new Date(new Date().toDateString()).getTime() : Date.now() - days * 86400000;
    const rows = [];
    const nameFor = (babyId) => {
      const baby = babies.find((b) => b.id === babyId);
      if (baby) return baby.name + ' · ';
      return babies.length > 1 ? 'Las dos · ' : '';
    };
    rawSleep.forEach((e) => {
      if (!e.ended_at) {
        if (new Date(e.started_at).getTime() < since) return;
        const bi = babies.findIndex((b) => b.id === e.baby_id);
        rows.push({
          id: e.id + '-open', ts: new Date(e.started_at).getTime(), dot: DOT.sueno,
          time: hm(e.started_at),
          text: nameFor(e.baby_id) + (e.session === 'night' ? 'Empezó a dormir' : 'Empezó la siesta') + ' (abierta)',
          // Una noche abierta se cierra con CloseNightSheet (quién/hora/
          // despertares); una siesta abierta es una sola bebé, sin ese
          // formulario — se completa con la SleepLogSheet de siempre, en su
          // modo "completar el despertar" (napOpen), que ya sabe pedir solo
          // la hora y el humor. Antes esto mandaba las dos a CloseNightSheet,
          // que no tiene datos de siestas y solo ofrecía "Las dos" sin poder
          // guardar nada.
          //
          // `bi` da -1 para una fila vieja "aplicar a ambas" (baby_id null,
          // de antes de que esto se separara por bebé) — ANTES eso dejaba
          // onPress en undefined, un registro abierto que no se podía tocar
          // para cerrar ni borrar nunca más. belongsTo() ya trata baby_id
          // null como "de cualquiera de las dos", así que CloseNightSheet y
          // SleepLogSheet (+ splitSharedIfNeeded en FamilyShell) ya saben
          // resolverlo igual — solo hacía falta no rendirse antes de llegar.
          onPress: e.session === 'night'
            ? () => onOpenCloseNight && onOpenCloseNight(Math.max(bi, 0), openNights, planWakeMinArr)
            : () => onOpenLog && onOpenLog('Siesta', Math.max(bi, 0), 'nap', e, false),
        });
        return;
      }
      if (new Date(e.ended_at).getTime() < since) return;
      if (e.session === 'night') {
        const wc = e.wake_count;
        rows.push({
          id: e.id + '-wake', ts: new Date(e.ended_at).getTime(), dot: DOT.despertar, time: hm(e.ended_at),
          text: nameFor(e.baby_id) + 'Despertaron' + (wc != null ? ' · ' + wc + ' despertar' + (wc === 1 ? '' : 'es') : ''),
        });
      } else {
        rows.push({
          id: e.id + '-nap', ts: new Date(e.ended_at).getTime(), dot: DOT.sueno, time: hm(e.started_at),
          text: nameFor(e.baby_id) + 'Siesta · ' + dur(Math.max(0, Math.round((new Date(e.ended_at) - new Date(e.fell_asleep_at || e.started_at)) / 60000))),
        });
      }
    });
    rawFeed.forEach((e) => {
      if (new Date(e.started_at).getTime() < since) return;
      rows.push({
        id: e.id, ts: new Date(e.started_at).getTime(), dot: e.type === 'pump' ? DOT.extraccion : DOT.toma, time: hm(e.started_at),
        text: nameFor(e.baby_id) + (e.type === 'pump' ? 'Extracción' + (e.volume_ml ? ' · ' + e.volume_ml + ' ml' : '') : (e.kind || 'Toma')),
      });
    });
    diaperEvents.forEach((e) => {
      if (new Date(e.started_at).getTime() < since) return;
      rows.push({ id: e.id, ts: new Date(e.started_at).getTime(), dot: DOT.panal, time: hm(e.started_at), text: nameFor(e.baby_id) + (e.kind || 'Pañal') });
    });
    return rows.sort((a, b) => b.ts - a.ts);
  };
  const todayFeedRows = buildFeedRows(showWeek ? 7 : 1);
  const todayStr = new Date().toDateString();
  const todayDiaperEvents = diaperEvents.filter((e) => new Date(e.started_at).toDateString() === todayStr);

  // Sugerencia del plan (no tocable, PROMPT-hoy-v3.md §1.2) — los próximos
  // bloques todavía no registrados, sin contar el despertar de la mañana
  // (eso es un hecho ya pasado, no una sugerencia a futuro).
  const upcomingPlan = pb.filter((b) => b.key !== 'wake' && !b.logged && !b.open).slice(0, 2);

  return (
    <ScreenBody gap={12}>
      <ScreenTitle
        eyebrow={TODAY_LABEL + (babies[0]?.birth_date ? ' · ' + ageLabel(babies[0].birth_date) : '')}
        title="Hoy"
        action={
          // El ícono de luna que vivía acá quedó redundante: "Noche" ahora
          // es su propia pestaña en la barra de abajo (ver tabs.js).
          <Pressable onPress={() => onOpenSettings && onOpenSettings()} style={{ flexDirection: 'row', alignItems: 'center' }}>
            {babies.map((b, i) => (
              <View key={b.id} style={{ marginLeft: i > 0 ? -13 : 0 }}>
                <Avatar initial={b.initial} bg={b.tone === 'a' ? '#E8DFF6' : '#FDE8D7'} fg={b.tone === 'a' ? ACCENT.a : ACCENT.b} size={29} fontSize={12} />
              </View>
            ))}
          </Pressable>
        }
      />

      {/* Banner de hito (ver milestones.js) — a propósito NO es un elemento
          fijo: se apaga solo pasado el medio día para que la pantalla
          vuelva a estar enfocada en lo que importa, que es el registro. Si
          se cierra pasado el mediodía sigue en "Ver otros wins". */}
      {winBanner && now.getHours() < 12 ? (
        <View style={{ borderRadius: 18, backgroundColor: '#16162B', padding: 15, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <Text style={{ flex: 1, fontSize: 14.5, lineHeight: 14.5 * 1.35, color: '#FBF7F0' }}>
              <Text style={{ fontWeight: '600' }}>¡Vamos muy bien! </Text>{winBanner.text}
            </Text>
            <Pressable onPress={() => setWinBanner(null)} hitSlop={10}>
              <Text style={{ fontSize: 15, color: '#8A8299' }}>✕</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => { setWinBanner(null); onOpenWins && onOpenWins(); }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#F0A868' }}>Ver otros wins →</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Héroe: 3 variantes mutuamente excluyentes según el estado de la
          noche (abierta / desfasada / mañana) — PROMPT-hoy-v3.md §1.1. El
          puntaje 0–10 nunca vive acá, solo dentro del reporte de Mañana. */}
      {allNightsOpen ? (
        <NightCard radius={26} style={{ padding: 18, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <BreathingDot color="#A79FE0" />
            <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase', color: '#A79FE0' }}>
              {'Durmiendo ahora' + (babies.length > 1 ? ' · Las dos' : babies[0] ? ' · ' + babies[0].name : '')}
            </Text>
          </View>
          {(() => {
            const starts = openNights.filter(Boolean).map((n) => new Date(n.fell_asleep_at || n.started_at).getTime());
            const earliest = starts.length ? Math.min(...starts) : null;
            const cribMin = earliest != null ? Math.max(0, Math.round((now.getTime() - earliest) / 60000)) : 0;
            const asleepMin = earliest != null ? minutesOfDay(new Date(earliest)) : null;
            const totalWakes = openNights.reduce((sum, n) => sum + (n?.wake_count ?? 0), 0);
            return (
              <>
                <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 52, lineHeight: 52, color: '#FBF7F0' }}>{dur(cribMin)}</Text>
                <Text style={{ fontSize: 13.5, lineHeight: 13.5 * 1.45, color: '#B9B2C9' }}>
                  {plural(babies, 'Se durmió', 'Se durmieron')} a las {asleepMin != null ? fmt(asleepMin) : '—'}.{' '}
                  {totalWakes > 0 ? totalWakes + ' despertar' + (totalWakes === 1 ? '' : 'es') + ' registrados.' : 'Nadie registró despertares todavía.'}
                </Text>
              </>
            );
          })()}
          <Pressable
            onPress={() => onOpenCloseNight && onOpenCloseNight('both', openNights, planWakeMinArr)}
            style={{ minHeight: 52, borderRadius: 14, backgroundColor: '#F0A868', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 15.5, fontWeight: '600', color: '#16162B' }}>{plural(babies, 'Ya despertó', 'Ya despertaron')} →</Text>
          </Pressable>
          <Text style={{ fontSize: 11.5, color: '#6E6A8E' }}>Ahí mismo te pregunta la hora y cuántos despertares hubo.</Text>
        </NightCard>
      ) : mixedNights ? (
        <NightCard radius={26} style={{ padding: 18, gap: 12 }}>
          <Eyebrow tone="amber">La noche se partió</Eyebrow>
          {babies.map((baby, i) => {
            const openNight = openNights[i];
            if (!openNight) {
              const wc = wakeEvents[i]?.wake_count ?? 0;
              return (
                <View key={baby.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                  <Glyph category="confirmado" size={15} color="#3F7A62" />
                  <Text style={{ flex: 1, fontSize: 13.5, lineHeight: 13.5 * 1.4, color: '#DCD6F0' }}>
                    {baby.name} despertó {todayWake[i] != null ? fmt(todayWake[i]) : '—'} · {wc} despertar{wc === 1 ? '' : 'es'} · su ventana: {nextBlock?.atMin[i] != null ? fmt(nextBlock.atMin[i]) : '—'}
                  </Text>
                </View>
              );
            }
            const elapsed = Math.max(0, Math.round((now.getTime() - new Date(openNight.fell_asleep_at || openNight.started_at).getTime()) / 60000));
            return (
              <View key={baby.id} style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                  <BreathingDot color={ACCENT[baby.tone]} size={7} />
                  <Text style={{ flex: 1, fontSize: 13.5, color: '#DCD6F0' }}>{baby.name} sigue durmiendo · {dur(elapsed)} en la cuna</Text>
                </View>
                <Pressable
                  onPress={() => onOpenCloseNight && onOpenCloseNight(i, openNights, planWakeMinArr)}
                  style={{ minHeight: 44, borderRadius: 12, backgroundColor: '#F0A868', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#16162B' }}>{baby.name} ya despertó</Text>
                </Pressable>
              </View>
            );
          })}
          <Text style={{ fontSize: 12, lineHeight: 12 * 1.4, color: '#6E6A8E' }}>El reporte de la noche se abre cuando las dos estén despiertas.</Text>
        </NightCard>
      ) : (
        <View style={{ gap: 12 }}>
          <Pressable
            onPress={() => onOpenMorning && onOpenMorning()}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 14, backgroundColor: '#F3EFE6', paddingHorizontal: 14, paddingVertical: 11 }}
          >
            <Glyph category="despertar" size={16} color="#B08A55" />
            <Text style={{ flex: 1, fontSize: 13.5, color: '#4A4459' }}>Ver el reporte de la noche</Text>
            <Ionicons name="chevron-forward" size={15} color="#B08A55" />
          </Pressable>

          {showDesfasadas ? (
            <NightCard radius={26} style={{ padding: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Eyebrow tone="lilac">Próxima ventana</Eyebrow>
                <View style={{ borderRadius: 99, backgroundColor: '#3A2E1C', paddingHorizontal: 9, paddingVertical: 4 }}>
                  <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase', color: '#F0A868' }}>
                    Desfasadas {dur(offsetMin)}
                  </Text>
                </View>
              </View>
              {babyStates.map(({ baby }, i) => (
                <View key={baby.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: ACCENT[baby.tone] }} />
                  <Text style={{ flex: 1, fontSize: 14.5, fontWeight: '600', color: '#FBF7F0' }}>{baby.name}</Text>
                  <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 19, color: '#FBF7F0' }}>{nextBlock?.times[i] ?? '—'}</Text>
                </View>
              ))}
              <Text style={{ fontSize: 12.5, lineHeight: 12.5 * 1.45, color: '#B9B2C9', borderTopWidth: 1, borderTopColor: '#33335F', paddingTop: 10, marginTop: 10 }}>
                {midpointWithinTolerance
                  ? 'Si las querés juntas, un punto medio a las ' + fmt(midpointMin) + ' entra dentro de lo que tolera el plan de cada una.'
                  : 'El punto medio quedaría fuera de la tolerancia del plan para al menos una — mejor cada una a su hora.'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <Pressable
                  onPress={() => {
                    const preset = midpointWithinTolerance
                      ? (() => { const d = new Date(); d.setHours(Math.floor(midpointMin / 60), Math.round(midpointMin % 60), 0, 0); return d; })()
                      : null;
                    onOpenLog && onOpenLog('Siesta', 0, 'nap', null, false, preset);
                  }}
                  style={{ flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: '#6B5DD3', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#FBF7F0' }}>
                    {midpointWithinTolerance ? 'Unir a las ' + fmt(midpointMin) : 'Registrar siesta'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setForceSeparate(true)}
                  style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#363458', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 13.5, color: '#B9B2C9' }}>Dejar cada una</Text>
                </Pressable>
              </View>
            </NightCard>
          ) : showSynced ? (
            <NightCard radius={26} style={{ padding: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <WindowRing
                  size={96}
                  percent={babyStates[0].windowStartI != null && babyStates[0].nextWindowTimeI > babyStates[0].windowStartI
                    ? (nowMin - babyStates[0].windowStartI) / (babyStates[0].nextWindowTimeI - babyStates[0].windowStartI) : 0}
                >
                  <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 22, color: '#FBF7F0' }}>{dur(Math.max(0, babyStates[0].nextWindowTimeI - nowMin))}</Text>
                  <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', color: '#8E87B5' }}>faltan</Text>
                </WindowRing>
                <View style={{ flex: 1, gap: 4 }}>
                  <Eyebrow tone="lilac">Próxima ventana</Eyebrow>
                  <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 27, color: '#FBF7F0' }}>{nextBlock?.times[0] ?? '—'}</Text>
                  <Text style={{ fontSize: 12.5, lineHeight: 12.5 * 1.4, color: '#B9B2C9' }}>
                    Las dos{offsetMin > 0 ? ', con ~' + offsetMin + ' min de diferencia' : ''}. {note}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                <Pressable
                  onPress={() => onOpenLog && onOpenLog(nextBlock?.label ?? 'Siesta', 0, nextBlock?.key?.startsWith('nap') ? 'nap' : 'night', null)}
                  style={{ flex: 1, minHeight: 46, borderRadius: 13, backgroundColor: '#FBF7F0', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#16162B' }}>Ya se durmieron</Text>
                </Pressable>
                <Pressable
                  onPress={() => onOpenPlan && onOpenPlan()}
                  style={{ minHeight: 46, paddingHorizontal: 16, borderRadius: 13, borderWidth: 1, borderColor: '#3A3560', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 13.5, color: '#B9B2C9' }}>Mover</Text>
                </Pressable>
              </View>
            </NightCard>
          ) : (
            <View style={{ gap: 12 }}>
              {babyStates.map(({ baby, openNapI, sleepingNowI, wakeLoggedI, nextWindowTimeI, windowStartI }, i) => {
                const hasCard = sleepingNowI || wakeLoggedI;
                if (!hasCard) return null;
                return (
                  <View key={baby.id} style={{ gap: 12 }}>
                    {babies.length > 1 ? <Eyebrow tone="lilac">{baby.name}</Eyebrow> : null}
                    {sleepingNowI ? (
                      <NightCard radius={26} style={{ padding: 18 }}>
                        <Eyebrow tone="lilac">Durmiendo la siesta</Eyebrow>
                        <Text style={{ fontSize: 17, lineHeight: 17 * 1.35, color: '#FBF7F0' }}>
                          Lleva <Text style={{ fontFamily: theme.fontFamily.mono, fontWeight: '700' }}>
                            {dur(Math.max(0, Math.round((now.getTime() - new Date(openNapI.fell_asleep_at || openNapI.started_at).getTime()) / 60000)))}
                          </Text> {agree(baby, 'dormido', 'dormida')}
                        </Text>
                        <Text style={{ fontSize: 13.5, lineHeight: 13.5 * 1.45, color: '#B9B2C9' }}>
                          Empezó a las {fmt(minutesOfDay(new Date(openNapI.started_at)))}. Tocá abajo cuando se despierte para ver la próxima ventana.
                        </Text>
                        <Pressable
                          onPress={() => onOpenLog && onOpenLog('Siesta', i, 'nap', openNapI, false)}
                          style={{ marginTop: 4, minHeight: 46, borderRadius: 13, backgroundColor: '#F0A868', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#16162B' }}>Ya se despertó</Text>
                        </Pressable>
                      </NightCard>
                    ) : (
                      <NightCard radius={26} style={{ padding: 18 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                          <WindowRing
                            size={96}
                            percent={windowStartI != null && nextWindowTimeI != null && nextWindowTimeI > windowStartI
                              ? (nowMin - windowStartI) / (nextWindowTimeI - windowStartI) : 0}
                          >
                            <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: nextWindowTimeI != null ? 22 : 14, color: '#FBF7F0' }}>
                              {nextWindowTimeI != null ? dur(Math.max(0, nextWindowTimeI - nowMin)) : '—'}
                            </Text>
                            <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', color: '#8E87B5' }}>faltan</Text>
                          </WindowRing>
                          <View style={{ flex: 1, gap: 4 }}>
                            <Eyebrow tone="lilac">Próxima ventana</Eyebrow>
                            <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 27, color: '#FBF7F0' }}>{nextBlock?.times[i] ?? '—'}</Text>
                            <Text style={{ fontSize: 12.5, lineHeight: 12.5 * 1.4, color: '#B9B2C9' }}>{note}</Text>
                          </View>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                          <Pressable
                            onPress={() => onOpenLog && onOpenLog(nextBlock?.label ?? 'Siesta', i, nextBlock?.key?.startsWith('nap') ? 'nap' : 'night', null)}
                            style={{ flex: 1, minHeight: 46, borderRadius: 13, backgroundColor: '#FBF7F0', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#16162B' }}>Ya se durmió</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => onOpenPlan && onOpenPlan()}
                            style={{ minHeight: 46, paddingHorizontal: 16, borderRadius: 13, borderWidth: 1, borderColor: '#3A3560', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Text style={{ fontSize: 13.5, color: '#B9B2C9' }}>Mover</Text>
                          </Pressable>
                        </View>
                      </NightCard>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Sugerencia del plan — ya no es una lista tocable (PROMPT-hoy-v3.md
          §1.2). Agregar/mover siestas del plan se hace desde el plan, no
          desde acá; esto es solo referencia. */}
      <View style={{ gap: 9, borderRadius: 20, backgroundColor: '#F2EDFF', borderWidth: 1, borderColor: '#DCD3F7', paddingHorizontal: 16, paddingVertical: 15 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Glyph category="ventana" size={14} color="#6B5DD3" />
          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase', color: '#6B5DD3' }}>Sugerencia del plan</Text>
        </View>
        {upcomingPlan.length === 0 ? (
          <Text style={{ fontSize: 13.5, color: '#6A6478' }}>Nada más sugerido para lo que queda del día.</Text>
        ) : (
          upcomingPlan.map((b) => (
            <View key={b.key} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
              <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 19, width: 58, color: '#16162B' }}>{b.times[0]}</Text>
              <Text style={{ fontSize: 15, color: '#4A4459' }}>{b.label + (babies.length > 1 ? ' de las dos' : '')}</Text>
            </View>
          ))
        )}
        <Text style={{ fontSize: 12.5, lineHeight: 12.5 * 1.4, color: '#8A79B8', borderTopWidth: 1, borderTopColor: '#E2D8F5', paddingTop: 9 }}>
          Calculado con sus últimos 14 días. Es una referencia: cuando pase de verdad, regístralo desde los botones de arriba.
        </Text>
      </View>

      {/* Registro de un toque: único lugar de la pantalla (además del botón
          del héroe) que abre una hoja de registro — abre las mismas hojas de
          siempre (SleepLogSheet/FeedLogSheet/DiaperLogSheet), con la bebé
          elegida acá ya preseleccionada. */}
      <View style={{ gap: 9 }}>
        {babies.length > 1 ? (
          <View style={{ flexDirection: 'row', gap: 6, backgroundColor: '#E3DCCF', borderRadius: 13, padding: 4 }}>
            {babies.map((b, i) => (
              <Pressable
                key={b.id}
                onPress={() => setGridBaby(i)}
                style={{
                  flex: 1, minHeight: 38, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                  backgroundColor: gridBaby === i ? 'white' : 'transparent',
                }}
              >
                <View style={{
                  width: 7, height: 7, borderRadius: 99,
                  backgroundColor: gridBaby === i ? ACCENT[b.tone] : 'transparent',
                  borderWidth: gridBaby === i ? 0 : 1, borderColor: ACCENT[b.tone],
                }} />
                <Text style={{ fontSize: 13.5, fontWeight: '600', color: '#16162B' }}>{b.name}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => {
              const h = new Date().getHours();
              const isNight = h >= 18 || h < 6;
              // Si esta bebé ya tiene una siesta/noche abierta, tocar el
              // tile de nuevo abre ESA para corregirla en vez de crear una
              // segunda — antes siempre abría un formulario en blanco, y
              // "corregir la hora" terminaba armando un duplicado sin
              // ningún aviso ni botón para borrar el que sobraba.
              const existingOpen = isNight ? openNights[gridBaby] : (napEvents[gridBaby] || []).find((e) => !e.ended_at);
              onOpenLog && onOpenLog('Siesta', gridBaby, isNight ? 'night' : 'nap', existingOpen ?? null);
            }}
            style={{ flex: 1, minHeight: 106, borderRadius: 18, backgroundColor: '#F2EDFF', borderWidth: 1, borderColor: '#DCD3F7', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <CategoryIcon category="sueno" size={44} />
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: '#16162B' }}>Sueño</Text>
          </Pressable>
          {/* Leche reemplaza los tiles sueltos de Toma/Extracción: adentro
              vive la pantalla real de Leche (cronómetro con lado de pecho,
              extracción, banco, registros recientes) — antes "Toma" abría un
              formulario genérico cuyo "Cronometrar" no distinguía de qué
              lado, justo lo que Leche sí resuelve. */}
          <Pressable
            onPress={() => navigate('leche')}
            style={{ flex: 1, minHeight: 106, borderRadius: 18, backgroundColor: '#EAF4F8', borderWidth: 1, borderColor: '#CFE4EC', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <CategoryIcon category="toma" size={44} />
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: '#16162B' }}>Leche</Text>
          </Pressable>
          <Pressable
            onPress={() => onLogDiaper && onLogDiaper(gridBaby)}
            style={{ flex: 1, minHeight: 106, borderRadius: 18, backgroundColor: '#EAF2ED', borderWidth: 1, borderColor: '#CDE0D6', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <CategoryIcon category="panal" size={44} />
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: '#16162B' }}>Pañal</Text>
          </Pressable>
        </View>
      </View>

      {/* Mismo cronómetro que ya existe en Leche (useFeedSession lee de
          AsyncStorage, así que ambas pantallas ven la misma sesión). Pecho
          se puede terminar y guardar directo acá (savePechoSession,
          compartido con Leche); extracción sigue mandando a Leche porque
          ahí vive el paso de cargar cuánto sacó (PumpAmountSheet). */}
      {feedSession ? (
        <View style={{ borderRadius: 18, backgroundColor: '#143240', paddingHorizontal: 15, paddingVertical: 13, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
              <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: '#7FBDD4' }} />
              <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 9.5, letterSpacing: 1.4, textTransform: 'uppercase', color: '#7FBDD4' }}>
                {feedSession.kind === 'extraccion' ? 'Extracción en curso' : 'Toma en curso'}
              </Text>
            </View>
            <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10, color: '#5A93A8' }}>
              empezó a las {fmt(minutesOfDay(new Date(feedSession.startedAt)))}
            </Text>
          </View>
          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 34, color: '#BFE0EC' }}>
            {Math.floor(totalElapsedMs / 60000)}:{String(Math.floor((totalElapsedMs / 1000) % 60)).padStart(2, '0')}
          </Text>
          {feedSession.kind === 'extraccion' ? (
            <Pressable onPress={() => navigate('leche')} style={{ minHeight: 44, borderRadius: 12, backgroundColor: '#8A6BC4', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#FBF7F0' }}>Terminar en Leche →</Text>
            </Pressable>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={handleStopFeedTimer} style={{ flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: '#4E8FA8', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#06202B' }}>Terminar y guardar</Text>
              </Pressable>
              <Pressable onPress={cancelFeedSession} style={{ paddingHorizontal: 14, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: '#24505F', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 13.5, color: '#7FBDD4' }}>Descartar</Text>
              </Pressable>
            </View>
          )}
          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10, color: '#3E6B7C' }}>Sigue corriendo con el teléfono bloqueado.</Text>
        </View>
      ) : null}

      {/* Lo que ya pasó hoy — lista real de todos los tipos de registro
          (PROMPT-hoy-v3.md §1.4). Una fila de sueño abierta es tocable y
          abre la misma hoja de cierre que el héroe, precargada con esa bebé
          (QA-2). "VER 7 DÍAS" reusa los mismos 10 días que ya trajo load(). */}
      <View style={{ gap: 9 }}>
        <SectionRule>Lo que ya pasó hoy</SectionRule>
        {todayFeedRows.length === 0 ? (
          <View style={{ borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: '#DCD4C8', paddingVertical: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 13.5, color: '#A9A2B5' }}>Nada registrado todavía.</Text>
          </View>
        ) : (
          <View style={{ borderRadius: 16, borderWidth: 1, borderColor: '#E4DCD0', backgroundColor: 'white', overflow: 'hidden' }}>
            {todayFeedRows.map((r, i) => {
              const Row = r.onPress ? Pressable : View;
              // Separador de día solo con VER 7 DÍAS activo — con "hoy" nomás
              // todas las filas son del mismo día, no hace falta repetirlo.
              const prevDay = i > 0 ? dayLabel(todayFeedRows[i - 1].ts) : null;
              const thisDay = showWeek ? dayLabel(r.ts) : null;
              const showDayHeader = showWeek && thisDay !== prevDay;
              return (
                <View key={r.id}>
                  {showDayHeader ? (
                    <View style={{ paddingHorizontal: 14, paddingTop: i === 0 ? 11 : 13, paddingBottom: 4, backgroundColor: '#FBF9F4', borderTopWidth: i === 0 ? 0 : 1, borderTopColor: '#F0EAE0' }}>
                      <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#A9A2B5' }}>{thisDay}</Text>
                    </View>
                  ) : null}
                  <Row
                    onPress={r.onPress}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderTopWidth: i === 0 || showDayHeader ? 0 : 1, borderTopColor: '#F0EAE0' }}
                  >
                    <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 12, color: '#8A8299', minWidth: 40 }}>{r.time}</Text>
                    <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: r.dot }} />
                    <Text style={{ flex: 1, fontSize: 13.5, color: '#16162B' }} numberOfLines={1}>{r.text}</Text>
                  </Row>
                </View>
              );
            })}
          </View>
        )}
        <Pressable onPress={() => setShowWeek((v) => !v)} style={{ alignSelf: 'center', paddingVertical: 6 }}>
          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 11, letterSpacing: 1.2, color: '#6B5DD3' }}>{showWeek ? 'VER SOLO HOY' : 'VER 7 DÍAS'}</Text>
        </Pressable>
      </View>

      {/* Pañales justo después de las siestas para que no se pierda de vista
          — solo 0-3 meses, cuando pipí/popó es de lo primero que pregunta el
          pediatra para saber si el bebé está bien alimentado e hidratado. */}
      {profile.id === 'nb' ? (
        <>
          <SectionRule>Pañales</SectionRule>
          <Pressable onPress={() => onLogDiaper && onLogDiaper()} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 16, borderWidth: 1, borderColor: '#E4DCD0', backgroundColor: 'white', paddingHorizontal: 14, paddingVertical: 12 }}>
            <CategoryIcon category="panal" size={34} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 14.5, fontWeight: '500', color: '#16162B' }}>
                {todayDiaperEvents.filter((e) => e.kind?.indexOf('Pipí') >= 0).length} pipí · {todayDiaperEvents.filter((e) => e.kind?.indexOf('Popó') >= 0).length} popó hoy
              </Text>
              <Text style={{ fontSize: 12.5, lineHeight: 12.5 * 1.35, color: '#8A8299' }}>
                {todayDiaperEvents.length === 0 ? 'Sin registros todavía' : 'Toca para registrar otro'}
              </Text>
            </View>
            <Text style={{ fontSize: 15, color: '#A9A2B5' }}>＋</Text>
          </Pressable>
        </>
      ) : null}

      {/* Medicinas: feature secundario, mismo peso visual que Alimentación y
          siempre debajo de ella. Esta es una app de sueño — nunca una tarjeta
          siempre abierta. Se muestra aunque no haya episodio activo, como
          entrada neutra para activar el modo enfermedad o ver lo indicado. */}
      <MedStrip episode={episode} prescriptions={prescriptions ?? []} doses={doses ?? []} babies={babies} now={now} onOpen={onOpenMeds} />

      <View style={{ gap: 9, borderRadius: 16, borderWidth: 1, borderColor: '#EFDCC4', backgroundColor: '#FFF9F0', paddingHorizontal: 14, paddingVertical: 12 }}>
        <Eyebrow tone="brown" tracking={0.9}>Notas de relevo</Eyebrow>
        {notes.length === 0 ? (
          <Text style={{ fontSize: 13.5, color: '#B08A55' }}>Sin notas todavía.</Text>
        ) : (
          notes.map((n) => (
            <View key={n.id} style={{ gap: 2 }}>
              <Text style={{ fontSize: 12, color: '#B08A55' }}>{n.profiles?.display_name || 'Alguien'} · {new Date(n.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</Text>
              <Text style={{ fontSize: 14.5, lineHeight: 14.5 * 1.45, color: '#4A4459' }}>{n.text}</Text>
            </View>
          ))
        )}
        <Pressable onPress={handleAddNote} style={{ borderTopWidth: 1, borderTopColor: '#EFDCC4', borderStyle: 'dashed', paddingTop: 9 }}>
          <Text style={{ fontSize: 14, color: '#B08A55' }}>＋ Dejar nota para el siguiente turno</Text>
        </Pressable>
      </View>

      {/* Tips vive acá al final, no en Equipo — es lo último que se consulta
          en el día, no algo relacionado con miembros/permisos. */}
      <Pressable
        onPress={() => navigate('guia')}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 14, backgroundColor: '#F3EFE6', paddingHorizontal: 14, paddingVertical: 11 }}
      >
        <Ionicons name="bulb-outline" size={16} color="#B08A55" />
        <Text style={{ flex: 1, fontSize: 13.5, color: '#4A4459' }}>Tips</Text>
        <Ionicons name="chevron-forward" size={15} color="#B08A55" />
      </Pressable>
    </ScreenBody>
  );
}
export default TodayScreen;
