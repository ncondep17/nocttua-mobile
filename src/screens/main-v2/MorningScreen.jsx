import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@nocttua/theme/native';
import { SectionRule, Glyph } from '../../components/v2/primitives';
import { getMyFamilyId, getBabies, getLatestSleepPlan } from '../../data/family';
import { getDayRecords, buildDayRecords, getLastClosedNightEvent } from '../../data/dayRecords';
import { perBaby, nightScoreWithDelta, oneThingToday, planBlocks } from '../../lib/derive';
import { profileForBirthDate, ACCENT } from '../../data/profiles';
import { profileWithPlan } from '../../lib/assessment';
import { dur, fmt, one } from '../../lib/time';
import { agree } from '../../lib/grammar';

/** Marca cada despertar de `night.wakings` en su posición real dentro de `[started_at, ended_at]` — reemplaza la barra plana de antes ahora que el schema guarda hora exacta por despertar. */
function NightLane({ night, color }) {
  const start = new Date(night.started_at).getTime();
  const end = new Date(night.ended_at).getTime();
  const span = end - start;
  const wakings = night.wakings ?? [];
  return (
    <View style={{ flex: 1, height: 22, borderRadius: 99, backgroundColor: color + '33', overflow: 'hidden' }}>
      {span > 0 ? wakings.map((w, i) => {
        const pct = Math.min(1, Math.max(0, (new Date(w.at).getTime() - start) / span));
        return <View key={i} style={{ position: 'absolute', top: 3, left: pct * 100 + '%', width: 3, height: 16, borderRadius: 2, backgroundColor: '#16162B', opacity: 0.55 }} />;
      }) : null}
    </View>
  );
}

/**
 * Mañana — README del handoff, pantalla 3. El puntaje de la noche y "una
 * sola cosa" usan el histórico real del bebé (son cálculos autocontenidos).
 * El horario predicho usa planBlocks() con el mismo motor que Hoy: tabla de
 * edad hasta 3 sueños medidos, mediana real de ahí en más.
 *
 * El carril de la noche marca cada despertar en su hora real (NightLane usa
 * `events.wakings`, ver migración de auditoría). Las noches guardadas ANTES
 * de esa migración no tienen wakings poblado — sus carriles se ven sin
 * marcas aunque wake_count sea > 0, porque no hay con qué posicionarlas.
 */
