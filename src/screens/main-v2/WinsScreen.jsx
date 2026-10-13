import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@nocttua/theme/native';
import { getMilestoneLog } from '../../lib/milestoneLog';

function relativeDay(iso) {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

/** "Ver otros wins" — lista simple de los hitos que ya se celebraron (ver milestones.js/milestoneLog.js). Solo lee storage local, no toca la base. */
export function WinsScreen({ onClose }) {
  const insets = useSafeAreaInsets();
  const [log, setLog] = useState(null);

  useEffect(() => {
    getMilestoneLog().then(setLog);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#FBF7F0' }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 16 + insets.top, paddingBottom: 30 + insets.bottom, gap: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 28, color: '#16162B' }}>Tus wins</Text>
          <Pressable onPress={onClose}><Text style={{ fontSize: 15, color: '#6B5DD3' }}>Cerrar</Text></Pressable>
        </View>

        {log === null ? null : log.length === 0 ? (
          <Text style={{ fontSize: 13.5, color: '#8A8299' }}>Todavía no hay ninguno — sigue registrando, acá van a ir apareciendo.</Text>
        ) : (
          log.map((m) => (
            <View key={m.id} style={{ borderRadius: 16, backgroundColor: '#16162B', padding: 15, gap: 6 }}>
              <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 9.5, letterSpacing: 1.2, textTransform: 'uppercase', color: '#F0A868' }}>
                {relativeDay(m.achievedAt)}
              </Text>
              <Text style={{ fontSize: 15, lineHeight: 15 * 1.35, color: '#FBF7F0' }}>{m.text}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
export default WinsScreen;
