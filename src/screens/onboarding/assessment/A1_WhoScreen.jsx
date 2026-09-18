import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@nocttua/theme/native';
import { NightCanvas, StepHeader, StepFooter, Headline, BACKGROUNDS } from '../chrome/OnboardingChrome';
import { TextField } from '../../../components/forms/TextArea';
import { ACCENT } from '../../../data/profiles';
import { validateAssessment } from '../../../lib/assessment';

const GENDERS = [{ id: 'niña', label: 'Niña' }, { id: 'niño', label: 'Niño' }];

/** A1 · ¿A quién vamos a acompañar? — babiesCount llega preseleccionado del onboarding, editable. */
export function A1_WhoScreen({ draft, update, onNext }) {
  const insets = useSafeAreaInsets();
  const errors = validateAssessment({ babies: draft.babies });
  const canContinue = draft.babies.every((b) => b.name.trim().length > 0 && b.gender) && Object.keys(errors).length === 0;

  const setBabiesCount = (n) => {
    update((d) => ({
      babiesCount: n,
      siblingType: n === 2 ? 'multiple' : 'single',
      babies: Array.from({ length: n }, (_, i) => d.babies[i] ?? { name: '', gender: 'niña' }),
    }));
  };

  const updateBaby = (i, patch) => {
    update((d) => ({ babies: d.babies.map((b, idx) => (idx === i ? { ...b, ...patch } : b)) }));
  };

  const CountCard = ({ n, title, body }) => {
    const on = draft.babiesCount === n;
    return (
      <Pressable
        onPress={() => setBabiesCount(n)}
        style={{
          flex: 1, gap: 6, borderRadius: 16, padding: 14,
          borderWidth: on ? 1.5 : 1, borderColor: on ? '#6B5DD3' : '#2C2C52',
          backgroundColor: on ? 'rgba(107,93,211,.18)' : 'transparent',
        }}
      >
        <Text style={{ fontSize: 15, fontFamily: theme.fontFamily.uiAppMedium, fontWeight: '500', color: '#FBF7F0' }}>{title}</Text>
        <Text style={{ fontSize: 12.5, lineHeight: 12.5 * 1.45, color: on ? '#D6D0E4' : '#B9B2C9' }}>{body}</Text>
      </Pressable>
    );
  };

  return (
    <NightCanvas variant={BACKGROUNDS.ambarAbajo}>
      <StepHeader label="PASO 1 DE 6" />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 26, paddingTop: 20, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
        <Headline
          title="¿A quién vamos a acompañar?"
          body="Con dos bebés Nocttua trabaja distinto: cada uno tiene su ventana, su registro y su reporte. Puedes cambiarlo después."
        />
        <View style={{ height: 22 }} />
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <CountCard n={1} title="Un bebé" body="Una sola línea de tiempo." />
            <CountCard n={2} title="Dos bebés" body="Gemelos o mellizos, plan compartido." />
          </View>

          {draft.babies.map((b, i) => (
            <View key={i} style={{ gap: 12, borderRadius: 18, borderWidth: 1, borderColor: '#2C2C52', backgroundColor: 'rgba(11,11,22,.4)', padding: 15 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: i === 0 ? ACCENT.a : ACCENT.b }} />
                <Text style={{ fontSize: 13.5, fontFamily: theme.fontFamily.uiAppMedium, fontWeight: '500', color: '#FBF7F0' }}>
                  {draft.babies.length > 1 ? 'Bebé ' + (i + 1) : 'Tu bebé'}
                </Text>
              </View>
              <TextField label="Nombre" value={b.name} onChange={(v) => updateBaby(i, { name: v })} placeholder="Emilia" />
              {errors['babies.' + i + '.name'] ? (
                <Text style={{ fontSize: 12, color: '#D9705A' }}>{errors['babies.' + i + '.name']}</Text>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {GENDERS.map((g) => {
                  const on = b.gender === g.id;
                  return (
                    <Pressable
                      key={g.id}
                      onPress={() => updateBaby(i, { gender: g.id })}
                      style={{
                        flex: 1, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                        borderWidth: on ? 1.5 : 1, borderColor: on ? '#6B5DD3' : '#2C2C52',
                        backgroundColor: on ? 'rgba(107,93,211,.18)' : 'transparent',
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '500', color: on ? '#FBF7F0' : '#8E87B5' }}>{g.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

          <Text style={{ fontSize: 11.5, lineHeight: 11.5 * 1.5, color: '#6E6890' }}>
            El género define cómo te habla la app: «se durmió», «se durmieron», «dormida», «dormido». Nada más.
          </Text>
          {draft.babiesCount === 2 ? (
            <Text style={{ fontSize: 11.5, lineHeight: 11.5 * 1.5, color: '#6E6890' }}>
              Múltiples arrancan con un plan compartido y un solo toque.
            </Text>
          ) : null}
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 26, paddingBottom: 20 + insets.bottom }}>
        <StepFooter active={0} total={6} onNext={onNext} disabled={!canContinue} />
      </View>
    </NightCanvas>
  );
}
export default A1_WhoScreen;
