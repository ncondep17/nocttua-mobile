import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg';
import { theme } from '@nocttua/theme/native';
import { ScreenTitle, NightCard, Card, CardTitle, Eyebrow, SegTabs, Legend, CategoryIcon } from '../../components/v2/primitives';
import { ScreenBody } from '../../components/v2/MobileChrome';
import { ACCENT } from '../../data/profiles';
import { getMyFamilyId, getBabies, getRecentEvents, getFeedingMode, insertEvent, getBankBalance, setMilkBankStartingMl, logBankLoss } from '../../data/family';
import { dur, avg } from '../../lib/time';
import { feedSideBalance, feedDurationByDay, feedTimeScatter } from '../../lib/derive';
import { useNowTick } from '../../lib/useNowTick';
import { useFeedSession } from '../../lib/useFeedSession';
import { savePechoSession } from '../../lib/feedSessionSave';
import { PumpAmountSheet } from './overlays/PumpAmountSheet';
import { genderLabel } from '../../lib/grammar';

// Sin toLowerCase() esto no reconocía 'Ambos pechos' (pechos en minúscula)
// como toma al pecho — sus minutos no se sumaban a ningún lado.
const isBottle = (kind) => (kind || '').toLowerCase().indexOf('biberón') >= 0;
const isBreast = (kind) => (kind || '').toLowerCase().indexOf('pecho') >= 0;

function timeLabel(iso) {
  const d = new Date(iso);
  return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
}
function minutesAgo(iso) {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}
/** mm:ss, pasa a h:mm:ss después de 60 min. */
function fmtStopwatch(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

const PECHO_SIDES = ['Izquierdo', 'Derecho', 'Los dos'];
const EXTRACCION_SIDES = ['Izquierda', 'Derecha', 'Las dos'];

/** Una de las 3 pills del selector de lado. */
function SidePill({ label, selected, onPress, tone }) {
  const border = tone === 'violet' ? '#6B5DD3' : '#C4562F';
  const bg = tone === 'violet' ? '#F2EFFC' : '#FDF3EA';
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 13, borderWidth: 1.5,
        paddingVertical: 11, borderColor: selected ? border : '#E4DCD0', backgroundColor: selected ? bg : 'white',
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: selected ? '600' : '400', color: selected ? '#16162B' : '#6A6478' }}>{label}</Text>
    </Pressable>
  );
}

/** Círculo de play de 88px, con el triángulo ópticamente centrado. */
function PlayCircle({ onPress, tone, ariaLabel }) {
  const bg = tone === 'violet' ? '#6B5DD3' : '#C4562F';
  const shadowColor = tone === 'violet' ? 'rgba(107,93,211,.30)' : 'rgba(196,86,47,.30)';
  const triangleColor = tone === 'violet' ? '#F6F3FF' : '#FFF6EF';
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={ariaLabel}
      style={{
        width: 88, height: 88, borderRadius: 44, backgroundColor: bg, alignItems: 'center', justifyContent: 'center',
        shadowColor, shadowOpacity: 1, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 6,
      }}
    >
      <View style={{ borderTopWidth: 13, borderBottomWidth: 13, borderLeftWidth: 20, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: triangleColor, marginLeft: 7 }} />
    </Pressable>
  );
}

/**
 * Leche — tomas, extracción y banco. Simplificación real declarada: no hay
 * un "stock" acumulado de reserva (necesitaría saber cuánto había antes de
 * usar la app), así que se muestra el balance de la semana en curso
 * (extraído − consumido), no un número de inventario inventado.
 */
const STORAGE_GUIDE = [
  {
    title: 'Recién extraída',
    rows: [
      ['Ambiente (hasta 25°C)', 'Hasta 4 horas'],
      ['Heladera (4°C)', 'Hasta 4 días'],
      ['Freezer (-18°C)', 'Ideal dentro de 6 meses, aceptable hasta 12'],
    ],
  },
  {
    title: 'Descongelada (ya estuvo congelada)',
    rows: [
      ['Ambiente (hasta 25°C)', '1–2 horas'],
      ['Heladera (4°C)', 'Hasta 24 horas'],
      ['Freezer', 'Nunca volver a congelar'],
    ],
  },
  {
    title: 'Sobrante de una toma (mamadera empezada)',
    rows: [['Usar dentro de', '2 horas desde que terminó de tomar']],
  },
];

