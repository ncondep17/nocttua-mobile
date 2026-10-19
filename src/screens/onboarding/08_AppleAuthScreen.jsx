import { useState } from 'react';
import { View, Text, Alert, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as AppleAuthentication from 'expo-apple-authentication';
import { theme } from '@nocttua/theme/native';
import { NightCanvas, Headline, BACKGROUNDS } from './chrome/OnboardingChrome';
import { Logo } from '../../components/brand/Logo';
import { TextField } from '../../components/forms/TextArea';
import { Button } from '../../components/core/Button';
import { supabase } from '../../lib/supabase';
import { TERMS_URL, PRIVACY_URL } from '../../lib/legalLinks';

/**
 * 08 · Acceso — Apple o correo/contraseña. El cambio de sesión lo toma
 * RootNavigator (onAuthStateChange) y avanza a 09; si Supabase pide
 * confirmar el correo antes de dar sesión (ver Auth → Providers → Email en
 * el dashboard), signUp no dispara ese evento todavía y se lo avisamos acá.
 */
export function AppleAuthScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  const handleApple = async () => {
    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      if (!credential.identityToken) throw new Error('Apple no devolvió identityToken');
      const { data, error: authError } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken });
      if (authError) throw authError;

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

  const handleEmailSubmit = async () => {
    setError('');
    setPendingConfirmation(false);
    if (!email.trim() || !password.trim()) {
      setError('Completa correo y contraseña.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password });
        if (authError) throw authError;
        // Sin sesión = el proyecto pide confirmar el correo antes de dar acceso.
        if (!data.session) setPendingConfirmation(true);
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
      }
      // Si hay sesión, RootNavigator la toma solo vía onAuthStateChange.
    } catch (err) {
      setError(err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <NightCanvas variant={BACKGROUNDS.violetaAbajo}>
      <View style={{ flex: 1, justifyContent: 'center', gap: 22, paddingHorizontal: 26, paddingTop: insets.top, paddingBottom: insets.bottom }}>
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

        {!showEmail ? (
          <Pressable onPress={() => setShowEmail(true)} style={{ alignItems: 'center', paddingVertical: 6 }}>
            <Text style={{ fontFamily: theme.fontFamily.uiAppMedium, fontWeight: '500', fontSize: 14, color: '#C9C1D8' }}>o continuar con tu correo</Text>
          </Pressable>
        ) : (
          <View style={{ gap: 12 }}>
            <TextField
              label="Correo"
              value={email}
              onChange={setEmail}
              placeholder="tu@correo.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextField
              label="Contraseña"
              value={password}
              onChange={setPassword}
              placeholder="••••••••••"
              secureTextEntry
              autoCapitalize="none"
            />
            {error ? <Text style={{ fontSize: 13, color: '#E7A0A0' }}>{error}</Text> : null}
            {pendingConfirmation ? (
              <Text style={{ fontSize: 13, color: '#C9C1D8' }}>Revisa tu correo para confirmar la cuenta antes de entrar.</Text>
            ) : null}
            <Button variant="secondary" full disabled={loading} onPress={handleEmailSubmit}>
              {loading ? 'Un momento…' : mode === 'signup' ? 'Crear cuenta' : 'Entrar'}
            </Button>
            <Pressable onPress={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); setPendingConfirmation(false); }} style={{ alignItems: 'center', paddingVertical: 4 }}>
              <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: 13, color: '#C9C1D8' }}>
                {mode === 'signup' ? 'Ya tengo cuenta' : 'Todavía no tengo cuenta'}
              </Text>
            </Pressable>
          </View>
        )}

        <Text style={{ textAlign: 'center', fontSize: 12, lineHeight: 12 * 1.6, color: '#8E87B5' }}>
          Al continuar aceptas los{' '}
          <Text style={{ color: '#C9C1D8', textDecorationLine: 'underline' }} onPress={() => Linking.openURL(TERMS_URL)}>Términos</Text>
          {' '}y la{' '}
          <Text style={{ color: '#C9C1D8', textDecorationLine: 'underline' }} onPress={() => Linking.openURL(PRIVACY_URL)}>Privacidad</Text>.
        </Text>
      </View>
    </NightCanvas>
  );
}
export default AppleAuthScreen;
