import { View, Text } from 'react-native';
import { theme } from '@nocttua/theme/native';
import { Eyebrow } from './Eyebrow';

const TONES = {
  default: theme.color.tintaFuerte,
  accent: theme.color.violeta600,
  success: theme.color.verde600,
  danger: theme.color.coral700,
};

/** StatCard — cifra grande + etiqueta. La unidad mínima de un panel Nocttua. */
export function StatCard({ value, label, hint, tone = 'default', display = false, style }) {
  return (
    <View style={[{ gap: theme.space[3], borderRadius: theme.radius['2xl'], borderWidth: 1, borderColor: theme.color.cremaLine, backgroundColor: theme.color.white, paddingHorizontal: theme.space[8], paddingVertical: theme.space[7] }, style]}>
      <Eyebrow>{label}</Eyebrow>
      <Text style={{ fontFamily: display ? theme.fontFamily.displayApp : theme.fontFamily.mono, fontSize: display ? theme.fontSize['display-md'] : theme.fontSize['display-sm'], lineHeight: (display ? theme.fontSize['display-md'] : theme.fontSize['display-sm']) * theme.lineHeight.tight, color: TONES[tone] }}>
        {value}
      </Text>
      {hint ? <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.sm, color: theme.color.tintaTenue }}>{hint}</Text> : null}
    </View>
  );
}
export default StatCard;
