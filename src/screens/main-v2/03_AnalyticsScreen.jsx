import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Line, Polygon, Polyline, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { theme } from '@nocttua/theme/native';
import { ScreenTitle, NightCard, Card, CardTitle, Eyebrow, SegTabs, MetricBar, Legend } from '../../components/v2/primitives';
import { ScreenBody } from '../../components/v2/MobileChrome';
import { ACCENT } from '../../data/profiles';
import { getMyFamilyId, getBabies, getFeedingMode } from '../../data/family';
import { getActiveEpisode, getRecentEpisodes } from '../../data/meds';
import { getDayRecords, buildDayRecords, withEmbeddedFeeds } from '../../data/dayRecords';
import {
  twinRows, twinGap, twinVerdict, correlations, heatRow, dayDetail, restRows, restFlag, howBar,
  wakeCurve, scatter, baseWakes, avgWindow, avgLatency, avgNapLen, avgNightFeeds, avgNightFeedMl, perBaby,
  daysWithDataWindow, DAYS_WITH_DATA_MIN,
} from '../../lib/derive';
import { dur, one, avg } from '../../lib/time';
import { profileForBirthDate } from '../../data/profiles';
import { DayDetailSheet } from './overlays/DayDetailSheet';

const WEEKDAY_LABEL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTH_LABEL = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function dayTitle(dayKey) {
  const d = new Date(dayKey + 'T00:00:00');
  return d.getDate() + ' ' + MONTH_LABEL[d.getMonth()];
}

