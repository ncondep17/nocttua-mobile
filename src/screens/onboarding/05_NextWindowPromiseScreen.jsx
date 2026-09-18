import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@nocttua/theme/native';
import { NightCanvas, StepHeader, StepFooter, Headline, BACKGROUNDS } from './chrome/OnboardingChrome';
import { Logo } from '../../components/brand/Logo';

/**
 * 05 · PRÓXIMA VENTANA — PROMESA CRÍTICA
 * Esta pantalla vende un servicio de severidad 1 (ver CONTRATO-AVISO-VENTANA.md).
 * La pantalla en sí es solo la promesa visual; el motor real de aviso local
 * vive en src/lib/windowAlerts.js y todavía no tiene de dónde tomar una
 * ventana calculada de verdad (falta el algoritmo de predicción por edad,
 * ver plan "Fases siguientes") — no se inventa una hora acá tampoco.
 */
export function NextWindowPromiseScreen({ onNext, onSkip }) {
  const insets = useSafeAreaInsets();

  return (
    <NightCanvas variant={BACKGROUNDS.ambarArriba}>
      <StepHeader label="La promesa" onSkip={onSkip} />
      <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 26, paddingBottom: 30 + insets.bottom, paddingTop: 22 }}>
        <Headline
          size={32} gap={12} bodySize={14.5}
          title="Te avisamos cuál es la próxima ventana."
          body="Con lo que registras — siestas del día, última toma, despertares — calculamos el horario que le conviene hoy. No tienes que abrir la app ni hacer cuentas."
        />

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 18, backgroundColor: '#FBF7F0', paddingHorizontal: 15, paddingVertical: 14 }}>
          <View style={{ marginTop: 2 }}>
            <Logo variant="iso-noche" width={26} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
              <Text style={{ fontSize: 13.5, fontFamily: 'DMSans-Bold', color: '#16162B' }}>Nocttua</Text>
              <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 11, color: '#8A8299' }}>ahora</Text>
            </View>
            <Text style={{ fontSize: 13.5, lineHeight: 13.5 * 1.45, color: '#16162B' }}>
              Bebé A: ventana 12:30. Última toma 10:20, conviene ofrecer antes de dormir.
            </Text>
          </View>
        </View>

        <View style={{ gap: 8, borderRadius: 18, borderWidth: 1, borderColor: '#4A4A7A', padding: 15 }}>
          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.05, color: '#F0A868' }}>
            Compromiso del sistema
          </Text>
          <Text style={{ fontSize: 12.5, lineHeight: 12.5 * 1.55, color: '#D6D0E4' }}>
            El aviso se programa en tu teléfono, no en un servidor. Llega con o sin internet.
          </Text>
        </View>

        <StepFooter active={3} onNext={onNext} />
      </View>
    </NightCanvas>
  );
}
export default NextWindowPromiseScreen;
