import { Pressable, Text, View, StyleSheet } from 'react-native';
import { theme } from '@nocttua/theme/native';

const VARIANTS = {
  primary: { bg: theme.color.noche900, text: theme.color.cremaPaper, border: 'transparent' },
  amber: { bg: theme.color.ambar500, text: theme.color.noche900, border: 'transparent' },
  secondary: { bg: theme.color.white, text: theme.color.tintaCuerpo, border: theme.color.cremaLineStrong },
  ghost: { bg: 'transparent', text: theme.color.violeta600, border: 'transparent' },
  danger: { bg: theme.color.white, text: theme.color.coral700, border: '#E3A6A6' },
};
const SIZES = {
  sm: { paddingHorizontal: theme.space[6], paddingVertical: theme.space[4], minHeight: 36, fontSize: theme.fontSize.sm },
  md: { paddingHorizontal: theme.space[8], paddingVertical: theme.space[6], minHeight: theme.hit.min, fontSize: theme.fontSize.md },
  lg: { paddingHorizontal: theme.space[9], paddingVertical: theme.space[7], minHeight: theme.hit.large, fontSize: 16.5 },
};

/** Button — variantes primary (noche), amber (señal), secondary, ghost, danger. Altura mínima 44px siempre. */
export function Button({ variant = 'primary', size = 'md', full = false, disabled = false, icon, children, onPress, style }) {
  const v = disabled ? { bg: theme.color.cremaSand, text: theme.color.tintaApagada, border: 'transparent' } : VARIANTS[variant];
  const s = SIZES[size];
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          paddingHorizontal: s.paddingHorizontal,
          paddingVertical: s.paddingVertical,
          minHeight: s.minHeight,
          opacity: pressed ? 0.85 : 1,
          width: full ? '100%' : undefined,
        },
        style,
      ]}
    >
      {icon ? <View>{icon}</View> : null}
      <Text style={{ fontFamily: theme.fontFamily.uiAppMedium, fontWeight: '500', fontSize: s.fontSize, color: v.text }}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[4],
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
});

export default Button;
