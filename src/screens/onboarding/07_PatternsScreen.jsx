import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@nocttua/theme/native';
import { NightCanvas, StepHeader, StepFooter, Headline, GlassCard, BACKGROUNDS } from './chrome/OnboardingChrome';

/**
 * 07 · Patrones y reportes — degradado de importancia deliberado en las 7
 * barras: días 1-3 apagados, 4-6 semana en curso (violeta), 7 hoy (ámbar).
 */
const BARS = [
  { h: 48, c: '#4A4A7A' }, { h: 62, c: '#4A4A7A' }, { h: 44, c: '#4A4A7A' },
  { h: 70, c: '#A79FE0' }, { h: 78, c: '#A79FE0' }, { h: 66, c: '#A79FE0' },
  { h: 88, c: '#F0A868' },
];
const BAR_BOX_HEIGHT = 84;

export function PatternsScreen({ onNext, onSkip }) {
  const insets = useSafeAreaInsets();

  const Bar = ({ label, pct, color }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={{ width: 56, fontSize: 11.5, color: '#B9B2C9' }}>{label}</Text>
      <View style={{ height: 7, flex: 1, borderRadius: 99, backgroundColor: '#33335F', overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: '100%', borderRadius: 99, backgroundColor: color }} />
      </View>
    </View>
  );

  return (
    <NightCanvas variant={BACKGROUNDS.noche}>
      <StepHeader label="Patrones" onSkip={onSkip} />
      <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 26, paddingBottom: 30 + insets.bottom, paddingTop: 24 }}>
        <Headline
          title="Ves qué mueve la aguja, no solo la noche de ayer."
          body="Cuánto durmió, cuánto tomó y cómo se relacionan. Una mala noche no dice nada; la semana sí."
        />

        <GlassCard gap={13}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, fontFamily: theme.fontFamily.uiAppMedium, fontWeight: '500', color: '#FBF7F0' }}>Últimos 7 días</Text>
            <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 12, color: '#7FB09A' }}>+42 min de noche</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 9, height: BAR_BOX_HEIGHT }}>
            {BARS.map((b, i) => (
              <View key={i} style={{ flex: 1, height: (b.h / 100) * BAR_BOX_HEIGHT, borderRadius: 6, backgroundColor: b.c }} />
            ))}
          </View>
          <View style={{ gap: 6 }}>
            <Bar label="Tomas" pct={72} color="#C2703F" />
            <Bar label="Extracción" pct={45} color="#7FB09A" />
          </View>
          <Text style={{ fontSize: 12.5, lineHeight: 12.5 * 1.5, color: '#B9B2C9' }}>Si el pediatra lo pide, lo exportas en un toque.</Text>
        </GlassCard>

        <StepFooter active={4} onNext={onNext} />
      </View>
    </NightCanvas>
  );
}
export default PatternsScreen;
