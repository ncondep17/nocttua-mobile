import { View, Text, Pressable } from 'react-native';
import { theme } from '@nocttua/theme/native';
import { Eyebrow } from './Eyebrow';

const SURFACES = {
  white: { bg: theme.color.white, border: theme.color.cremaLine },
  cream: { bg: theme.color.cremaPaper, border: theme.color.cremaLine },
  night: { bg: theme.color.noche900, border: theme.color.noche600 },
  accent: { bg: theme.color.violeta50, border: theme.color.violeta200 },
  warm: { bg: theme.color.ambar50, border: theme.color.ambar200 },
  good: { bg: theme.color.verde50, border: theme.color.verde200 },
};

/** Card — el contenedor base del sistema. */
export function Card({ surface = 'white', title, eyebrow, action, compact = false, children, onPress, style }) {
  const night = surface === 'night';
  const s = SURFACES[surface];
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      style={[
        {
          gap: theme.space[6],
          borderRadius: theme.radius['2xl'],
          borderWidth: 1,
          borderColor: s.border,
          backgroundColor: s.bg,
          paddingHorizontal: compact ? theme.space[8] : theme.space[10],
          paddingVertical: compact ? theme.space[7] : theme.space[9],
        },
        style,
      ]}
    >
      {(eyebrow || title || action) ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.space[6] }}>
          <View style={{ gap: theme.space[2], flexShrink: 1 }}>
            {eyebrow ? <Eyebrow tone={night ? 'night' : 'muted'}>{eyebrow}</Eyebrow> : null}
            {title ? (
              <Text style={{ fontFamily: theme.fontFamily.uiAppMedium, fontSize: theme.fontSize.lg, fontWeight: '500', color: night ? theme.color.cremaPaper : theme.color.tintaFuerte }}>
                {title}
              </Text>
            ) : null}
          </View>
          {action}
        </View>
      ) : null}
      {children}
    </Wrapper>
  );
}
export default Card;
