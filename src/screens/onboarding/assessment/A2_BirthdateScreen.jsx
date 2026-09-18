import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@nocttua/theme/native';
import { NightCanvas, StepHeader, StepFooter, Headline, ChipRow, BACKGROUNDS } from '../chrome/OnboardingChrome';
import { DateField } from '../../../components/forms/DateField';
import { TextField } from '../../../components/forms/TextArea';
import { correctedAgeMonths, chronologicalAgeMonths, validateAssessment } from '../../../lib/assessment';
import { one } from '../../../lib/time';

const PREMATURE_OPTIONS = [{ id: 'no', label: 'No' }, { id: 'no-se', label: 'No sé' }, { id: 'si', label: 'Sí' }];
const GESTATION_OPTIONS = [28, 32, 34, 36].map((w) => ({ label: String(w), value: w }));

function ageLabel(months) {
  if (months < 1) return 'recién nacida';
  return one(months) + ' meses';
}

/** A2 · ¿Cuándo nacieron? — una sola fecha para el hogar (staggered queda fuera de esta pasada, ver plan). */
export function A2_BirthdateScreen({ draft, update, onNext, onBack }) {
  const insets = useSafeAreaInsets();
  const [customWeeks, setCustomWeeks] = useState('');
  const [showCustomWeeks, setShowCustomWeeks] = useState(false);

  const birthDate = draft.birthDate ? new Date(draft.birthDate) : new Date();
  const gestationWeeks = draft.premature === 'si' ? draft.gestationWeeks : null;
  const errors = validateAssessment({ babies: draft.babies, birthDate: draft.birthDate, premature: draft.premature, gestationWeeks });

  const canContinue = !!draft.birthDate && !errors.birthDate && (draft.premature !== 'si' || (!!draft.gestationWeeks && !errors.gestationWeeks));

  const chrono = draft.birthDate ? chronologicalAgeMonths(draft.birthDate) : 0;
  const corrected = draft.birthDate ? correctedAgeMonths(draft.birthDate, gestationWeeks) : 0;

  return (
    <NightCanvas variant={BACKGROUNDS.noche}>
      <StepHeader label="PASO 2 DE 6" onSkip={onBack} skipLabel="Atrás" />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 26, paddingTop: 20, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
        <Headline
          title="¿Cuándo nacieron?"
          body="La edad define cuánto sueño se espera, y si nacieron antes de término esa cuenta cambia. Preferimos preguntarlo que asumirlo."
        />
        <View style={{ height: 22 }} />
        <View style={{ gap: 16 }}>
          <DateField label="Fecha de nacimiento" value={birthDate} onChange={(d) => update({ birthDate: d.toISOString() })} />
          {errors.birthDate ? <Text style={{ fontSize: 12, color: '#D9705A' }}>{errors.birthDate}</Text> : null}

          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 13, color: '#B9B2C9' }}>¿Antes de término?</Text>
            <ChipRow
              options={PREMATURE_OPTIONS}
              value={draft.premature}
              onChange={(v) => update({ premature: v, gestationWeeks: v === 'si' ? draft.gestationWeeks : null })}
            />
          </View>

          {draft.premature === 'si' ? (
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 13, color: '#B9B2C9' }}>Semanas de gestación</Text>
              <ChipRow
                options={GESTATION_OPTIONS}
                value={draft.gestationWeeks}
                onChange={(v) => { setShowCustomWeeks(false); update({ gestationWeeks: v }); }}
                otraLabel="Otra"
                onOtra={() => setShowCustomWeeks(true)}
              />
              {showCustomWeeks ? (
                <TextField
                  label="Semanas (22–42)"
                  value={customWeeks}
                  onChange={(v) => { setCustomWeeks(v); const n = parseInt(v, 10); if (Number.isFinite(n)) update({ gestationWeeks: n }); }}
                />
              ) : null}
              {errors.gestationWeeks ? <Text style={{ fontSize: 12, color: '#D9705A' }}>{errors.gestationWeeks}</Text> : null}
            </View>
          ) : null}

          {draft.birthDate ? (
            <View style={{ borderRadius: 18, borderWidth: 1, borderColor: '#6B5DD3', backgroundColor: 'rgba(107,93,211,.16)', padding: 15, gap: 10 }}>
              <View style={{ flexDirection: 'row', gap: 20 }}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ fontSize: 11, color: '#B9B2C9' }}>Edad real</Text>
                  <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 20, color: '#FBF7F0' }}>{ageLabel(chrono)}</Text>
                </View>
                {gestationWeeks != null ? (
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={{ fontSize: 11, color: '#B9B2C9' }}>Edad corregida</Text>
                    <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 20, color: '#FBF7F0' }}>{ageLabel(corrected)}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={{ fontSize: 12, lineHeight: 12 * 1.5, color: '#D6D0E4' }}>
                {gestationWeeks != null
                  ? 'Restamos las semanas que le faltaban para término. El rango de sueño esperado y la ventana inicial se calculan con la corregida hasta los 2 años; después las dos se juntan.'
                  : 'Usamos la edad real. Si más adelante nos dices las semanas de gestación, ajustamos el rango esperado.'}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 26, paddingBottom: 20 + insets.bottom }}>
        <StepFooter active={1} total={6} onNext={onNext} disabled={!canContinue} />
      </View>
    </NightCanvas>
  );
}
export default A2_BirthdateScreen;
