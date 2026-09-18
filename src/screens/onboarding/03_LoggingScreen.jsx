import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@nocttua/theme/native';
import { NightCanvas, StepHeader, StepFooter, Headline, GlassCard, BACKGROUNDS } from './chrome/OnboardingChrome';

/** 03 · Registro de sueño y tomas — la hoja real de registro, en demo. */
export function LoggingScreen({ onNext, onSkip }) {
  const insets = useSafeAreaInsets();

  const Cell = ({ label, active = false, dim = false }) => (
    <View
      style={{
        borderRadius: 12, padding: 12, alignItems: 'center',
        backgroundColor: active ? '#FBF7F0' : 'transparent',
        borderWidth: active ? 0 : 1, borderColor: '#6E6890',
      }}
    >
      <Text style={{ fontSize: 14.5, fontFamily: active ? theme.fontFamily.uiAppMedium : theme.fontFamily.uiApp, fontWeight: active ? '500' : '400', color: active ? '#16162B' : dim ? '#D6D0E4' : '#FBF7F0' }}>
        {label}
      </Text>
    </View>
  );
  const Pill = ({ label, active = false }) => (
    <View style={{ flex: 1, borderRadius: 99, borderWidth: 1, borderColor: '#6E6890', padding: 9, alignItems: 'center', backgroundColor: active ? 'rgba(107,93,211,.2)' : 'transparent' }}>
      <Text style={{ fontSize: 13, color: active ? '#FBF7F0' : '#D6D0E4' }}>{label}</Text>
    </View>
  );

  return (
    <NightCanvas variant={BACKGROUNDS.noche}>
      <StepHeader label="Registro" onSkip={onSkip} />
      <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 26, paddingBottom: 30 + insets.bottom, paddingTop: 24 }}>
        <Headline
          title="Sueño y tomas, con un toque cada uno."
          body="Se durmió, despertó, tomó o no tomó. No hace falta anotar cada microsiesta: lo importante es lo que arma la rutina."
        />

        <GlassCard>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 25, color: '#FBF7F0' }}>¿Qué pasó?</Text>
            <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 14, color: '#F0A868' }}>20:12</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <View style={{ width: '47%' }}><Cell label="Se durmió" active /></View>
            <View style={{ width: '47%' }}><Cell label="Tomó leche" /></View>
            <View style={{ width: '47%' }}><Cell label="Pañal" dim /></View>
            <View style={{ width: '47%' }}><Cell label="Nota" dim /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pill label="Bebé A" active />
            <Pill label="Bebé B" />
            <Pill label="Los dos" />
          </View>
          <Text style={{ fontSize: 12.5, lineHeight: 12.5 * 1.5, color: '#B9B2C9' }}>Lo corriges a la mañana, cuando estés despierta.</Text>
        </GlassCard>

        <StepFooter active={1} onNext={onNext} />
      </View>
    </NightCanvas>
  );
}
export default LoggingScreen;
