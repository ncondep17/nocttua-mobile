import { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { theme } from '@nocttua/theme/native';
import { NightCanvas, Headline, BACKGROUNDS } from './chrome/OnboardingChrome';
import { joinFamilyWithCode } from '../../data/onboarding';

/** Acepta tanto el link nocttua.app/c/CODIGO como el código pelado. */
function extractCode(text) {
  const match = text.match(/nocttua\.app\/c\/([A-Za-z0-9]+)/i);
  return (match ? match[1] : text).trim();
}

/**
 * 09 · Individual o invitada — padding lateral 24 (no 26).
 * "Pegar" lee el portapapeles de verdad; "Continuar" con código canjea
 * contra family_invites (create_invite/redeem_invite, ver TeamScreen).
 */
export function AccountTypeScreen({ onNext }) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState('solo');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setCode(extractCode(text));
  };

  const handleContinue = async () => {
    if (mode === 'solo') {
      onNext({ linked: false });
      return;
    }
    if (code.trim().length < 4) {
      Alert.alert('Falta el código', 'Pega o escribe el código que te compartieron.');
      return;
    }
    try {
      setLoading(true);
      await joinFamilyWithCode(code);
      onNext({ linked: true });
    } catch (err) {
      Alert.alert('No se pudo vincular', err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <NightCanvas variant={BACKGROUNDS.nocheBaja}>
      <View style={{ flex: 1, justifyContent: 'center', gap: 20, paddingHorizontal: 24, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <Headline size={31} gap={10} bodySize={14.5} title="¿Vienen de manera independiente o los invita una asesora de sueño?" body="Puedes cambiarlo cuando quieras." />

        <View style={{ gap: 11 }}>
          <Pressable
            onPress={() => setMode('solo')}
            style={{
              gap: 5, borderRadius: 18, padding: 16,
              borderWidth: mode === 'solo' ? 1.5 : 1, borderColor: mode === 'solo' ? '#6B5DD3' : '#4A4A7A',
              backgroundColor: mode === 'solo' ? 'rgba(107,93,211,.18)' : 'transparent',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 16, fontFamily: theme.fontFamily.uiAppMedium, fontWeight: '500', color: '#FBF7F0' }}>Por mi cuenta</Text>
              {mode === 'solo' ? (
                <View style={{ height: 18, width: 18, borderRadius: 99, backgroundColor: '#6B5DD3', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#FBF7F0' }}>✓</Text>
                </View>
              ) : (
                <View style={{ height: 18, width: 18, borderRadius: 99, borderWidth: 1, borderColor: '#6E6890' }} />
              )}
            </View>
            <Text style={{ fontSize: 13, lineHeight: 13 * 1.5, color: '#D6D0E4' }}>La app completa, con las guías incluidas.</Text>
          </Pressable>

          <Pressable
            onPress={() => setMode('code')}
            style={{
              gap: 12, borderRadius: 18, padding: 16,
              borderWidth: mode === 'code' ? 1.5 : 1, borderColor: mode === 'code' ? '#6B5DD3' : '#4A4A7A',
              backgroundColor: mode === 'code' ? 'rgba(107,93,211,.18)' : 'transparent',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 16, fontFamily: theme.fontFamily.uiAppMedium, fontWeight: '500', color: '#FBF7F0' }}>Tengo un código de invitación</Text>
              {mode === 'code' ? (
                <View style={{ height: 18, width: 18, borderRadius: 99, backgroundColor: '#6B5DD3', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#FBF7F0' }}>✓</Text>
                </View>
              ) : (
                <View style={{ height: 18, width: 18, borderRadius: 99, borderWidth: 1, borderColor: '#6E6890' }} />
              )}
            </View>
            <Text style={{ fontSize: 13, lineHeight: 13 * 1.5, color: '#B9B2C9' }}>Pega el link o escribe el código que te envió.</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#6E6890', backgroundColor: 'rgba(22,22,43,.6)', padding: 13, justifyContent: 'center' }}>
                <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 14, letterSpacing: 1.1, color: code ? '#FBF7F0' : '#B9B2C9' }} numberOfLines={1}>
                  {code || 'nocttua.app/c/…'}
                </Text>
              </View>
              <Pressable onPress={handlePaste} style={{ borderRadius: 12, backgroundColor: '#FBF7F0', paddingHorizontal: 14, paddingVertical: 13, justifyContent: 'center', minHeight: 44 }}>
                <Text style={{ fontSize: 14, fontFamily: theme.fontFamily.uiAppMedium, fontWeight: '500', color: '#16162B' }}>Pegar</Text>
              </Pressable>
            </View>
          </Pressable>
        </View>

        <Pressable
          onPress={handleContinue}
          disabled={loading}
          style={{ borderRadius: 14, backgroundColor: '#6B5DD3', paddingHorizontal: 16, paddingVertical: 16, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 16, fontFamily: theme.fontFamily.uiAppMedium, fontWeight: '500', color: '#FBF7F0' }}>Continuar</Text>
        </Pressable>
      </View>
    </NightCanvas>
  );
}
export default AccountTypeScreen;
