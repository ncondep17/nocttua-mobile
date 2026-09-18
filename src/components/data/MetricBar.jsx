import { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { theme } from '@nocttua/theme/native';

const TONES = {
  accent: theme.color.violeta600, success: theme.color.verde600, warning: theme.color.ambar500,
  danger: theme.color.coral500, neutral: theme.color.tintaApagada,
};

/** MetricBar — etiqueta + barra + valor: adherencia, correlaciones, resultados por edad. */
export function MetricBar({ label, value, pct = 0, tone = 'accent', caption }) {
  const anim = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(100, pct));

  useEffect(() => {
    Animated.timing(anim, { toValue: clamped, duration: theme.duration.chart, useNativeDriver: false }).start();
  }, [clamped, anim]);

  return (
    <View style={{ gap: theme.space[4] }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: theme.space[6] }}>
        <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.base, color: theme.color.tintaCuerpo }}>{label}</Text>
        {value != null ? <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.base, color: theme.color.tintaFuerte }}>{value}</Text> : null}
      </View>
      <View style={{ height: 7, borderRadius: theme.radius.pill, backgroundColor: theme.color.cremaSand, overflow: 'hidden' }}>
        <Animated.View style={{ height: '100%', borderRadius: theme.radius.pill, backgroundColor: TONES[tone], width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }} />
      </View>
      {caption ? <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.sm, color: theme.color.tintaTenue }}>{caption}</Text> : null}
    </View>
  );
}
export default MetricBar;
