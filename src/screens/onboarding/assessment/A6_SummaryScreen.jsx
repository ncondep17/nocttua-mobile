import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@nocttua/theme/native';
import { NightCanvas, StepHeader, StepFooter, Headline, CreamButton, BACKGROUNDS } from '../chrome/OnboardingChrome';
import { correctedAgeMonths, derivePlanFromAssessment, planToTimeline, profileWithPlan, profileForAgeMonths } from '../../../lib/assessment';
import { completeAssessmentOnboarding } from '../../../data/onboarding';
import { getBabies } from '../../../data/family';
import { planBlocks } from '../../../lib/derive';
import { scheduleTodayWindowAlerts } from '../../../lib/scheduleTodayWindows';
import { plural, agree } from '../../../lib/grammar';

const WAKINGS_LABEL = { 0: 'ningún despertar', 1: '1 despertar', 2.5: '2 o 3 despertares', 4: 'varios despertares' };

/** Conjuga por número Y género real de los bebés — antes esto era un string fijo en femenino plural ("se duermen solas", "cargadas"), incorrecto para un varón o para un solo bebé. */
function methodPhrase(method, babies) {
  const verb = plural(babies, 'se duerme', 'se duermen');
  if (method === 'alone') return verb + ' ' + agree(babies, 'solo', 'sola');
  if (method === 'held') return verb + ' ' + agree(babies, 'cargado', 'cargada');
  if (method === 'patted') return verb + ' con palmaditas';
  if (method === 'fed') return verb + ' con la toma';
  return null;
}

/** A6 · Esto es lo que vamos a asumir — cierra el assessment: crea Plan + Assessment + Baseline, cero SleepLog. */
export function A6_SummaryScreen({ draft, onBack, onChangeSomething, onDone }) {
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);

  const gestationWeeks = draft.premature === 'si' ? draft.gestationWeeks : null;
  const referenceAgeMonths = draft.birthDate ? correctedAgeMonths(draft.birthDate, gestationWeeks) : 6;
  const plan = derivePlanFromAssessment(draft, referenceAgeMonths);
  const timeline = planToTimeline(plan);
  const b = draft.baseline;

  const babyWord = plural(draft.babies, 'bebé', 'bebés');
  const baselineLine = 'Punto de partida: ' + (WAKINGS_LABEL[b.wakingsPerNight] ?? 'algunos despertares') + ', '
    + (methodPhrase(b.fallAsleepMethod, draft.babies) ?? 'variable') + ', '
    + plural(draft.babies, 'tarda', 'tardan') + ' unos ' + (b.latencyMin ?? '—') + ' min.';

  const handleEmpezar = async () => {
    try {
      setSaving(true);
      const familyId = await completeAssessmentOnboarding(draft);
      // Primera alerta de ventana con el plan recién creado — mismo mecanismo
      // que ya usa Hoy (README §3 paso 9), sin inventar un contrato nuevo.
      try {
        const babies = await getBabies(familyId);
        const effectiveProfile = profileWithPlan(profileForAgeMonths(referenceAgeMonths), plan);
        const pb = planBlocks(effectiveProfile, babies.map(() => null), babies.map(() => []), babies.map(() => null));
        await scheduleTodayWindowAlerts(babies, pb);
      } catch {
        // La alerta es un extra sobre un assessment ya guardado — si falla no se bloquea el cierre.
      }
      onDone();
    } catch (err) {
      Alert.alert('No se pudo guardar', err.message ?? String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <NightCanvas variant={BACKGROUNDS.ambarAbajo}>
      <StepHeader label="PASO 6 DE 6" onSkip={onBack} skipLabel="Atrás" />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 26, paddingTop: 20, paddingBottom: 20 }}>
        <Headline
          title="Esto es lo que vamos a asumir."
          body={'Cada mañana la app te muestra estas horas ya puestas para ' + (draft.babies.length > 1 ? 'tus ' + babyWord : 'tu ' + babyWord) + '. Solo tocas lo que cambió.'}
        />
        <View style={{ height: 22 }} />
        <View style={{ gap: 14 }}>
          <View style={{ borderRadius: 18, borderWidth: 1, borderColor: '#2C2C52', backgroundColor: 'rgba(11,11,22,.4)', padding: 15, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, fontFamily: theme.fontFamily.uiAppMedium, fontWeight: '500', color: '#FBF7F0' }}>Tu día base</Text>
              <View style={{ borderRadius: 99, borderWidth: 1, borderColor: '#3A3560', paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, color: '#B9B2C9' }}>Editable</Text>
              </View>
            </View>
            {timeline.map((row) => (
              <View key={row.key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 16, color: '#FBF7F0', width: 56 }}>{row.time}</Text>
                <Text style={{ flex: 1, fontSize: 13.5, color: '#D6D0E4' }}>{row.label}</Text>
                {row.windowMin != null ? (
                  <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 11.5, color: '#8E87B5' }}>ventana {row.windowMin} min</Text>
                ) : null}
              </View>
            ))}
            <View style={{ borderTopWidth: 1, borderTopColor: '#2C2C52', paddingTop: 10 }}>
              <Text style={{ fontSize: 12, lineHeight: 12 * 1.5, color: '#B9B2C9' }}>{baselineLine}</Text>
            </View>
          </View>

          <View style={{ borderRadius: 18, backgroundColor: 'rgba(240,168,104,.1)', borderWidth: 1, borderColor: 'rgba(240,168,104,.4)', padding: 15, gap: 6 }}>
            <Text style={{ fontSize: 13.5, fontFamily: theme.fontFamily.uiAppMedium, fontWeight: '500', color: '#FBF7F0' }}>A partir de mañana</Text>
            <Text style={{ fontSize: 12.5, lineHeight: 12.5 * 1.5, color: '#C7A183' }}>
              Estas horas son solo el arranque. En cuanto tengas tres días de registro, Nocttua calcula las ventanas con lo que pasó de verdad, no con lo que pusiste aquí.
            </Text>
          </View>
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 26, paddingBottom: 20 + insets.bottom, gap: 14 }}>
        <CreamButton onPress={handleEmpezar} style={saving ? { opacity: 0.6 } : null}>{saving ? 'Guardando…' : 'Empezar'}</CreamButton>
        <Pressable onPress={onChangeSomething} style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: '#B9B2C9' }}>Cambiar algo</Text>
        </Pressable>
      </View>
    </NightCanvas>
  );
}
export default A6_SummaryScreen;
