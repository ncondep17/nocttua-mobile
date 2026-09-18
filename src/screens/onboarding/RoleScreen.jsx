import { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@nocttua/theme/native';
import { NightCanvas, Headline, CreamButton, BACKGROUNDS } from './chrome/OnboardingChrome';
import { setMyRelationship } from '../../data/family';

const OPTIONS = [
  { id: 'mama', label: 'Mamá' },
  { id: 'papa', label: 'Papá' },
  { id: 'ninera', label: 'Niñera' },
  { id: 'otro', label: 'Otro' },
];

/**
 * Paso extra tras vincularse con un código (09, camino "código"): en Equipo
 * la persona aparecía genéricamente como "Cuidador/a" sin distinguir quién
 * es quién — esto lo resuelve con un dato real en vez de un rol fijo.
 */
export function RoleScreen({ onDone }) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    try {
      setLoading(true);
      if (selected) await setMyRelationship(selected);
      onDone();
    } catch (err) {
      Alert.alert('No se pudo guardar', err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <NightCanvas variant={BACKGROUNDS.noche}>
      <View style={{ flex: 1, justifyContent: 'center', gap: 24, paddingHorizontal: 26, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <Headline title="¿Cuál es tu rol?" body="Así te vas a ver en Equipo, para el resto de la família." />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {OPTIONS.map((o) => {
            const on = selected === o.id;
            return (
              <Pressable
                key={o.id}
                onPress={() => setSelected(o.id)}
                style={{
                  borderRadius: 99, paddingHorizontal: 20, paddingVertical: 13, minHeight: 44, justifyContent: 'center',
                  borderWidth: on ? 1.5 : 1, borderColor: on ? '#6B5DD3' : '#4A4A7A',
                  backgroundColor: on ? 'rgba(107,93,211,.18)' : 'transparent',
                }}
              >
                <Text style={{ fontSize: 15, color: '#FBF7F0' }}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <CreamButton onPress={handleContinue} style={loading ? { opacity: 0.6 } : null}>Continuar</CreamButton>
      </View>
    </NightCanvas>
  );
}
export default RoleScreen;