export function MorningScreen({ onClose, onOpenSleepPlan }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [babies, setBabies] = useState([]);
  const [profile, setProfile] = useState(null);
  const [rows, setRows] = useState([]); // { baby, night, scoreInfo, own }
  const [oneThing, setOneThing] = useState(null);
  const [pb, setPb] = useState([]);

  useEffect(() => {
    (async () => {
      const familyId = await getMyFamilyId();
      const [babiesData, { sleepEvents, feedEvents }, plan] = await Promise.all([
        getBabies(familyId), getDayRecords(familyId, 21), getLatestSleepPlan(familyId),
      ]);
      setBabies(babiesData);
      const prof = profileForBirthDate(babiesData[0]?.birth_date);
      setProfile(prof);
      const babyIds = babiesData.map((b) => b.id);
      const allRecords = buildDayRecords(sleepEvents, feedEvents, babyIds);
      const lastNights = getLastClosedNightEvent(sleepEvents, babyIds);

      const built = babiesData.map((baby, i) => {
        const own = perBaby(allRecords, i);
        const night = lastNights[i];
        const scoreInfo = night ? nightScoreWithDelta(own, night.id, prof) : null;
        return { baby, night, scoreInfo, own };
      });
      setRows(built);
      setOneThing(built[0]?.own?.length ? oneThingToday(built[0].own, prof) : null);

      // Horario predicho: mismo motor que Hoy — tabla de edad hasta que un
      // bebé junta 3 sueños medidos, mediana real de ahí en más (ver
      // predictedWindowMin en lib/assessment.js). allRecords ya trae el
      // historial real por bebé, así que se pasa tal cual.
      const wakeMins = lastNights.map((n) => (n?.ended_at ? new Date(n.ended_at).getHours() * 60 + new Date(n.ended_at).getMinutes() : null));
      setPb(planBlocks(profileWithPlan(prof, plan), wakeMins, babyIds.map(() => []), babyIds.map(() => null), allRecords));
      setLoading(false);
    })();
  }, []);

  if (loading || !profile) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FBF7F0', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#8A8299' }}>Cargando…</Text>
      </View>
    );
  }

  const dateLabel = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase();
  // La pantalla se abre sola al cerrar la noche (ver FamilyShell), y eso no
  // siempre pasa a las 6am — "Buenos días" fijo quedaba raro cerrando una
  // noche de prueba a las 2pm.
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <View style={{ flex: 1, backgroundColor: '#FBF7F0' }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 16 + insets.top, paddingBottom: 30 + insets.bottom, gap: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ gap: 2 }}>
            <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase', color: '#8A8299' }}>
              {dateLabel} · LA NOCHE DE ANOCHE
            </Text>
            <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 31, color: '#16162B' }}>{greeting}</Text>
          </View>
          <Pressable onPress={onClose}><Text style={{ fontSize: 15, color: '#6B5DD3' }}>Cerrar</Text></Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          {rows.map(({ baby, scoreInfo }) => (
            <View key={baby.id} style={{ flex: 1, borderRadius: 18, backgroundColor: '#F3EFE6', padding: 15, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: ACCENT[baby.tone] }} />
                <Text style={{ fontSize: 14.5, fontWeight: '600', color: '#16162B' }}>{baby.name}</Text>
              </View>
              {!scoreInfo ? (
                <Text style={{ fontSize: 12.5, color: '#8A8299' }}>Sin noche registrada todavía.</Text>
              ) : scoreInfo.assumed ? (
                <>
                  <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 26, color: '#8A8299' }}>—</Text>
                  <Text style={{ fontSize: 12, color: '#8A8299' }}>Noche asumida — no se puntúa porque no se midió.</Text>
                </>
              ) : scoreInfo.insufficientHistory ? (
                <>
                  <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 26, color: '#8A8299' }}>—</Text>
                  <Text style={{ fontSize: 12, lineHeight: 12 * 1.4, color: '#8A8299' }}>
                    Faltan {scoreInfo.nightsNeeded} noche{scoreInfo.nightsNeeded === 1 ? '' : 's'} más para calcular esto — tres de los cuatro componentes se comparan contra su propio historial.
                  </Text>
                </>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                    <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 40, color: '#16162B' }}>{one(scoreInfo.score)}</Text>
                    <Text style={{ fontSize: 13, color: '#8A8299' }}>/10</Text>
                  </View>
                  <View style={{ height: 5, borderRadius: 99, backgroundColor: '#E4DCD0' }}>
                    <View style={{ width: Math.min(100, scoreInfo.score * 10) + '%', height: '100%', borderRadius: 99, backgroundColor: ACCENT[baby.tone] }} />
                  </View>
                  {scoreInfo.delta != null ? (
                    <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 12, color: scoreInfo.delta >= 0 ? '#3F7A62' : '#C4562F' }}>
                      {scoreInfo.delta >= 0 ? '+' : ''}{one(scoreInfo.delta)} vs. su promedio
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 11.5, color: '#8A8299' }}>Todavía sin promedio propio</Text>
                  )}
                  <Text style={{ fontSize: 12, lineHeight: 12 * 1.4, color: '#6A6478' }}>
                    {scoreInfo.wakes} despertar{scoreInfo.wakes === 1 ? '' : 'es'}, {dur(scoreInfo.wakeMinutes)} {agree(baby, 'despierto', 'despierta')}.
                  </Text>
                </>
              )}
            </View>
          ))}
        </View>

        <View style={{ borderRadius: 16, backgroundColor: '#F3EFE6', padding: 15, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: '#8A8299' }}>La noche</Text>
            <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10, color: '#8A8299' }}>
              {rows[0]?.night ? fmt(new Date(rows[0].night.started_at).getHours() * 60 + new Date(rows[0].night.started_at).getMinutes()) + ' → ' + fmt(new Date(rows[0].night.ended_at).getHours() * 60 + new Date(rows[0].night.ended_at).getMinutes()) : '—'}
            </Text>
          </View>
          {rows.map(({ baby, night }) => (
            <View key={baby.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
              <Text style={{ width: 34, fontSize: 12, fontWeight: '600', color: '#4A4459' }}>{baby.name.slice(0, 3).toUpperCase()}</Text>
              {night ? <NightLane night={night} color={ACCENT[baby.tone]} /> : <View style={{ flex: 1, height: 22, borderRadius: 99, backgroundColor: '#E4DCD0' }} />}
              <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 12, color: '#16162B', minWidth: 62, textAlign: 'right' }}>
                {night ? dur(Math.round((new Date(night.ended_at) - new Date(night.fell_asleep_at || night.started_at)) / 60000)) : '—'}
              </Text>
            </View>
          ))}
          <Text style={{ fontSize: 11, color: '#9A8B76' }}>
            Cada marca es un despertar, en su hora real dentro de la noche.
          </Text>
        </View>

        {oneThing ? (
          <View style={{ borderRadius: 18, backgroundColor: '#16162B', padding: 16, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Glyph category="despertar" size={15} color="#F0A868" />
              <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 9.5, letterSpacing: 1.4, textTransform: 'uppercase', color: '#F0A868' }}>Hoy, una sola cosa</Text>
            </View>
            <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 22, lineHeight: 22 * 1.2, color: '#FBF7F0' }}>{oneThing.text}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => onOpenSleepPlan && onOpenSleepPlan()}
                style={{ flex: 1, minHeight: 48, borderRadius: 13, backgroundColor: '#6B5DD3', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#FBF7F0' }}>Ajustar el plan de hoy</Text>
              </Pressable>
              <Pressable onPress={onClose} style={{ minHeight: 48, paddingHorizontal: 16, borderRadius: 13, borderWidth: 1, borderColor: '#363458', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 13.5, color: '#B9B2C9' }}>Luego</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={{ gap: 9 }}>
          <SectionRule>Horario predicho para hoy</SectionRule>
          <View style={{ borderRadius: 16, borderWidth: 1, borderColor: '#E4DCD0', backgroundColor: 'white', paddingHorizontal: 14 }}>
            {pb.map((b, bi) => (
              <View key={b.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10, borderTopWidth: bi === 0 ? 0 : 1, borderTopColor: '#F0EAE0' }}>
                <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 12.5, color: '#16162B', minWidth: 38 }}>{b.times[0]}</Text>
                <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: b.key === 'night' ? '#2C2C52' : b.key === 'wake' ? '#F0A868' : '#6B5DD3' }} />
                <Text style={{ flex: 1, fontSize: 13.5, color: '#4A4459' }}>{b.key === 'wake' ? 'Despertar' : b.label}</Text>
                <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 11, color: '#8A8299' }}>sugerido</Text>
              </View>
            ))}
          </View>
          <Text style={{ fontSize: 11.5, color: '#9A8B76' }}>
            {rows.some((r) => r.scoreInfo?.insufficientHistory)
              ? 'Todavía usa el promedio de la edad — se vuelve personalizado con 3 noches registradas.'
              : 'Siempre dice "sugerido": es una predicción para un día que todavía no pasó, ya calculada con el patrón real del bebé.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
export default MorningScreen;
