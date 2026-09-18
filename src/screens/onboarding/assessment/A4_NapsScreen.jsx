import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@nocttua/theme/native';
import { NightCanvas, StepHeader, StepFooter, Headline, ChipRow, BACKGROUNDS } from '../chrome/OnboardingChrome';
import { toMin, fmt, dur } from '../../../lib/time';
import { synthesizeNapSchedule, validateAssessment } from '../../../lib/assessment';

const NAP_COUNT_OPTIONS = [{ label: 'Ninguna', value: 0 }, { label: 'Una', value: 1 }, { label: 'Dos', value: 2 }, { label: 'Tres', value: 3 }];
const START_OFFSETS = [-30, 0, 30, 60].map((m) => m); // relativo a la hora sugerida de cada siesta, en chips de "Empieza"
const DURATION_OPTIONS = [45, 60, 90, 120].map((m) => ({ label: dur(m), value: m }));

/** A4 · ¿Cuántas siestas y a qué hora? — "¿duermen igual?" solo con siblingType 'multiple'. */
export function A4_NapsScreen({ draft, update, onNext, onBack, stepLabel = 'PASO 4 DE 6', stepIndex = 3, stepTotal = 6, nextLabel }) {
  const insets = useSafeAreaInsets();

  const setNapCount = (n) => {
    const wakeMin = draft.wakeTime != null ? toMin(draft.wakeTime) : toMin('6:30');
    const windowMin = draft.wakeWindowMin ?? 180;
    const napSchedule = n === 0 ? [] : synthesizeNapSchedule(wakeMin, n, windowMin, 90);
    update({ naps: n, napSchedule });
  };

  const updateNap = (i, patch) => {
    update((d) => ({ napSchedule: d.napSchedule.map((nap, idx) => (idx === i ? { ...nap, ...patch } : nap)) }));
  };

  const startOptionsFor = (nap) => {
    const base = toMin(nap.startsAt);
    return START_OFFSETS.map((off) => ({ label: fmt(base + off), value: fmt(base + off) }));
  };

  const errors = validateAssessment({ babies: draft.babies, bedtime: draft.bedtime, napSchedule: draft.napSchedule });
  const canContinue = draft.naps == null || !errors.napSchedule;

  return (
    <NightCanvas variant={BACKGROUNDS.noche}>
      <StepHeader label={stepLabel} onSkip={onBack} skipLabel="Atrás" />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 26, paddingTop: 20, paddingBottom: 20 }}>
        <Headline
          title="¿Cuántas siestas y a qué hora?"
          body="Con esto la pantalla de Hoy ya sabe qué mostrarte mañana sin que registres nada."
        />
        <View style={{ height: 22 }} />
        <View style={{ gap: 14 }}>
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 13, color: '#B9B2C9' }}>Cuántas</Text>
            <ChipRow options={NAP_COUNT_OPTIONS} value={draft.naps} onChange={setNapCount} />
          </View>

          {(draft.napSchedule ?? []).map((nap, i) => (
            <View key={i} style={{ gap: 12, borderRadius: 18, borderWidth: 1, borderColor: '#2C2C52', backgroundColor: 'rgba(11,11,22,.4)', padding: 15 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, fontFamily: theme.fontFamily.uiAppMedium, fontWeight: '500', color: '#FBF7F0' }}>
                  {draft.napSchedule.length === 1 ? 'Siesta' : (i + 1) + '.ª siesta'}
                </Text>
                <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 13, color: '#B9B2C9' }}>
                  {nap.startsAt} – {fmt(toMin(nap.startsAt) + nap.durationMin)}
                </Text>
              </View>
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12, color: '#8E87B5' }}>Empieza</Text>
                <ChipRow options={startOptionsFor(nap)} value={nap.startsAt} onChange={(v) => updateNap(i, { startsAt: v })} />
              </View>
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12, color: '#8E87B5' }}>Dura</Text>
                <ChipRow options={DURATION_OPTIONS} value={nap.durationMin} onChange={(v) => updateNap(i, { durationMin: v })} />
              </View>
            </View>
          ))}
          {errors.napSchedule ? <Text style={{ fontSize: 12, color: '#D9705A' }}>{errors.napSchedule}</Text> : null}

          {draft.siblingType === 'multiple' && draft.naps > 0 ? (
            <View style={{ borderRadius: 18, backgroundColor: 'rgba(240,168,104,.1)', borderWidth: 1, borderColor: 'rgba(240,168,104,.4)', padding: 15, gap: 10 }}>
              <Text style={{ fontSize: 13.5, fontFamily: theme.fontFamily.uiAppMedium, fontWeight: '500', color: '#FBF7F0' }}>¿Duermen igual las dos?</Text>
              <ChipRow
                options={[{ label: 'Sí, igual', value: true }, { label: 'Cada una distinto', value: false }]}
                value={draft.twinSyncDefault}
                onChange={(v) => update({ twinSyncDefault: v })}
              />
              <Text style={{ fontSize: 11.5, lineHeight: 11.5 * 1.5, color: '#C7A183' }}>
                Si eliges «igual», registras a las dos con un toque y solo separas cuando una se desfase.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 26, paddingBottom: 20 + insets.bottom }}>
        <StepFooter active={stepIndex} total={stepTotal} onNext={onNext} disabled={!canContinue} label={nextLabel} />
      </View>
    </NightCanvas>
  );
}
export default A4_NapsScreen;
