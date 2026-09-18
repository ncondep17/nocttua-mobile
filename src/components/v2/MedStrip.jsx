import { View, Text, Pressable } from 'react-native';
import { medStripCopy } from '../../lib/meds';

/**
 * Recuadro de medicinas en Sueño, justo debajo de Alimentación. MISMO peso
 * visual que ese atajo: esto es un feature secundario en una app de sueño.
 * Nunca una tarjeta abierta de forma permanente, nunca una pestaña propia.
 */
export function MedStrip({ episode, prescriptions, doses, babies, now, onOpen }) {
  const c = medStripCopy(episode, prescriptions, doses, babies, now);
  const sick = prescriptions.some((p) => p.inUse);
  return (
    <Pressable
      onPress={onOpen}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 16, backgroundColor: 'white',
        paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: sick ? '#EFCFC7' : '#E4DCD0',
      }}
    >
      <View style={{ height: 32, width: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: sick ? '#FFF1EE' : '#F6F1FB' }}>
        <Text style={{ fontSize: 14, color: sick ? '#C25F45' : '#6B5DD3' }}>✚</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 14.5, fontWeight: '500', color: '#16162B' }}>{c.title}</Text>
        <Text style={{ fontSize: 12.5, lineHeight: 12.5 * 1.35, color: '#8A8299' }}>{c.sub}</Text>
      </View>
      {sick ? (
        <View style={c.due
          ? { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#16162B' }
          : { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FBF7F0', borderWidth: 1, borderColor: '#E4DCD0' }}
        >
          <Text style={{ fontSize: 13, fontWeight: c.due ? '500' : '400', color: c.due ? '#FBF7F0' : '#8A8299' }}>{c.tag}</Text>
        </View>
      ) : (
        <Text style={{ fontSize: 15, color: '#A9A2B5' }}>→</Text>
      )}
    </Pressable>
  );
}
