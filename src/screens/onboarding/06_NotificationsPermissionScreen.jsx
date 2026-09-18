import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { NightCanvas, Headline, CreamButton, BACKGROUNDS } from './chrome/OnboardingChrome';
import { logTelemetry } from '../../lib/telemetry';

/**
 * 06 · Permiso de notificaciones — sin "Saltar", sin paginador: es una
 * decisión, no un paso del carrusel. Pide el permiso real (no un mock) y
 * registra el resultado (contrato, sección 5: "se mide o no existe").
 */
export function NotificationsPermissionScreen({ onAllow, onDecline }) {
  const insets = useSafeAreaInsets();

  const Row = ({ label, value, dim = false, mutedValue = false }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 13.5, color: dim ? '#D6D0E4' : '#FBF7F0' }}>{label}</Text>
      <Text style={{ fontFamily: 'DMMono-Regular', fontSize: 11, color: mutedValue ? '#8E87B5' : '#F0A868' }}>{value}</Text>
    </View>
  );

  const handleAllow = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    await logTelemetry('permission_state', { permission: 'notifications', status });
    onAllow();
  };

  const handleDecline = async () => {
    await logTelemetry('permission_state', { permission: 'notifications', status: 'declined_in_app' });
    onDecline();
  };

  return (
    <NightCanvas variant={BACKGROUNDS.nocheAlta}>
      <View style={{ flex: 1, justifyContent: 'center', gap: 20, paddingHorizontal: 26, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <View style={{ gap: 12 }}>
          <Text style={{ fontFamily: 'DMMono-Regular', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.26, color: '#F0A868' }}>Un solo permiso</Text>
          <Headline
            size={32} gap={12} bodySize={14.5}
            title="Activa el aviso. Es lo único que te vamos a pedir."
            body="Sin este permiso podemos calcular la ventana y la próxima toma, pero no avisarte: tendrías que abrir la app para saberlo."
          />
        </View>

        <View style={{ gap: 9, borderRadius: 16, borderWidth: 1, borderColor: '#4A4A7A', padding: 14 }}>
          <Row label="Ventana de sueño" value="imprescindible" />
          <Row label="Próxima toma o extracción" value="recomendado" dim />
          <Row label="Novedades de Nocttua" value="nunca" dim mutedValue />
        </View>

        <View style={{ gap: 10 }}>
          <CreamButton onPress={handleAllow}>Activar avisos</CreamButton>
          <Text onPress={handleDecline} style={{ textAlign: 'center', fontSize: 13.5, color: '#8E87B5' }}>Prefiero mirar la app yo</Text>
        </View>
      </View>
    </NightCanvas>
  );
}
export default NotificationsPermissionScreen;