/** Fuente: CDC / Academy of Breastfeeding Medicine, Clinical Protocol #8. Referencia general, no reemplaza indicación médica puntual. */
function StorageGuideCard() {
  const [open, setOpen] = useState(false);
  return (
    <Card border="#C9C1D8" style={{ gap: 11 }}>
      <Pressable onPress={() => setOpen((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ gap: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#16162B' }}>Cuánto dura la leche</Text>
          <Text style={{ fontSize: 12.5, color: '#8A8299' }}>Guía de referencia · CDC / ABM</Text>
        </View>
        <View style={{ borderRadius: 99, backgroundColor: '#F6F1FB', paddingHorizontal: 11, paddingVertical: 6 }}>
          <Text style={{ fontSize: 13, color: '#6B5DD3', fontWeight: '500' }}>{open ? 'Ocultar' : 'Ver guía'}</Text>
        </View>
      </Pressable>
      {open ? (
        <View style={{ gap: 14 }}>
          {STORAGE_GUIDE.map((section) => (
            <View key={section.title} style={{ gap: 6 }}>
              <Eyebrow size={10.5}>{section.title}</Eyebrow>
              {section.rows.map(([label, value]) => (
                <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, borderBottomWidth: 1, borderBottomColor: '#F0EAE0', paddingBottom: 6 }}>
                  <Text style={{ flex: 1, fontSize: 13, color: '#4A4459' }}>{label}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: '#16162B', textAlign: 'right' }}>{value}</Text>
                </View>
              ))}
            </View>
          ))}
          <Text style={{ fontSize: 11.5, lineHeight: 11.5 * 1.4, color: '#A9A2B5' }}>
            Referencia general para bebés sanos nacidos a término. Ante dudas puntuales, sigue la indicación de tu pediatra.
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

export function MilkScreen({ onNewFeed, onNewPump, onOpenEvent, refreshKey }) {
  useNowTick();
  const feedSession = useFeedSession();
  const [babies, setBabies] = useState([]);
  const [scope, setScope] = useState('ambas');
  const [today, setToday] = useState([]);
  const [week, setWeek] = useState([]);
  const [pumpAmountHistory, setPumpAmountHistory] = useState([]);
  const [bank, setBank] = useState({ totalToBanco: 0, totalFromBanco: 0, balance: 0 });
  const [feedingMode, setFeedingMode] = useState('breastfeeding');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [activeTab, setActiveTab] = useState('pecho');
  const [side, setSide] = useState(null); // null = usar el default de la pestaña activa
  const [pendingPump, setPendingPump] = useState(null); // resultado de stop() de una extracción, esperando ml
  const bottleOnly = feedingMode === 'bottle_only';

  const refresh = useCallback(async () => {
    const familyId = await getMyFamilyId();
    // Ninguna de estas seis depende de las otras — solo necesitan
    // familyId — así que van todas juntas en vez de en serie.
    // 'sleep' entra también: la toma de leche antes de dormir se guarda
    // sobre el propio evento de sueño (kind/volume_ml/feed_minutes), no
    // como un evento de toma aparte — sin esto, esa toma quedaba
    // registrada pero invisible en Leche.
    // 48h en vez de 24 a propósito: una ventana de 24h corridas mezcla
    // lo de anoche con lo de hoy sin ninguna marca — con 48h alcanza
    // para agrupar por día de calendario y mostrar "Hoy"/"Ayer" bien
    // separados en vez de una sola lista ambigua.
    // La semana también necesita 'sleep' — igual que "hoy" — para que las
    // tomas antes de dormir entren en los patrones semanales, no solo en
    // la lista de hoy.
    const [babiesData, feedingModeData, todayEvents, weekEvents, pumpHistory, bankBalance] = await Promise.all([
      getBabies(familyId),
      getFeedingMode(familyId),
      getRecentEvents(familyId, { hours: 48, types: ['feed', 'pump', 'sleep'] }),
      getRecentEvents(familyId, { hours: 24 * 7, types: ['feed', 'pump', 'sleep'] }),
      getRecentEvents(familyId, { hours: 24 * 14, types: ['pump'] }),
      getBankBalance(familyId),
    ]);
    setBabies(babiesData);
    setFeedingMode(feedingModeData);
    setToday(todayEvents);
    setWeek(weekEvents);
    setPumpAmountHistory(pumpHistory);
    setBank(bankBalance);
    return familyId;
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          await refresh();
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }, [refresh])
  );

  // Ver la nota equivalente en CareScreen.jsx: refreshKey ya no remonta la
  // pantalla (MainTabs dejó de pasarlo como `key`), solo dispara un refetch.
  const isFirstRefresh = useRef(true);
  useEffect(() => {
    if (isFirstRefresh.current) { isFirstRefresh.current = false; return; }
    refresh();
  }, [refreshKey, refresh]);

  // Bebé al que apunta el modo una mano: el elegido en el selector de arriba,
  // o el único que hay si no hay selector — una toma es siempre de un bebé
  // a la vez, "Las dos" no tiene sentido acá aunque sí lo tenga para filtrar
  // la lista de registros.
  const targetBaby = (scope === 'ambas' ? babies[0] : babies.find((bb) => bb.tone === scope)) ?? babies[0] ?? null;

  // Lado con el que se dio la última toma al pecho (ver más abajo, se
  // recalcula igual para el cuadro de arriba) — el default de la pestaña de
  // pecho es el lado contrario.
  const lastBreastFeedForDefault = today
    .filter((e) => (e.type === 'feed' || (e.type === 'sleep' && e.kind)) && isBreast(e.kind))
    .slice()
    .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0] ?? null;
  const defaultPechoSide = lastBreastFeedForDefault?.kind === 'Pecho der.' ? 'Izquierdo' : lastBreastFeedForDefault?.kind === 'Pecho izq.' ? 'Derecho' : 'Izquierdo';
  const sides = activeTab === 'pecho' ? PECHO_SIDES : EXTRACCION_SIDES;
  const effectiveSide = side ?? (activeTab === 'pecho' ? defaultPechoSide : 'Las dos');

  const selectTab = (tab) => { setActiveTab(tab); setSide(null); };

  const handlePlay = () => {
    if (activeTab === 'pecho') {
      if (!targetBaby) return;
      // "Los dos" arranca un solo tramo sin lado (no hay botón de cambiar
      // de lado con sentido si nunca se declaró un lado inicial) — el resto
      // de los casos arranca en el lado elegido y puede cambiar después.
      feedSession.start('pecho', targetBaby.id, effectiveSide === 'Los dos' ? null : effectiveSide);
    } else {
      feedSession.start('extraccion', null, effectiveSide);
    }
  };

  const otherPechoSide = feedSession.currentSide === 'Derecho' ? 'Izquierdo' : 'Derecho';

  const handleStop = async () => {
    const result = feedSession.stop();
    if (!result) return;
    if (result.kind === 'extraccion') {
      setPendingPump(result);
      return;
    }
    // Play seguido de Terminar casi al instante no deja ningún tramo con
    // duración real (stop() ya filtra ms<=0) — sin este corte, el mensaje
    // de éxito de abajo iba a decir "guardado" sin haber insertado nada.
    try {
      const familyId = await getMyFamilyId();
      const saved = await savePechoSession(familyId, result);
      if (saved.tooShort) {
        setMsg('Muy corto para guardar — prueba de nuevo.');
        setTimeout(() => setMsg(null), 4000);
        return;
      }
      await refresh();
      if (saved.partial) {
        Alert.alert(
          'Se guardó solo una parte',
          'De ' + saved.totalSegments + ' tramos, ' + saved.failedCount + ' no se pudo' + (saved.failedCount === 1 ? '' : 'ieron') + ' guardar (' + (saved.failReason?.message ?? String(saved.failReason)) + '). Revisa el registro y completalo a mano si hace falta.'
        );
      } else if (saved.allFailed) {
        Alert.alert('No se pudo guardar', saved.failReason?.message ?? String(saved.failReason));
      } else {
        setMsg(saved.sideLabel + ' · ' + saved.totalMin + ' min guardado.');
        setTimeout(() => setMsg(null), 4000);
      }
    } catch (err) {
      Alert.alert('No se pudo guardar', err?.message ?? String(err));
    }
  };

  const pendingPumpSides = pendingPump
    ? (pendingPump.segments[0]?.side === 'Izquierda' ? ['izq'] : pendingPump.segments[0]?.side === 'Derecha' ? ['der'] : ['izq', 'der'])
    : [];

  const closePendingPump = () => setPendingPump(null);

  const savePump = async (amounts, alsoOpenDetails) => {
    if (!pendingPump) return;
    try {
      const familyId = await getMyFamilyId();
      const startedAtIso = new Date(pendingPump.startedAt).toISOString();
      const endedAtIso = new Date(pendingPump.endedAt).toISOString();
      const rows = [];
      if (amounts.izq > 0) rows.push({ side: 'Izquierdo', volumeMl: amounts.izq });
      if (amounts.der > 0) rows.push({ side: 'Derecho', volumeMl: amounts.der });
      // Los dos lados en 0: igual se guarda un registro (con el lado
      // original) para no perder el tiempo cronometrado.
      if (rows.length === 0) rows.push({ side: pendingPumpSides.length === 1 ? (pendingPumpSides[0] === 'izq' ? 'Izquierdo' : 'Derecho') : 'Ambos', volumeMl: 0 });
      let lastRow = null;
      for (const r of rows) {
        lastRow = await insertEvent(familyId, {
          babyId: null, type: 'pump', startedAt: startedAtIso, endedAt: endedAtIso,
          side: r.side, volumeMl: r.volumeMl, pumpDest: 'Al banco', toReserve: true,
        });
      }
      setMsg('Extracción guardada · ' + (amounts.izq + amounts.der) + ' ml al banco.');
      setPendingPump(null);
      await refresh();
      if (alsoOpenDetails && lastRow) onOpenEvent && onOpenEvent(lastRow);
    } catch (err) {
      setMsg('No se pudo guardar: ' + (err.message ?? String(err)));
    }
    setTimeout(() => setMsg(null), 4000);
  };

  const handleEditStartingBank = () => {
    Alert.prompt(
      'Saldo inicial del banco',
      'Cuánta leche ya tenías guardada antes de usar Nocttua (en ml). Se puede corregir cuando haga falta.',
      async (text) => {
        const ml = parseInt((text || '').replace(/[^0-9]/g, ''), 10);
        if (Number.isNaN(ml)) return;
        try {
          await setMilkBankStartingMl(await getMyFamilyId(), ml);
          await refresh();
          setMsg('Saldo inicial actualizado a ' + ml + ' ml.');
        } catch (err) {
          setMsg('No se pudo guardar: ' + (err.message ?? String(err)));
        }
        setTimeout(() => setMsg(null), 4000);
      },
      'plain-text',
      String(bank.startingMl || '')
    );
  };

  const handleLogLoss = () => {
    Alert.prompt(
      '¿Cuánto se perdió?',
      'Un biberón que se derramó, leche vencida — se resta del banco sin contar como toma. En ml.',
      async (text) => {
        const ml = parseInt((text || '').replace(/[^0-9]/g, ''), 10);
        if (!ml || ml <= 0) return;
        try {
          await logBankLoss(await getMyFamilyId(), ml, 'Pérdida registrada desde Leche');
          await refresh();
          setMsg('Se restaron ' + ml + ' ml del banco.');
        } catch (err) {
          setMsg('No se pudo guardar: ' + (err.message ?? String(err)));
        }
        setTimeout(() => setMsg(null), 4000);
      },
      'plain-text'
    );
  };

  if (loading) {
    return <ScreenBody><Text style={{ color: '#8A8299' }}>Cargando…</Text></ScreenBody>;
  }

  // Los 3 ml más usados en las últimas 2 semanas (redondeados a 10), para
  // los chips de acceso rápido del sheet de extracción — con menos de 3
  // valores distintos en el historial, se completa con 60/90/120.
  const amountFreq = {};
  pumpAmountHistory.filter((e) => (e.volume_ml ?? 0) > 0).forEach((e) => {
    const rounded = Math.round(e.volume_ml / 10) * 10;
    amountFreq[rounded] = (amountFreq[rounded] ?? 0) + 1;
  });
  const topAmounts = Object.entries(amountFreq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([v]) => parseInt(v, 10));
  const suggestedChips = [0, 1, 2].map((i) => topAmounts[i] ?? [60, 90, 120][i]);

  // "Hoy hasta ahora" es del día de calendario de hoy, no de las últimas 24h
  // corridas — si no, a las 7am una toma de las 11pm de ayer contaba como
  // "hoy" y una de esta mañana temprano también, sin que el resumen
  // distinguiera nada.
  const todayStr = new Date().toDateString();
  const isToday = (e) => new Date(e.started_at).toDateString() === todayStr;
  // Mismo filtro de scope que usa la lista de "Registros recientes" más
  // abajo — sin esto, tocar la pestaña de una bebé cambiaba la lista pero
  // los totales de arriba seguían sumando a las dos.
  const inScope = (e) => scope === 'ambas' || e.baby_id === null || e.babies?.tone === scope;
  const feeds = today.filter((e) => isToday(e) && inScope(e) && (e.type === 'feed' || (e.type === 'sleep' && e.kind)));
  const pumps = today.filter((e) => isToday(e) && inScope(e) && e.type === 'pump');
  const last = feeds.slice().sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0];
  const nightCount = feeds.filter((e) => e.feed_context === 'Despertar nocturno').length;

  // Lado con el que se dio la última toma al pecho, sin cortar en la
  // medianoche (busca en las 48h ya traídas, no solo "hoy") — lo que a la
  // mamá le importa en el momento es a qué lado le toca ahora, no si esa
  // última toma calzó en el día de calendario de hoy o de ayer.
  const lastBreastFeed = today
    .filter((e) => inScope(e) && (e.type === 'feed' || (e.type === 'sleep' && e.kind)) && isBreast(e.kind))
    .slice()
    .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0] ?? null;
  const nextSide = lastBreastFeed?.kind === 'Pecho izq.' ? 'Pecho der.' : lastBreastFeed?.kind === 'Pecho der.' ? 'Pecho izq.' : null;

  const totals = bottleOnly
    ? [
        { value: String(feeds.length), label: 'tomas' },
        { value: feeds.reduce((a, e) => a + (e.volume_ml ?? 0), 0) + ' ml', label: 'en biberón' },
      ]
    : [
        { value: String(feeds.length), label: 'tomas' },
        { value: feeds.filter((e) => isBreast(e.kind)).reduce((a, e) => a + (e.feed_minutes ?? 0), 0) + ' min', label: 'al pecho' },
        { value: feeds.filter((e) => isBottle(e.kind)).reduce((a, e) => a + (e.volume_ml ?? 0), 0) + ' ml', label: 'en biberón' },
        { value: pumps.reduce((a, e) => a + (e.volume_ml ?? 0), 0) + ' ml', label: 'extraídos' },
      ];

  const dayNote = nightCount > 0
    ? nightCount + (nightCount === 1 ? ' toma fue' : ' tomas fueron') + ' de la noche. Revisa si le tocaban para que la analítica de tomas nocturnas signifique algo.'
    : 'Todo lo de hoy pasó de día. Eso es exactamente lo que buscamos.';

  const visible = today
    .filter((e) => e.type === 'feed' || e.type === 'pump' || (e.type === 'sleep' && e.kind))
    .filter((e) => scope === 'ambas' || e.baby_id === null || e.babies?.tone === scope)
    .slice()
    .sort((a, b) => new Date(b.started_at) - new Date(a.started_at));

  // Agrupado por día de calendario — sin esto, una toma de anoche a las
  // 23:00 y una de hoy a las 23:00 se veían idénticas en la lista, sin
  // ninguna marca de a cuál día pertenecía cada una.
  const dayLabel = (dateStr) => {
    if (dateStr === todayStr) return 'Hoy';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === yesterday.toDateString()) return 'Ayer';
    return new Date(dateStr).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' });
  };
  const visibleGroups = [];
  visible.forEach((e) => {
    const key = new Date(e.started_at).toDateString();
    let group = visibleGroups.find((g) => g.key === key);
    if (!group) {
      group = { key, label: dayLabel(key), items: [] };
      visibleGroups.push(group);
    }
    group.items.push(e);
  });

  const pumpsWeek = week.filter((e) => e.type === 'pump');
  const byDay = {};
  pumpsWeek.forEach((e) => {
    const key = new Date(e.started_at).toDateString();
    byDay[key] = byDay[key] || { out: 0 };
    byDay[key].out += e.volume_ml ?? 0;
  });
  const dayBars = Object.entries(byDay).slice(-7).map(([key, v]) => ({ day: new Date(key).getDate(), out: v.out }));
  const maxOut = Math.max(1, ...dayBars.map((d) => d.out));

  // Patrones de la semana: mismo merge de tomas embebidas en sueño que usa
  // "hoy", para que una toma antes de dormir cuente igual que una suelta.
  const feedsWeek = week.filter((e) => e.type === 'feed' || (e.type === 'sleep' && e.kind));
  const breastFeedsWeek = feedsWeek.filter((e) => isBreast(e.kind));
  const sideBalance = feedSideBalance(breastFeedsWeek);
  const durationByDay = feedDurationByDay(breastFeedsWeek);
  const maxDuration = Math.max(1, ...durationByDay.map((d) => d.avgMin));
  const timeScatter = feedTimeScatter(feedsWeek);

  return (
    <ScreenBody gap={13}>
      <ScreenTitle eyebrow={new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })} title="Alimentación" />

      <NightCard style={{ gap: 11 }}>
        {!bottleOnly && lastBreastFeed ? (
          <View style={{ gap: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Eyebrow tone="amber">Última toma</Eyebrow>
              <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 12.5, color: '#8E87B5' }}>hace {dur(minutesAgo(lastBreastFeed.started_at))}</Text>
            </View>
            <Text style={{ fontSize: 19, lineHeight: 19 * 1.3, color: '#FBF7F0' }}>{lastBreastFeed.kind}</Text>
            {nextSide ? (
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#F0A868' }}>Ahora le toca {nextSide.toLowerCase()}</Text>
            ) : null}
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Eyebrow tone="amber">Hoy hasta ahora</Eyebrow>
            <Text style={{ fontSize: 12.5, color: '#8E87B5' }}>{last ? 'última toma hace ' + dur(minutesAgo(last.started_at)) : 'sin tomas registradas hoy'}</Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          {totals.map((t) => (
            <View key={t.label}>
              <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 15, color: '#B9B2C9' }}>{t.value}</Text>
              <Text style={{ fontSize: 10.5, color: '#8E87B5' }}>{t.label}</Text>
            </View>
          ))}
        </View>
        <Text style={{ borderTopWidth: 1, borderTopColor: '#33335F', paddingTop: 10, fontSize: 13, lineHeight: 13 * 1.45, color: '#B9B2C9' }}>{dayNote}</Text>
      </NightCard>

      {msg ? (
        <View style={{ borderRadius: 12, backgroundColor: '#EEF6F2', borderWidth: 1, borderColor: '#7FB09A', paddingHorizontal: 13, paddingVertical: 10 }}>
          <Text style={{ fontSize: 13, color: '#3F7A62' }}>{msg}</Text>
        </View>
      ) : null}

      {bottleOnly ? (
        <Pressable onPress={() => onNewFeed && onNewFeed()} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#16162B' }}>
          <Text style={{ fontSize: 15.5, fontWeight: '500', color: '#FBF7F0' }}>＋ Cargar toma</Text>
        </Pressable>
      ) : feedSession.session ? (
        <View style={{ borderRadius: 22, backgroundColor: '#16162B', paddingHorizontal: 18, paddingVertical: 16, alignItems: 'center', gap: 12 }}>
          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase', color: feedSession.session.kind === 'pecho' ? '#F0A868' : '#A99CF5' }}>
            {feedSession.session.kind === 'pecho'
              ? ('Pecho' + (feedSession.currentSide ? ' ' + feedSession.currentSide.toLowerCase() : '')) + (targetBaby ? ' · ' + targetBaby.name : '')
              : (feedSession.currentSide === 'Las dos' ? 'Extracción doble' : 'Extracción · ' + (feedSession.currentSide || '').toLowerCase())}
          </Text>
          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 46, lineHeight: 46, color: '#FBF7F0' }}>{fmtStopwatch(Math.floor(feedSession.totalElapsedMs / 1000))}</Text>
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <Pressable onPress={feedSession.togglePause} style={{ flex: 1, minHeight: 46, borderRadius: 13, borderWidth: 1.5, borderColor: '#4A4468', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 14.5, fontWeight: '600', color: '#FBF7F0' }}>{feedSession.isPaused ? 'Reanudar' : 'Pausar'}</Text>
            </Pressable>
            <Pressable
              onPress={handleStop}
              style={{ flex: 1, minHeight: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: feedSession.session.kind === 'pecho' ? '#F0A868' : '#A99CF5' }}
            >
              <Text style={{ fontSize: 14.5, fontWeight: '600', color: '#16162B' }}>Terminar</Text>
            </Pressable>
          </View>
          {feedSession.session.kind === 'pecho' ? (
            <Pressable
              onPress={() => feedSession.switchSide(otherPechoSide)}
              style={{ width: '100%', minHeight: 46, borderRadius: 13, backgroundColor: '#262445', borderWidth: 1.5, borderColor: '#4A4468', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }}
            >
              <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 15, color: '#F0A868' }}>⇄</Text>
              <Text style={{ fontSize: 14.5, fontWeight: '600', color: '#FBF7F0' }}>Cambiar a {otherPechoSide.toLowerCase()}</Text>
              <Text style={{ fontSize: 12.5, color: '#8E87B5' }}>sin cortar</Text>
            </Pressable>
          ) : (
            <Text style={{ fontSize: 12.5, color: '#8E87B5' }}>Al terminar cargas cuánto salió de cada lado.</Text>
          )}
        </View>
      ) : (
        <View style={{ borderRadius: 22, backgroundColor: 'white', borderWidth: 1, borderColor: '#E4DCD0', padding: 15, gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 4, backgroundColor: '#EFE9DF', borderRadius: 12, padding: 4 }}>
            {[{ id: 'pecho', label: 'Al pecho' }, { id: 'extraccion', label: 'Extracción' }].map((t) => {
              const on = activeTab === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => selectTab(t.id)}
                  style={[
                    { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
                    on ? { backgroundColor: 'white', shadowColor: '#16162B', shadowOpacity: 0.09, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 } : null,
                  ]}
                >
                  <Text style={{ fontSize: 14.5, fontWeight: on ? '600' : '400', color: on ? '#16162B' : '#8A8299' }}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {sides.map((s) => (
              <SidePill key={s} label={s} selected={effectiveSide === s} onPress={() => setSide(s)} tone={activeTab === 'pecho' ? 'coral' : 'violet'} />
            ))}
          </View>

          <View style={{ alignItems: 'center', gap: 8 }}>
            <PlayCircle
              onPress={handlePlay}
              tone={activeTab === 'pecho' ? 'coral' : 'violet'}
              ariaLabel={activeTab === 'pecho' ? 'Empezar toma pecho ' + effectiveSide.toLowerCase() : 'Empezar extracción ' + effectiveSide.toLowerCase()}
            />
            <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 12, letterSpacing: 1.1, textTransform: 'uppercase', color: activeTab === 'pecho' ? '#C4562F' : '#6B5DD3' }}>
              {activeTab === 'pecho'
                ? 'Empezar ' + (effectiveSide === 'Los dos' ? '' : effectiveSide.toLowerCase())
                : 'Empezar extracción ' + (effectiveSide === 'Las dos' ? 'doble' : effectiveSide.toLowerCase())}
            </Text>
            <Text style={{ fontSize: 12.5, color: '#A9A2B5', textAlign: 'center' }}>
              {activeTab === 'pecho' ? 'Toca y corre el cronómetro. Puedes cambiar de lado después.' : 'Los ml los cargas al terminar.'}
            </Text>
          </View>
        </View>
      )}

      {bottleOnly ? null : (
        <Pressable
          onPress={() => (activeTab === 'pecho' ? onNewFeed && onNewFeed() : onNewPump && onNewPump())}
          style={{ alignSelf: 'center', borderRadius: 99, borderWidth: 1, borderColor: '#DCD4C8', backgroundColor: 'white', paddingHorizontal: 14, paddingVertical: 8 }}
        >
          <Text style={{ fontSize: 13, color: '#4A4459' }}>
            {activeTab === 'pecho' ? 'Cargar una toma que ya pasó' : 'Cargar una extracción que ya pasó'}
          </Text>
        </Pressable>
      )}

      {babies.length > 1 ? (
        <SegTabs items={[{ id: 'ambas', label: 'Las dos' }, { id: 'a', label: babies.find((b) => b.tone === 'a')?.name ?? 'A' }, { id: 'b', label: babies.find((b) => b.tone === 'b')?.name ?? 'B' }]} active={scope} onSelect={setScope} />
      ) : null}

      <Card>
        <CardTitle right={visible.length + ' registros'}>Registros recientes</CardTitle>
        {visible.length === 0 ? (
          <Text style={{ fontSize: 13.5, color: '#8A8299' }}>Sin registros todavía.</Text>
        ) : (
          visibleGroups.map((group) => (
            <View key={group.key} style={{ gap: 2 }}>
              <Text style={{ fontSize: 11.5, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, color: '#A9A2B5', paddingTop: 8, paddingBottom: 2 }}>{group.label}</Text>
              {group.items.map((e) => {
                const pump = e.type === 'pump';
                const baby = babies.find((b) => b.id === e.baby_id);
                return (
                  <Pressable key={e.id} onPress={() => onOpenEvent && onOpenEvent(e)} style={{ flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1, borderBottomColor: '#F0EAE0', paddingVertical: 9 }}>
                    <Text style={{ minWidth: 38, fontFamily: theme.fontFamily.mono, fontSize: 13, color: e.feed_context === 'Despertar nocturno' ? '#B07A3C' : '#8A8299' }}>{timeLabel(e.started_at)}</Text>
                    <CategoryIcon category={pump ? 'extraccion' : 'toma'} size={28} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 7 }}>
                        <Text style={{ fontSize: 14.5, fontWeight: '500', color: '#16162B' }}>{pump ? 'Extracción · ' + (e.side || '').toLowerCase() : (baby?.name ?? 'Las dos') + ' · ' + (e.kind || '').toLowerCase()}</Text>
                        {e.feed_context === 'Despertar nocturno' ? (
                          <View style={{ borderRadius: 99, backgroundColor: '#FFF3E3', paddingHorizontal: 8, paddingVertical: 2 }}>
                            <Text style={{ fontSize: 10.5, color: '#B07A3C' }}>de noche</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={{ fontSize: 12.5, color: '#8A8299' }}>{pump ? (e.pump_dest || '').toLowerCase() : genderLabel(e.feed_context || '', baby).toLowerCase()}</Text>
                    </View>
                    <Text style={{ color: pump ? '#6B5DD3' : '#16162B', fontFamily: theme.fontFamily.mono, fontSize: 14 }}>
                      {pump ? (e.volume_ml ?? 0) + ' ml' : isBreast(e.kind) ? (e.feed_minutes ?? 0) + ' min' : (e.volume_ml ?? 0) + ' ml'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))
        )}
      </Card>

      {!bottleOnly && breastFeedsWeek.length > 0 ? (
        <Card style={{ gap: 16 }}>
          <View style={{ gap: 2 }}>
            <Text style={{ fontSize: 16, fontWeight: '500', color: '#16162B' }}>Patrones de la semana</Text>
            <Text style={{ fontSize: 12.5, color: '#8A8299' }}>Solo tomas al pecho — {breastFeedsWeek.length} en los últimos 7 días.</Text>
          </View>

          <View style={{ gap: 8 }}>
            <Eyebrow size={10.5}>Lado más usado</Eyebrow>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', height: 10, borderRadius: 99, backgroundColor: '#F3EEE6', overflow: 'hidden' }}>
                <View style={{ width: `${sideBalance.leftPct}%`, height: '100%', backgroundColor: '#6B5DD3' }} />
              </View>
              <View style={{ flex: 1, height: 10, borderRadius: 99, backgroundColor: '#F3EEE6', overflow: 'hidden' }}>
                <View style={{ width: `${sideBalance.rightPct}%`, height: '100%', backgroundColor: '#C2703F' }} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: '#6B5DD3' }}>Izquierdo · {sideBalance.left} ({sideBalance.leftPct}%)</Text>
              <Text style={{ fontSize: 12, color: '#C2703F' }}>Derecho · {sideBalance.right} ({sideBalance.rightPct}%)</Text>
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Eyebrow size={10.5}>Duración promedio por día</Eyebrow>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 70 }}>
              {durationByDay.map((d, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 8, height: Math.max(3, Math.round((d.avgMin / maxDuration) * 52)), backgroundColor: '#C2703F', borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
                  <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 9.5, color: '#A9A2B5' }}>{d.day}</Text>
                </View>
              ))}
            </View>
            <Text style={{ fontSize: 11.5, color: '#8A8299' }}>Promedio {Math.round(avg(durationByDay.filter((d) => d.avgMin > 0).map((d) => d.avgMin)) || 0)} min por toma esta semana.</Text>
          </View>

          <View style={{ gap: 8 }}>
            <Eyebrow size={10.5}>Horarios de las tomas</Eyebrow>
            <Svg viewBox="0 0 340 122" style={{ width: '100%', height: 108 }}>
              {timeScatter.yAxis.map((a) => (
                <Line key={a.label} x1="30" y1={a.y} x2="340" y2={a.y} stroke="#EDE6DA" strokeWidth={1} />
              ))}
              {timeScatter.yAxis.map((a) => (
                <SvgText key={'y' + a.label} x="0" y={a.y + 3} fontSize="9" fill="#A9A2B5">{a.label}</SvgText>
              ))}
              {timeScatter.xAxis.map((a) => (
                <SvgText key={'x' + a.label} x={a.x} y="121" textAnchor="middle" fontSize="9" fill="#A9A2B5">{a.label}</SvgText>
              ))}
              {timeScatter.dots.map((d, i) => (
                <Circle key={i} cx={d.x} cy={d.y} r={4} fill={d.side === 'Pecho izq.' ? '#6B5DD3' : d.side === 'Pecho der.' ? '#C2703F' : '#8A8299'} fillOpacity={0.85} stroke="#FFFFFF" strokeWidth={1.2} />
              ))}
            </Svg>
            <Legend items={[{ label: 'izquierdo', color: '#6B5DD3', dot: true }, { label: 'derecho', color: '#C2703F', dot: true }]} size={11} />
          </View>
        </Card>
      ) : null}

      {bottleOnly ? null : (
        <Card border="#C9C1D8" style={{ gap: 13 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ gap: 2 }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#16162B' }}>Extracción y banco de leche</Text>
              <Text style={{ fontSize: 12.5, color: '#8A8299' }}>Disponible en el banco ahora</Text>
            </View>
            <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 20, color: '#6B5DD3' }}>{bank.balance} ml</Text>
          </View>

          <View style={{ gap: 7 }}>
            <Eyebrow size={10.5}>Extraído por día, últimos 7 días</Eyebrow>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 76 }}>
              {dayBars.map((d) => (
                <View key={d.day} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 8, height: Math.max(4, Math.round((d.out / maxOut) * 58)), backgroundColor: '#6B5DD3', borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
                  <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 9.5, color: '#A9A2B5' }}>{d.day}</Text>
                </View>
              ))}
            </View>
            <Legend items={[{ label: 'extraído', color: '#6B5DD3' }]} />
          </View>

          {/* Balance real acumulado, no solo de la semana: todo lo marcado
              "Al banco" menos todo lo dado como "Biberón de leche materna" —
              antes esto se calculaba sobre 7 días y sin restar el consumo
              real, así que en los hechos mostraba "cuánto extrajiste esta
              semana", no cuánto tenés disponible. */}
          <Text style={{ borderRadius: 11, backgroundColor: '#FBF7F0', paddingHorizontal: 12, paddingVertical: 11, fontSize: 12.5, lineHeight: 12.5 * 1.5, color: '#4A4459' }}>
            {bank.balance > 0
              ? 'Llevas ' + bank.totalToBanco + ' ml marcados al banco y ' + bank.totalFromBanco + ' ml dados como biberón de tu leche' + (bank.totalLost > 0 ? ' (' + bank.totalLost + ' ml perdidos)' : '') + (bank.startingMl > 0 ? ' · saldo inicial ' + bank.startingMl + ' ml' : '') + ' — quedan ' + bank.balance + ' ml disponibles.'
              : bank.totalToBanco > 0 || bank.totalFromBanco > 0 || bank.startingMl > 0
                ? 'Diste ' + bank.totalFromBanco + ' ml como biberón de tu leche contra ' + (bank.startingMl + bank.totalToBanco) + ' ml disponibles — no hay reserva extra por ahora.'
                : 'Todavía no marcaste ninguna extracción con destino "Al banco".'}
          </Text>

          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Pressable onPress={handleEditStartingBank} style={{ borderRadius: 99, backgroundColor: '#F6F1FB', paddingHorizontal: 13, paddingVertical: 8 }}>
              <Text style={{ fontSize: 12.5, color: '#6B5DD3', fontWeight: '500' }}>
                {bank.startingMl > 0 ? 'Ajustar saldo inicial' : '¿Ya tenías banco antes de usar Nocttua?'}
              </Text>
            </Pressable>
            <Pressable onPress={handleLogLoss} style={{ borderRadius: 99, borderWidth: 1, borderColor: '#DCD4C8', backgroundColor: 'white', paddingHorizontal: 13, paddingVertical: 8 }}>
              <Text style={{ fontSize: 12.5, color: '#4A4459' }}>Registrar una pérdida de leche</Text>
            </Pressable>
          </View>
        </Card>
      )}

      {bottleOnly ? null : <StorageGuideCard />}

      <PumpAmountSheet
        open={!!pendingPump}
        session={pendingPump}
        sides={pendingPumpSides}
        suggestedChips={suggestedChips}
        onClose={closePendingPump}
        onSave={(amounts) => savePump(amounts, false)}
        onDetails={(amounts) => savePump(amounts, true)}
      />
    </ScreenBody>
  );
}
export default MilkScreen;
