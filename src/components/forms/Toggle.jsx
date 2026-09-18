import { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { theme } from '@nocttua/theme/native';

/** Toggle — sí/no ("Le tocaba esta toma", "Se durmió durante la toma"). */
export function Toggle({ checked = false, onChange, label, hint }) {
  const anim = useRef(new Animated.Value(checked ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: checked ? 1 : 0, duration: theme.duration.fast, useNativeDriver: false }).start();
  }, [checked, anim]);

  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.space[7],
        borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.color.cremaLine, backgroundColor: theme.color.cremaPaper,
        paddingHorizontal: theme.space[7], paddingVertical: theme.space[6],
      }}
    >
      <View style={{ gap: theme.space[1], flexShrink: 1 }}>
        <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.base, color: theme.color.tintaCuerpo }}>{label}</Text>
        {hint ? <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.sm, color: theme.color.tintaTenue }}>{hint}</Text> : null}
      </View>
      <Pressable
        onPress={onChange}
        accessibilityRole="switch"
        accessibilityState={{ checked }}
        style={{ width: 46, height: 26, borderRadius: theme.radius.pill, justifyContent: 'center' }}
      >
        <Animated.View
          style={{
            ...(theme.radius.pill ? { borderRadius: theme.radius.pill } : {}),
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: anim.interpolate({ inputRange: [0, 1], outputRange: [theme.color.cremaLineStrong, theme.color.violeta600] }),
          }}
        />
        <Animated.View
          style={{
            width: 20, height: 20, borderRadius: theme.radius.pill, backgroundColor: theme.color.white,
            transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [3, 23] }) }],
          }}
        />
      </Pressable>
    </View>
  );
}
export default Toggle;
