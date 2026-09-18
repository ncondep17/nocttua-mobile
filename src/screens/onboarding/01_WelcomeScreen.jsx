import { useRef, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NightCanvas, Headline, CreamButton, Twinkle, BACKGROUNDS } from './chrome/OnboardingChrome';
import { Logo } from '../../components/brand/Logo';

/**
 * 01 · Bienvenida — fondo ambarAbajo, sin paginador.
 * Contenido anclado abajo. Entra con fundido + subida sutil (riseIn).
 * Copy del H1 ajustado a pedido (el original literal era "Un bebé o dos.
 * Todo en el mismo lugar."); el resto de las 10 pantallas respeta el texto
 * aprobado en SPEC.md palabra por palabra.
 */
export function WelcomeScreen({ onNext }) {
  const insets = useSafeAreaInsets();
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rise, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [rise]);

  return (
    <NightCanvas variant={BACKGROUNDS.ambarAbajo}>
      <Twinkle top={118} left={50} size={12} color="#F0A868" duration={4} />
      <Twinkle top={186} right={62} size={9} color="#C9C1D8" duration={5.5} />

      <Animated.View
        style={{
          flex: 1, justifyContent: 'flex-end', gap: 22,
          paddingHorizontal: 26, paddingBottom: 34 + insets.bottom, paddingTop: insets.top,
          opacity: rise, transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        }}
      >
        <View style={{ opacity: 0.92 }}>
          <Logo variant="wordmark-tight-crema" width={120} />
        </View>
        <Headline
          size={38}
          gap={12}
          bodySize={15.5}
          title="Con un bebé o dos, te acompañamos y te aliviamos la carga."
          body="Sueño, tomas, lactancia y extracción. Nocttua guarda lo que pasó y te dice qué sigue."
        />
        <View style={{ gap: 12 }}>
          <CreamButton onPress={onNext}>Empezar</CreamButton>
          <Text onPress={onNext} style={{ textAlign: 'center', fontSize: 14, color: '#B9B2C9' }}>Ya tengo cuenta</Text>
        </View>
      </Animated.View>
    </NightCanvas>
  );
}
export default WelcomeScreen;
