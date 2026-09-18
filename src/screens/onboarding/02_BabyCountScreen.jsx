import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@nocttua/theme/native';
import { NightCanvas, StepHeader, StepFooter, Headline, BACKGROUNDS } from './chrome/OnboardingChrome';

/**
 * 02 · Uno o dos bebés — LA pantalla que decide toda la app.
 * Bebé A violeta #A79FE0 · Bebé B terracota #C2703F. Nunca al revés.
 */
export function BabyCountScreen({ onNext, onSkip, onSelect }) {
  const insets = useSafeAreaInsets();
  const [sel, setSel] = useState('two');

  const Card = ({ id, title, body }) => {
    const on = sel === id;
    return (
      <Pressable
        onPress={() => { setSel(id); onSelect && onSelect(id); }}
        style={{
          flex: 1, gap: 6, borderRadius: 16, padding: 14,
          borderWidth: on ? 1.5 : 1, borderColor: on ? '#6B5DD3' : '#4A4A7A',
          backgroundColor: on ? 'rgba(107,93,211,.18)' : 'transparent',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 15, fontFamily: theme.fontFamily.uiAppMedium, fontWeight: '500', color: '#FBF7F0' }}>{title}</Text>
          {on ? (
            <View style={{ height: 17, width: 17, borderRadius: 99, backgroundColor: '#6B5DD3', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 10.5, color: '#FBF7F0' }}>✓</Text>
            </View>
          ) : null}
        </View>
        <Text style={{ fontSize: 12.5, lineHeight: 12.5 * 1.45, color: on ? '#D6D0E4' : '#B9B2C9' }}>{body}</Text>
      </Pressable>
    );
  };

  const Baby = ({ dot, name, data }) => (
    <View style={{ flex: 1, gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <View style={{ height: 8, width: 8, borderRadius: 99, backgroundColor: dot }} />
        <Text style={{ fontSize: 13.5, color: '#FBF7F0' }}>{name}</Text>
      </View>
      <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 13, color: '#B9B2C9' }}>{data}</Text>
    </View>
  );

  return (
    <NightCanvas variant={BACKGROUNDS.noche}>
      <StepHeader label="Tu casa" onSkip={onSkip} />
      <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 26, paddingBottom: 30 + insets.bottom, paddingTop: 24 }}>
        <Headline
          title="¿Cuántos bebés estás siguiendo?"
          body="Con uno, Nocttua te quita el cuaderno de encima. Con dos, te quita el caos: nadie más los sigue en paralelo de verdad."
        />

        <View style={{ gap: 11 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Card id="one" title="Un bebé" body="Una sola línea de tiempo, sin ruido." />
            <Card id="two" title="Dos bebés" body="Cada uno con su ritmo, en una pantalla." />
          </View>
          <View style={{ gap: 11, borderRadius: 18, borderWidth: 1, borderColor: '#4A4A7A', backgroundColor: 'rgba(251,247,240,.07)', padding: 15 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Baby dot="#A79FE0" name="Bebé A" data="durmió 4h · 3 tomas" />
              <Baby dot="#C2703F" name="Bebé B" data="durmió 5h · 4 tomas" />
            </View>
            <Text style={{ fontSize: 12.5, lineHeight: 12.5 * 1.5, color: '#D6D0E4' }}>
              Registras a uno y te ofrecemos copiar al otro. Si van desfasados, cada uno mantiene su horario.
            </Text>
          </View>
        </View>

        <StepFooter active={0} onNext={onNext} />
      </View>
    </NightCanvas>
  );
}
export default BabyCountScreen;
