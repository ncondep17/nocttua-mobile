import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@nocttua/theme/native';
import { NightCanvas, StepHeader, StepFooter, Headline, GlassCard, BACKGROUNDS } from './chrome/OnboardingChrome';

/** 04 · Lactancia y extracción — pecho, fórmula y extracción en un solo registro, en demo. */
export function FeedingScreen({ onNext, onSkip }) {
  const insets = useSafeAreaInsets();

  const Box = ({ label, value }) => (
    <View style={{ flex: 1, gap: 3, borderRadius: 14, borderWidth: 1, borderColor: '#6E6890', padding: 11 }}>
      <Text style={{ fontSize: 12, color: '#B9B2C9' }}>{label}</Text>
      <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 17, color: '#FBF7F0' }}>{value}</Text>
    </View>
  );

  return (
    <NightCanvas variant={BACKGROUNDS.noche}>
      <StepHeader label="Lactancia" onSkip={onSkip} />
      <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 26, paddingBottom: 30 + insets.bottom, paddingTop: 24 }}>
        <Headline
          title="Pecho, fórmula y extracción en el mismo registro."
          body="Qué lado tocaba, cuántos minutos, cuántos ml y qué te queda en reserva. Sin cuadernos ni notas del teléfono."
        />

        <GlassCard gap={13}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, fontFamily: theme.fontFamily.uiAppMedium, fontWeight: '500', color: '#FBF7F0' }}>Última toma</Text>
            <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 12.5, color: '#F0A868' }}>hace 2h 10</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 9 }}>
            <Box label="Pecho izq." value="12 min" />
            <Box label="Pecho der." value="9 min" />
            <Box label="Fórmula" value="60 ml" />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#4A4A7A', paddingTop: 11 }}>
            <Text style={{ fontSize: 13, color: '#D6D0E4' }}>Extracción de hoy</Text>
            <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 13, color: '#7FB09A' }}>120 ml · reserva 640 ml</Text>
          </View>
          <Text style={{ fontSize: 12.5, lineHeight: 12.5 * 1.5, color: '#B9B2C9' }}>Te avisamos de qué lado toca la próxima, para no adivinar.</Text>
        </GlassCard>

        <StepFooter active={2} onNext={onNext} />
      </View>
    </NightCanvas>
  );
}
export default FeedingScreen;
