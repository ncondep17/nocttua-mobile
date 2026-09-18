import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@nocttua/theme/native';
import { NightCanvas, Headline, CreamButton, Twinkle, BACKGROUNDS } from './chrome/OnboardingChrome';
import { getMyFamilyId, getTeamMembers } from '../../data/family';

/**
 * 10 · Listo — cierra con la misma luz ámbar de la 01. Última pantalla del
 * flujo de 10 aprobado; "Registrar ahora" entra a la app (si venía del
 * camino "sola" todavía falta la encuesta de bebés, que corre después de
 * ésta a pedido, sin tocar las 10 pantallas aprobadas — ver RootNavigator).
 * La tarjeta de asesora solo aparece si en la 09 se vinculó con un código
 * y esa família ya tiene un miembro con role='coach' real.
 */
export function ReadyScreen({ linked, onFinish }) {
  const insets = useSafeAreaInsets();
  const [advisor, setAdvisor] = useState(null);

  useEffect(() => {
    if (!linked) return;
    (async () => {
      const familyId = await getMyFamilyId();
      const team = await getTeamMembers(familyId);
      const coach = team.find((m) => m.profiles.role === 'coach');
      if (coach) setAdvisor({ name: coach.profiles.display_name, initial: coach.profiles.initial || coach.profiles.display_name?.[0] || '?' });
    })();
  }, [linked]);

  return (
    <NightCanvas variant={BACKGROUNDS.ambarAbajo}>
      <Twinkle top={148} left={44} size={11} color="#F0A868" duration={4.5} />

      <View style={{ flex: 1, justifyContent: 'center', gap: 22, paddingHorizontal: 26, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <View style={{ gap: 12 }}>
          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.26, color: '#F0A868' }}>Listo</Text>
          <Headline
            size={34} gap={12}
            title="Ya está. Empieza por lo último que pasó."
            body="Registra la última toma o el último sueño. El resto lo vamos completando solos."
          />
        </View>

        {advisor ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, borderWidth: 1, borderColor: '#4A4A7A', backgroundColor: 'rgba(251,247,240,.07)', padding: 15 }}>
            <View style={{ height: 38, width: 38, borderRadius: 99, backgroundColor: '#4A4A7A', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 17, color: '#FBF7F0' }}>{advisor.initial}</Text>
            </View>
            <View style={{ gap: 2 }}>
              <Text style={{ fontSize: 14.5, fontFamily: theme.fontFamily.uiAppMedium, fontWeight: '500', color: '#FBF7F0' }}>{advisor.name}, tu asesora</Text>
              <Text style={{ fontSize: 12.5, color: '#B9B2C9' }}>Ve tus registros y te deja notas.</Text>
            </View>
          </View>
        ) : null}

        <CreamButton onPress={onFinish}>Registrar ahora</CreamButton>
      </View>
    </NightCanvas>
  );
}
export default ReadyScreen;
