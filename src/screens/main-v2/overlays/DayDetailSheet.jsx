import { View, Text, Pressable } from 'react-native';
import { theme } from '@nocttua/theme/native';
import { Eyebrow, PrimaryButton } from '../../../components/v2/primitives';
import { SheetV2 } from '../../../components/v2/MobileChrome';

/**
 * Detalle de un día — se abre al tocar una fila del mapa de la semana.
 * Cada tiempo exacto de esa jornada, con el veredicto arriba en verde o ámbar.
 */
export function DayDetailSheet({ open, detail, onClose }) {
  if (!detail) return null;
  return (
    <SheetV2 open={open} onClose={onClose} maxH="88%">
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <View>
          <Eyebrow>{detail.weekday}</Eyebrow>
          <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 26, lineHeight: 26 * 1.15, color: '#16162B' }}>{detail.title}</Text>
        </View>
        <Text onPress={onClose} style={{ fontSize: 15, color: '#8A8299' }}>Cerrar</Text>
      </View>

      <View style={{
        borderRadius: 13, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 12,
        backgroundColor: detail.good ? '#F3F7F4' : '#FFF3E3', borderColor: detail.good ? '#C9DED4' : '#EFCFA4',
      }}>
        <Text style={{ fontSize: 15, lineHeight: 15 * 1.45, color: '#4A4459' }}>{detail.verdict}</Text>
      </View>

      <View style={{ gap: 2 }}>
        {detail.rows.map((r) => (
          <View key={r.label} style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F0EAE0', paddingVertical: 9 }}>
            <Text style={{ fontSize: 14.5, color: '#4A4459' }}>{r.label}</Text>
            <Text style={{ color: r.tone, textAlign: 'right', fontFamily: theme.fontFamily.mono, fontSize: 15 }}>{r.value}</Text>
          </View>
        ))}
      </View>

      <View style={{ gap: 7, borderRadius: 14, borderWidth: 1, borderColor: '#E4DCD0', backgroundColor: '#FBF7F0', paddingHorizontal: 13, paddingVertical: 12 }}>
        <Eyebrow tracking={0.08}>Contexto</Eyebrow>
        <Text style={{ fontSize: 14.5, lineHeight: 14.5 * 1.5, color: '#4A4459' }}>{detail.context}</Text>
      </View>

      <PrimaryButton onPress={onClose}>Volver a la semana</PrimaryButton>
    </SheetV2>
  );
}
export default DayDetailSheet;
