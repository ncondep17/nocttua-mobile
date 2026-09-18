import { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';
import { theme } from '@nocttua/theme/native';

/** Toast — confirmación breve, flota sobre la TabBar. Requiere un contenedor padre `position: relative`. */
export function Toast({ open, children }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: open ? 1 : 0, duration: theme.duration.base, useNativeDriver: true }).start();
  }, [open, anim]);

  if (!open) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute', left: theme.space[9], right: theme.space[9], bottom: 96,
          borderRadius: theme.radius.md, backgroundColor: theme.color.noche900,
          paddingHorizontal: theme.space[8], paddingVertical: theme.space[6],
          opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
        },
        theme.elevation.raised,
      ]}
    >
      <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.base, lineHeight: theme.fontSize.base * theme.lineHeight.normal, color: theme.color.cremaPaper }}>
        {children}
      </Text>
    </Animated.View>
  );
}
export default Toast;
