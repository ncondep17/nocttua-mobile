import { useState } from 'react';
import { View, Text, Alert, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as AppleAuthentication from 'expo-apple-authentication';
import { theme } from '@nocttua/theme/native';
import { NightCanvas, Headline, BACKGROUNDS } from './chrome/OnboardingChrome';
import { Logo } from '../../components/brand/Logo';
import { supabase } from '../../lib/supabase';

/**
 * 08 · Acceso con Apple — un solo camino, sin Google ni correo.
 * Conectado de verdad a Supabase Auth (signInWithIdToken); el cambio de
 * sesión lo toma RootNavigator (onAuthStateChange) y avanza a 09.
 */
export function AppleAuthScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const handleApple = async () => {
    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      if (!credential.identityToken) throw new Error('Apple no devolvió identityToken');
      const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken });
      if (error) throw error;

      // Apple solo manda el nombre la primera vez que se autoriza esta app;
      // si llega, lo guardamos ahora porque no va a volver a aparecer.
      const fullName = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ');
      if (fullName && data.user) {
        await supabase.from('profiles').update({ display_name: fullName }).eq('id', data.user.id);
      }
    } catch (err) {
      if (err.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('No se pudo iniciar sesión', err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <NightCanvas variant={BACKGROUNDS.violetaAbajo}>
      <View style={{ flex: 1, justifyContent: 'center', gap: 26, paddingHorizontal: 26, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <View style={{ gap: 12 }}>
          <Logo variant="iso-crema" width={38} />
          <Headline title="Entra en dos toques." body="Sin contraseñas nuevas que recordar a las tres de la mañana." />
        </View>

        <View style={{ gap: 12 }}>
          <Pressable
            onPress={handleApple}
            disabled={loading}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 14, backgroundColor: '#FBF7F0', paddingHorizontal: 16, paddingVertical: 16, minHeight: 44 }}
          >
            <Text style={{ fontSize: 18, lineHeight: 18 }}></Text>
            <Text style={{ fontSize: 16, fontFamily: theme.fontFamily.uiAppMedium, fontWeight: '500', color: '#16162B' }}>Continuar con Apple</Text>
          </Pressable>
          <Text style={{ textAlign: 'center', fontSize: 12.5, lineHeight: 12.5 * 1.55, color: '#B9B2C9' }}>
            Puedes ocultar tu correo. Guardamos solo lo necesario para tus registros.
          </Text>
        </View>

        <Text style={{ textAlign: 'center', fontSize: 12, lineHeight: 12 * 1.6, color: '#8E87B5' }}>
          Al continuar aceptas los <Text style={{ color: '#C9C1D8' }}>Términos</Text> y la <Text style={{ color: '#C9C1D8' }}>Privacidad</Text>.
        </Text>
      </View>
    </NightCanvas>
  );
}
export default AppleAuthScreen;
