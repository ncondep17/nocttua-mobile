import { View, Text } from 'react-native';
import { theme } from '@nocttua/theme/native';

const TONES = {
  neutral: { bg: theme.color.cremaSand, text: theme.color.tintaSuave },
  accent: { bg: theme.color.violeta100, text: theme.color.violeta600 },
  success: { bg: theme.color.verde100, text: theme.color.verde600 },
  warning: { bg: theme.color.ambar100, text: theme.color.ambar700 },
  danger: { bg: theme.color.coral100, text: theme.color.coral700 },
  night: { bg: theme.color.noche800, text: theme.color.cremaPaper },
};

/** Badge — píldora de estado (Pagado, Pendiente, Acceso total…). */
export function Badge({ tone = 'neutral', children }) {
  const t = TONES[tone];
  return (
    <View style={{ backgroundColor: t.bg, borderRadius: theme.radius.pill, paddingHorizontal: theme.space[5], paddingVertical: theme.space[1] }}>
      <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.xs, color: t.text }}>{children}</Text>
    </View>
  );
}
export default Badge;
