import { View, Text } from 'react-native';
import { theme } from '@nocttua/theme/native';

/** BarChart — barras verticales. El gráfico por defecto de Nocttua. */
export function BarChart({ data, height = 140, highlightLast = false, showValues = true }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: theme.space[4], height }}>
      {data.map((d, i) => {
        const last = highlightLast && i === data.length - 1;
        const barHeight = Math.round((d.value / max) * (height - 34)) || 2;
        return (
          <View key={d.label + i} style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: theme.space[3] }}>
            {showValues ? <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize['2xs'], color: theme.color.tintaTenue }}>{d.display != null ? d.display : d.value}</Text> : null}
            <View style={{ width: '100%', height: barHeight, borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: d.color || (last ? theme.color.violeta600 : theme.color.violeta200) }} />
            <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize['2xs'], color: last ? theme.color.tintaFuerte : theme.color.tintaApagada }}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}
export default BarChart;