/** Todos los días (YYYY-MM-DD) cubiertos por algún episodio de enfermedad. */
function illnessDayKeys(episodes) {
  const days = new Set();
  episodes.forEach((ep) => {
    const end = ep.ended_at ? new Date(ep.ended_at) : new Date();
    for (let d = new Date(ep.started_at); d <= end; d.setDate(d.getDate() + 1)) {
      days.add(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'));
    }
  });
  return days;
}

const RANGE_OPTIONS = [14, 30, 90];

/**
 * Datos — describe, no califica. La ventana es por DÍAS CON DATO, no por
 * calendario fijo (ver daysWithDataWindow en lib/derive.js): si la mamá
 * falló un par de días, no queda una pantalla casi vacía. "vs. período
 * anterior" compara contra los mismos N días con dato inmediatamente
 * anteriores — con poco historial esa comparación no se muestra en vez de
 * inventar un número.
 */
export function AnalyticsScreen({ refreshKey }) {
  const [babies, setBabies] = useState([]);
  const [profile, setProfile] = useState(null);
  const [allRecords, setAllRecords] = useState([]);
  const [rawSleepEvents, setRawSleepEvents] = useState([]);
  const [rawFeedEvents, setRawFeedEvents] = useState([]);
  const [feedingMode, setFeedingMode] = useState('breastfeeding');
  const [episode, setEpisode] = useState(null);
  const [sickDayKeys, setSickDayKeys] = useState(new Set());
  const [baby, setBaby] = useState(0);
  const [range, setRange] = useState(14);
  const [dayIdx, setDayIdx] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const familyId = await getMyFamilyId();
      // getBabies no depende del resultado de las otras tres — solo
      // necesita familyId — así que va en el mismo Promise.all. Se trae el
      // doble de días de calendario que el rango elegido: hace falta ese
      // margen para poder armar también la ventana "anterior" de comparación
      // cuando hay huecos de por medio.
      const [babiesData, { sleepEvents, feedEvents }, activeEpisode, recentEpisodes, feedingModeData] = await Promise.all([
        getBabies(familyId), getDayRecords(familyId, range * 2), getActiveEpisode(familyId), getRecentEpisodes(familyId, range * 2), getFeedingMode(familyId),
      ]);
      const babyIds = babiesData.map((b) => b.id);
      setBabies(babiesData);
      setProfile(profileForBirthDate(babiesData[0]?.birth_date));
      setEpisode(activeEpisode);
      setAllRecords(buildDayRecords(sleepEvents, feedEvents, babyIds));
      setRawSleepEvents(sleepEvents);
      setRawFeedEvents(feedEvents);
      setFeedingMode(feedingModeData);
      setSickDayKeys(illnessDayKeys(recentEpisodes));
    } finally {
      setLoading(false);
    }
  }, [range]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Ver la nota equivalente en CareScreen.jsx: refreshKey ya no remonta la
  // pantalla (MainTabs dejó de pasarlo como `key`), solo dispara un refetch.
  const isFirstRefresh = useRef(true);
  useEffect(() => {
    if (isFirstRefresh.current) { isFirstRefresh.current = false; return; }
    load();
  }, [refreshKey, load]);

  if (loading || !profile) return <ScreenBody><Text style={{ color: '#8A8299' }}>Cargando…</Text></ScreenBody>;

  // Con mellizas, sumar sus registros en un solo promedio escondía de quién
  // era cada dato (una podía tener 1 despertar y la otra 5, y el titular
  // mostraba "3" sin decir de ninguna). La ventana de días-con-dato y todo lo
  // que sigue usa solo los registros de la bebé seleccionada en las pestañas
  // de abajo — la tarjeta de comparación de arriba (rows2) es la única que
  // sigue mirando a ambas a la vez, a propósito.
  const scopedAll = perBaby(allRecords, baby);
  const windowInfo = daysWithDataWindow(scopedAll, { targetDays: range, minDays: DAYS_WITH_DATA_MIN });
  const dayKeys = windowInfo.dayKeys;
  const records = allRecords.filter((r) => dayKeys.includes(r.day));
  const weekRecords = records;

  const remainingScoped = scopedAll.filter((r) => !dayKeys.includes(r.day));
  const prevWindowInfo = daysWithDataWindow(remainingScoped, { targetDays: range, minDays: 1 });
  const scopedPrevRecords = remainingScoped.filter((r) => prevWindowInfo.dayKeys.includes(r.day));

  if (windowInfo.status === 'insufficient') {
    return (
      <ScreenBody gap={14}>
        <ScreenTitle eyebrow={windowInfo.n + ' de ' + DAYS_WITH_DATA_MIN + ' noches mínimo'} title="Analíticas" />
        {babies.length > 1 ? (
          <SegTabs items={babies.map((b, i) => ({ id: i, label: b.name }))} active={baby} onSelect={(id) => setBaby(id)} />
        ) : null}
        <Card>
          <Text style={{ fontSize: 14, lineHeight: 14 * 1.5, color: '#4A4459' }}>
            Faltan {windowInfo.needed} noche{windowInfo.needed === 1 ? '' : 's'} más para empezar a ver tendencias
            {babies.length > 1 ? ' de ' + babies[baby].name : ''}. Mientras tanto, esto es lo que ya se registró:
          </Text>
        </Card>
        {windowInfo.dayKeys.length > 0 ? (
          <Card style={{ gap: 9 }}>
            <CardTitle>Noches registradas</CardTitle>
            {windowInfo.dayKeys.map((key) => {
              const r = scopedAll.find((x) => x.day === key);
              return (
                <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#F0EAE0' }}>
                  <Text style={{ fontSize: 13.5, color: '#4A4459' }}>{dayTitle(key)}</Text>
                  <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 12.5, color: '#8A8299' }}>{r?.wakes ?? 0} despertar{r?.wakes === 1 ? '' : 'es'}</Text>
                </View>
              );
            })}
          </Card>
        ) : null}
      </ScreenBody>
    );
  }

  const scopedRecords = perBaby(records, baby);
  const base = baseWakes(scopedRecords);
  const gap = babies.length > 1 ? twinGap(records) : null;
  const rows2 = babies.length > 1 ? twinRows(records) : null;
  const verdict = babies.length > 1 ? twinVerdict(records, babies.map((b) => b.name)) : null;
  const curve = wakeCurve(records, baby, dayKeys);
  const sc = scatter(profile, records);
  const rest = restRows(profile, records, babies.length);
  const corr = correlations(scopedRecords).slice(0, 4);
  const hb = howBar(scopedRecords);
  const heatMapDayKeys = dayKeys.slice(-14);

  // Leche — simple a propósito (2 números, nada más): tomas por día
  // (promedio sobre días con alguna toma, no sobre el total del rango, para
  // no diluir el número con días sin registrar) y ml promedio por sesión de
  // extracción. Independiente de `records`/buildDayRecords (que solo genera
  // una fila por NOCHE YA CERRADA) para no perder tomas de días sin noche
  // completa todavía. La extracción es de la mamá, no de un bebé — no se
  // filtra por la pestaña de bebé elegida abajo.
  const feedSince = Date.now() - range * 86400000;
  const babyFeedsInRange = withEmbeddedFeeds(rawSleepEvents, rawFeedEvents)
    .filter((f) => (f.baby_id === babies[baby]?.id || f.baby_id === null) && new Date(f.started_at).getTime() >= feedSince);
  const feedDayKeys = new Set(babyFeedsInRange.map((f) => new Date(f.started_at).toDateString()));
  const avgFeedsPerDay = feedDayKeys.size ? babyFeedsInRange.length / feedDayKeys.size : null;
  const pumpEventsInRange = rawFeedEvents.filter((f) => f.type === 'pump' && new Date(f.started_at).getTime() >= feedSince);
  const avgPumpMl = pumpEventsInRange.length ? Math.round(pumpEventsInRange.reduce((a, e) => a + (e.volume_ml ?? 0), 0) / pumpEventsInRange.length) : null;

  const prevBase = scopedPrevRecords.length ? baseWakes(scopedPrevRecords) : null;
  const wakesDelta = prevBase != null && prevBase > 0 ? Math.round(((base - prevBase) / prevBase) * 100) : null;

  const detail = dayIdx !== null
    ? dayDetail(weekRecords, heatMapDayKeys[dayIdx], baby, WEEKDAY_LABEL[new Date(heatMapDayKeys[dayIdx]).getDay()], dayTitle(heatMapDayKeys[dayIdx]))
    : null;

  const rangeEyebrow = dayKeys.length > 1 ? dayKeys[0].slice(5) + ' – ' + dayKeys[dayKeys.length - 1].slice(5) : dayKeys[0]?.slice(5) ?? '';
  const windowLabel = windowInfo.status === 'full' ? windowInfo.n + ' días con dato' : windowInfo.n + ' día' + (windowInfo.n === 1 ? '' : 's') + ' con registro';
  // "esta semana" ya no describe la ventana real (puede ser 14/30/90 días
  // con dato) — se reemplaza por esto en toda la copia visible de abajo.
  const periodLabel = 'este período';

  return (
    <ScreenBody gap={14}>
      <ScreenTitle eyebrow={rangeEyebrow + ' · ' + windowLabel} title="Analíticas" />

      <View style={{ flexDirection: 'row', gap: 6, backgroundColor: '#E3DCCF', borderRadius: 13, padding: 4 }}>
        {RANGE_OPTIONS.map((r) => (
          <Pressable
            key={r}
            onPress={() => setRange(r)}
            style={{ flex: 1, minHeight: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: range === r ? 'white' : 'transparent' }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#16162B' }}>{r} d</Text>
          </Pressable>
        ))}
      </View>

      {/* Aviso, no bloqueo: los días de enfermedad SÍ entran en los
          promedios y correlaciones (ver el filtro más arriba) — ocultar
          analíticas enteras mientras alguien está enferma es peor que
          mostrarlas con contexto. */}
      {episode ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, borderWidth: 1, borderColor: '#EFCFC7', backgroundColor: '#FFF6F4', paddingHorizontal: 13, paddingVertical: 11 }}>
          <View style={{ height: 20, width: 20, borderRadius: 99, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7DED7' }}>
            <Text style={{ fontSize: 11, color: '#C25F45' }}>i</Text>
          </View>
          <Text style={{ flex: 1, fontSize: 12.5, lineHeight: 12.5 * 1.5, color: '#4A4459' }}>
            {(babies.length > 1 ? babies.map((b) => b.name).join(' y ') : babies[0]?.name)} {babies.length > 1 ? 'están' : 'está'} en modo enfermedad desde hace {episode.day} días. Ten en cuenta que el patrón de sueño puede estar cambiando por la enfermedad, no necesariamente por otra causa.
          </Text>
        </View>
      ) : null}

      {rows2 ? (
        <Card border="#C9C1D8" radius={18} style={{ gap: 13, shadowColor: '#16162B', shadowOpacity: 0.18, shadowRadius: 15 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ gap: 2 }}>
              <Eyebrow>{babies[0].name} vs. {babies[1].name}</Eyebrow>
              <Text style={{ fontSize: 16.5, fontWeight: '500', color: '#16162B' }}>Cómo se comparan en {periodLabel}</Text>
            </View>
            {gap ? (
              <View style={{ borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: gap.bg }}>
                <Text style={{ fontSize: 12, color: gap.fg }}>{gap.label}</Text>
              </View>
            ) : null}
          </View>
          {rows2.map((t) => (
            <View key={t.label} style={{ gap: 5 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                <Text style={{ width: 56, fontFamily: theme.fontFamily.mono, fontSize: 13.5, color: '#6B5DD3' }}>{t.a}</Text>
                <Text style={{ flex: 1, textAlign: 'center', fontSize: 12.5, color: '#8A8299' }}>{t.label}</Text>
                <Text style={{ width: 56, textAlign: 'right', fontFamily: theme.fontFamily.mono, fontSize: 13.5, color: '#C2703F' }}>{t.b}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', height: 8, borderRadius: 99, backgroundColor: '#F3EEE6', overflow: 'hidden' }}>
                  <View style={{ width: `${t.aPct}%`, height: '100%', backgroundColor: t.aColor }} />
                </View>
                <View style={{ flex: 1, height: 8, borderRadius: 99, backgroundColor: '#F3EEE6', overflow: 'hidden' }}>
                  <View style={{ width: `${t.bPct}%`, height: '100%', backgroundColor: t.bColor }} />
                </View>
              </View>
            </View>
          ))}
          {verdict ? <Text style={{ borderRadius: 12, backgroundColor: '#FBF7F0', paddingHorizontal: 12, paddingVertical: 11, fontSize: 13, lineHeight: 13 * 1.5, color: '#4A4459' }}>{verdict}</Text> : null}
        </Card>
      ) : null}

      {/* A partir de acá todo (esta tarjeta, la siguiente, el mapa, la
          curva de despertares y "qué está pesando") lee solo los datos de
          la bebé elegida acá — antes esas tarjetas mezclaban a ambas sin
          decirlo. */}
      {babies.length > 1 ? (
        <SegTabs items={babies.map((b, i) => ({ id: i, label: b.name }))} active={baby} onSelect={(id) => { setBaby(id); setDayIdx(null); }} />
      ) : null}

      {scopedRecords.length === 0 ? (
        // Con mellizas desfasadas en cuánto registran, la otra bebé podía
        // tener datos de sobra y esta ninguno en el período — mostrar "0
        // despertares"/"0 min de ventana" ahí se lee como medido, no como
        // ausente. avg([]) de por sí da 0, así que hay que cortarlo antes.
        <View style={{ borderRadius: 18, padding: 17, backgroundColor: '#3F7A62', gap: 6 }}>
          <Eyebrow tone="#CDEBDC">{babies.length > 1 ? babies[baby].name + ' · ' + periodLabel : windowLabel}</Eyebrow>
          <Text style={{ fontSize: 14, lineHeight: 14 * 1.5, color: '#D6EFE2' }}>
            Todavía no hay registros de sueño de {babies.length > 1 ? babies[baby].name : 'este período'} para mostrar un patrón.
          </Text>
        </View>
      ) : (
        <>
          <View style={{ borderRadius: 18, padding: 17, backgroundColor: '#3F7A62', gap: 11 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
              <View style={{ height: 24, width: 24, borderRadius: 99, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.22)' }}>
                <Text style={{ fontSize: 13, color: 'white' }}>✓</Text>
              </View>
              <Eyebrow tone="#CDEBDC">{babies.length > 1 ? babies[baby].name + ' · ' + periodLabel : windowLabel}</Eyebrow>
            </View>
            <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 25, lineHeight: 25 * 1.2, color: 'white' }}>
              {wakesDelta != null ? (wakesDelta <= 0 ? 'Bajaron ' + Math.abs(wakesDelta) + '% los despertares por noche.' : 'Van ' + one(base) + ' despertares por noche.') : 'Llevan ' + one(base) + ' despertares por noche en promedio.'}
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 14 * 1.5, color: '#D6EFE2' }}>
              {hb.length ? 'La forma más común de dormirse en ' + periodLabel + ' fue "' + hb.slice().sort((a, b) => b.count - a.count)[0].label.toLowerCase() + '". Sigue anotando para ver qué mueve la aguja.' : 'Sigue anotando para que esta sección empiece a describir lo que está pasando.'}
            </Text>
          </View>

          <NightCard style={{ padding: 16 }}>
            <Eyebrow tone="amber">{babies.length > 1 ? babies[baby].name + ' · en qué seguir trabajando' : 'En qué seguir trabajando'}</Eyebrow>
            <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 23, lineHeight: 23 * 1.25, color: '#FBF7F0' }}>
              La ventana de la mañana promedia {dur(Math.round(avgWindow(scopedRecords)))} y el objetivo es {profile.windowTarget}.
            </Text>
            <View style={{ marginTop: 3, flexDirection: 'row', flexWrap: 'wrap', gap: 18, borderTopWidth: 1, borderTopColor: '#33335F', paddingTop: 11 }}>
              <View><Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 22, color: '#FBF7F0' }}>{dur(Math.round(avgWindow(scopedRecords)))}</Text><Text style={{ fontSize: 12, color: '#8E87B5' }}>ventana AM real</Text></View>
              <View><Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 22, color: '#F0A868' }}>{profile.windowTarget}</Text><Text style={{ fontSize: 12, color: '#8E87B5' }}>objetivo edad</Text></View>
              <View><Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 22, color: '#FBF7F0' }}>{one(base)}</Text><Text style={{ fontSize: 12, color: '#8E87B5' }}>despertares/noche</Text></View>
            </View>
          </NightCard>
        </>
      )}

      <Card>
        <CardTitle right="toca un día">Mapa de los últimos {heatMapDayKeys.length} días</CardTitle>
        <View style={{ flexDirection: 'row', paddingLeft: 31, justifyContent: 'space-between' }}>
          {['6a', '10a', '2p', '6p', '10p', '2a', '6a'].map((t, i) => <Text key={i} style={{ fontFamily: theme.fontFamily.mono, fontSize: 9.5, color: '#A9A2B5' }}>{t}</Text>)}
        </View>
        {heatMapDayKeys.map((key, di) => {
          // Día del mes en vez de letra de día de semana: con hasta 14 filas,
          // "L, M, M..." se repite y deja de servir para distinguir filas.
          const h = heatRow(weekRecords, key, baby, String(new Date(key + 'T00:00:00').getDate()));
          const sel = dayIdx === di;
          return (
            <Pressable key={key} onPress={() => setDayIdx(h ? di : null)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 7, paddingVertical: 2, backgroundColor: sel ? '#F6F1FB' : 'transparent' }}>
              <Text style={{ width: 26, fontFamily: theme.fontFamily.mono, fontSize: 11.5, color: sel ? '#6B5DD3' : '#8A8299' }}>{h ? h.day : '—'}</Text>
              {h ? (
                <View style={{ flex: 1, height: 26, borderRadius: 5, flexDirection: 'row', overflow: 'hidden' }}>
                  {h.segments.map((s, i) => <View key={i} style={{ width: s.width, height: '100%', backgroundColor: s.bg }} />)}
                </View>
              ) : (
                <View style={{ flex: 1, height: 26, borderRadius: 5, backgroundColor: '#F6EFE2' }} />
              )}
            </Pressable>
          );
        })}
        <View style={{ borderTopWidth: 1, borderTopColor: '#F0EAE0', paddingTop: 10 }}>
          <Legend items={[{ label: 'noche', color: '#2C2C52' }, { label: 'siesta', color: '#6B5DD3' }, { label: 'despierta', color: '#F6EFE2' }]} />
        </View>
      </Card>

      <Card style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#16162B' }}>Despertares por noche</Text>
          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10.5, color: '#A9A2B5' }}>n = {curve.n} noches</Text>
        </View>
        <Svg viewBox="0 0 340 128" style={{ width: '100%', height: 110 }}>
          <Defs>
            <LinearGradient id="wkFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#6B5DD3" stopOpacity={0.28} />
              <Stop offset="100%" stopColor="#6B5DD3" stopOpacity={0.02} />
            </LinearGradient>
          </Defs>
          {[102, 66, 30].map((y) => <Line key={y} x1="0" y1={y} x2="340" y2={y} stroke="#EDE6DA" strokeWidth={1} />)}
          <Polygon points={curve.area} fill="url(#wkFill)" />
          <Polyline points={curve.line} fill="none" stroke="#6B5DD3" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          {/* Con muchos puntos (rango 30/90) los círculos y etiquetas de cada
              día se pisan entre sí — se afinan y se dejan de rotular uno por
              uno pasado cierto largo, la línea ya cuenta la historia. */}
          {curve.points.map((pt) => <Circle key={pt.x} cx={pt.x} cy={pt.y} r={curve.n > 20 ? 2 : 4.5} fill={pt.wakes <= 3 ? '#3F7A62' : '#6B5DD3'} stroke="#FFFFFF" strokeWidth={curve.n > 20 ? 1 : 2} />)}
          {curve.n <= 20 ? curve.points.map((pt) => <SvgText key={'t' + pt.x} x={pt.x} y="122" textAnchor="middle" fontSize="10" fill="#A9A2B5">{pt.day}</SvgText>) : null}
        </Svg>
        <Text style={{ fontSize: 12, lineHeight: 12 * 1.45, color: '#8A8299' }}>Los puntos verdes son noches de 3 o menos despertares. Los días sin registro no aparecen en la línea.</Text>
      </Card>

      <Card style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#16162B' }}>Ventana de la mañana → despertares</Text>
          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10.5, color: '#A9A2B5' }}>n = {sc.dots.length} noches</Text>
        </View>
        <Text style={{ fontSize: 12.5, lineHeight: 12.5 * 1.45, color: '#8A8299' }}>Cada punto es una noche. Cuanto más a la derecha, más larga fue la ventana.</Text>
        <Svg viewBox="0 0 340 150" style={{ width: '100%', height: 130 }}>
          <Line x1="34" y1="8" x2="34" y2="118" stroke="#EDE6DA" strokeWidth={1} />
          <Line x1="34" y1="118" x2="336" y2="118" stroke="#EDE6DA" strokeWidth={1} />
          <Line x1={sc.targetX} y1="4" x2={sc.targetX} y2="118" stroke="#7FB09A" strokeWidth={1.5} />
          <SvgText x={sc.targetX} y="12" textAnchor="middle" fontSize="9.5" fill="#3F7A62">objetivo</SvgText>
          {sc.yAxis.map((a) => <SvgText key={a.label} x="26" y={a.y} textAnchor="end" fontSize="9.5" fill="#A9A2B5">{a.label}</SvgText>)}
          {sc.xAxis.map((a) => <SvgText key={a.label} x={a.x} y="132" textAnchor="middle" fontSize="9.5" fill="#A9A2B5">{a.label}</SvgText>)}
          {sc.dots.map((d, i) => <Circle key={i} cx={d.x} cy={d.y} r={6} fill={babies[d.baby] ? ACCENT[babies[d.baby].tone] : '#6B5DD3'} fillOpacity={0.85} stroke="#FFFFFF" strokeWidth={1.5} />)}
        </Svg>
        {babies.length > 1 ? <Legend items={babies.map((b) => ({ label: b.name, color: ACCENT[b.tone], dot: true }))} size={12} /> : null}
      </Card>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11 }}>
        {[
          // Antes decía "objetivo" + profile.windowTarget acá — ese número es
          // el objetivo de VENTANA de la mañana (otro cuadro más abajo ya lo
          // muestra bien), no un objetivo de latencia para dormirse. No hay
          // un objetivo real de latencia definido en el producto, así que no
          // se inventa uno.
          // recs.length ? ... : '—' en las cuatro de abajo: sin este guard,
          // avg([]) da 0 y una melliza sin ningún registro esa semana
          // mostraba "0 min"/"0 ml" indistinguible de un valor real medido.
          { label: 'Tardó en dormirse', perBaby: true, value: (recs) => recs.length ? Math.round(avgLatency(recs)) + ' min' : '—' },
          { label: 'Siestas por día', value: () => profile.napsLabel, sub: 'esperado a su edad' },
          { label: 'Duración media de siesta', perBaby: true, value: (recs) => recs.length ? dur(Math.round(avgNapLen(recs))) : '—', sub: 'rango ' + profile.napLen },
          { label: 'Tomas nocturnas', perBaby: true, value: (recs) => recs.length ? one(avgNightFeeds(recs)) : '—', sub: 'esperado ' + profile.nightFeeds },
          // Separado de "tomas nocturnas" a propósito: la cantidad de
          // despertares no dice si además se está tomando biberones enteros
          // de madrugada — esa combinación es la que distingue "se despierta
          // y listo" de "se despierta y come de más", que es justo lo que
          // hace que el despertar se sostenga en vez de resolverse solo.
          { label: 'Leche de madrugada', perBaby: true, value: (recs) => recs.length ? Math.round(avgNightFeedMl(recs)) + ' ml' : '—', sub: 'promedio por noche' },
        ].map((m) => (
          <View key={m.label} style={{ flexBasis: '47%', flexGrow: 1, gap: 5, borderRadius: 16, borderWidth: 1, borderColor: '#E4DCD0', backgroundColor: 'white', padding: 13 }}>
            <Text style={{ fontSize: 12.5, lineHeight: 12.5 * 1.3, color: '#8A8299' }}>{m.label}</Text>
            {/* Para mellizas, un solo número mezclado no dice de quién es —
                separado por bebé, como ya hace "Patrón de descanso real". */}
            {m.perBaby && babies.length > 1 ? (
              <View style={{ flexDirection: 'row', gap: 16 }}>
                {babies.map((baby, i) => (
                  <View key={baby.id}>
                    <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 18, color: ACCENT[baby.tone] }}>{m.value(perBaby(records, i))}</Text>
                    <Text style={{ fontSize: 10.5, color: '#A9A2B5' }}>{baby.name}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 23, color: '#16162B' }}>{m.value(records)}</Text>
            )}
            {m.sub ? <Text style={{ fontSize: 12, color: '#7FB09A' }}>{m.sub}</Text> : null}
          </View>
        ))}
      </View>

      {avgFeedsPerDay != null || avgPumpMl != null ? (
        <Card style={{ gap: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#16162B' }}>Leche</Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 23, color: '#16162B' }}>{avgFeedsPerDay != null ? one(avgFeedsPerDay) : '—'}</Text>
              <Text style={{ fontSize: 12, lineHeight: 12 * 1.3, color: '#8A8299' }}>tomas por día{babies.length > 1 ? ' · ' + babies[baby].name : ''}</Text>
            </View>
            {feedingMode !== 'bottle_only' ? (
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 23, color: '#16162B' }}>{avgPumpMl != null ? avgPumpMl + ' ml' : '—'}</Text>
                <Text style={{ fontSize: 12, lineHeight: 12 * 1.3, color: '#8A8299' }}>por extracción</Text>
              </View>
            ) : null}
          </View>
        </Card>
      ) : null}

      <Card style={{ gap: 14 }}>
        <View style={{ gap: 3 }}>
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#16162B' }}>Patrón de descanso real</Text>
          <Text style={{ fontSize: 12.5, lineHeight: 12.5 * 1.45, color: '#8A8299' }}>Lo que duermen de verdad, sobre el rango esperado a los {profile.short}.</Text>
        </View>
        {rest.map((r) => (
          <View key={r.baby} style={{ gap: 7 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14.5, fontWeight: '500', color: babies[r.baby] ? ACCENT[babies[r.baby].tone] : '#6B5DD3' }}>{babies[r.baby]?.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7 }}>
                <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 16, color: '#16162B' }}>{r.value}</Text>
                <View style={{ borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: r.inRange ? '#DCEDE4' : '#FFF3E3' }}>
                  <Text style={{ fontSize: 11.5, color: r.inRange ? '#3F7A62' : '#B07A3C' }}>{r.tag}</Text>
                </View>
              </View>
            </View>
            <View style={{ height: 8, borderRadius: 99, backgroundColor: '#F3EEE6' }}>
              <View style={{ position: 'absolute', left: r.bandLeft, right: r.bandRight, height: 8, borderRadius: 99, backgroundColor: '#DCEDE4' }} />
              <View style={{ position: 'absolute', left: r.dotLeft, marginLeft: -9, top: -5, height: 18, width: 18, borderRadius: 99, borderWidth: 3, borderColor: 'white', backgroundColor: r.color }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10, color: '#A9A2B5' }}>{r.axisLow}</Text>
              <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10, color: '#3F7A62' }}>rango esperado {r.band}</Text>
              <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10, color: '#A9A2B5' }}>{r.axisHigh}</Text>
            </View>
          </View>
        ))}
        <Text style={{ fontSize: 12.5, lineHeight: 12.5 * 1.5, color: '#4A4459' }}>
          A los {profile.short} se esperan entre {profile.totalLow} y {profile.totalHigh} horas de sueño en 24 h.
        </Text>
        {restFlag(profile, records) ? (
          <View style={{ flexDirection: 'row', gap: 9, borderRadius: 12, borderWidth: 1, borderColor: '#EFDCC4', backgroundColor: '#FFF9F0', paddingHorizontal: 12, paddingVertical: 11 }}>
            <View style={{ height: 20, width: 20, borderRadius: 99, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5E3C8' }}>
              <Text style={{ fontSize: 11, color: '#B08A55' }}>i</Text>
            </View>
            <Text style={{ flex: 1, fontSize: 12.5, lineHeight: 12.5 * 1.5, color: '#6E6878' }}>
              Llevan varios días seguidos por debajo del rango esperado. No es una urgencia; si se mantiene otra semana vale la pena mencionárselo al pediatra.
            </Text>
          </View>
        ) : null}
        {hb.length > 0 ? (
          <View style={{ gap: 7, borderTopWidth: 1, borderTopColor: '#F0EAE0', paddingTop: 12 }}>
            <Text style={{ fontSize: 12.5, color: '#8A8299' }}>Cómo se durmieron en {periodLabel}</Text>
            <View style={{ height: 22, borderRadius: 7, flexDirection: 'row', overflow: 'hidden' }}>
              {hb.map((h) => (
                <View key={h.label} style={{ width: h.width, alignItems: 'center', justifyContent: 'center', backgroundColor: h.color }}>
                  <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 11, color: 'white' }}>{h.count}</Text>
                </View>
              ))}
            </View>
            <Legend items={hb.map((h) => ({ label: h.label, color: h.color }))} />
          </View>
        ) : null}
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '500', color: '#16162B' }}>{babies.length > 1 ? 'Qué está pesando en la noche de ' + babies[baby].name : 'Qué está pesando en la noche'}</Text>
        {corr.length > 0 ? (
          <>
            {corr.map((c) => <MetricBar key={c.label} label={c.label} value={c.value} pct={c.pct} color={c.color} caption={c.n + ' · media de ' + (babies.length > 1 ? babies[baby].name : 'el período') + ': ' + one(base)} />)}
            <Text style={{ fontSize: 11.5, lineHeight: 11.5 * 1.45, color: '#A9A2B5' }}>Asociación, no causa. Se muestra un factor solo con 8+ noches registradas.</Text>
          </>
        ) : (
          // Antes esta card directamente desaparecía sin data — eso se lee
          // como "no funciona", no como "todavía no hay patrón". Un factor
          // necesita 8+ noches iguales para no ser ruido (n >= 8, ver
          // correlations() en derive.js), así que explicar el umbral es
          // mejor que ocultarlo sin avisar.
          <Text style={{ fontSize: 13, lineHeight: 13 * 1.5, color: '#8A8299' }}>
            Todavía ningún factor (lugar, contacto, tomas nocturnas, teething…) se repitió en 8 o más noches en este período — con menos que eso, mostrarlo sería ruido, no un patrón real. Sigue registrando el lugar y el contacto en cada noche para que esta sección empiece a decir algo.
          </Text>
        )}
      </Card>

      <DayDetailSheet open={dayIdx !== null} detail={detail} onClose={() => setDayIdx(null)} />
    </ScreenBody>
  );
}
export default AnalyticsScreen;
