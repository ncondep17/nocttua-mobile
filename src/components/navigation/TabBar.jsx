import { View, Text, Pressable } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@nocttua/theme/native';

/** Paths 1:1 del handoff (sección "Barra de pestañas", stroke-width 1.7, viewBox 24×24). */
const ICONS = {
  hoy: (c) => (
    <>
      <Rect x={4} y={5} width={16} height={15} rx={3} stroke={c} strokeWidth={1.7} fill="none" />
      <Path d="M8 3v3M16 3v3M4 10h16" stroke={c} strokeWidth={1.7} strokeLinecap="round" />
    </>
  ),
  noche: (c) => (
    <>
      <Path d="M4 12a8 8 0 1 0 2.4-5.7" stroke={c} strokeWidth={1.7} strokeLinecap="round" fill="none" />
      <Path d="M4 5v4h4" stroke={c} strokeWidth={1.7} strokeLinecap="round" fill="none" />
      <Path d="M12 8.5V12l2.5 1.6" stroke={c} strokeWidth={1.7} strokeLinecap="round" fill="none" />
    </>
  ),
  datos: (c) => <Path d="M5 19V9M10 19V5M15 19v-7M20 19v-4" stroke={c} strokeWidth={1.7} strokeLinecap="round" />,
  equipo: (c) => (
    <>
      <Circle cx={9} cy={8} r={3.2} stroke={c} strokeWidth={1.7} fill="none" />
      <Path d="M3.5 19.5c.6-3.2 2.8-4.8 5.5-4.8s4.9 1.6 5.5 4.8" stroke={c} strokeWidth={1.7} strokeLinecap="round" fill="none" />
      <Path d="M16.5 6.2a3 3 0 0 1 0 5.6M18.4 19.5c-.2-1.7-.7-3-1.6-3.9" stroke={c} strokeWidth={1.7} strokeLinecap="round" fill="none" />
    </>
  ),
  plus: (c) => <Path d="M12 5v14M5 12h14" stroke={c} strokeWidth={1.9} strokeLinecap="round" />,
};

/** TabBar — barra de pestañas fija al pie del teléfono. Toque mínimo 44px. */
export function TabBar({ items, active, onSelect }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
        borderTopWidth: 1, borderTopColor: theme.color.cremaLine, backgroundColor: theme.color.cremaBar ?? '#F5F1E8',
        paddingHorizontal: theme.space[6], paddingTop: theme.space[6], paddingBottom: theme.space[7] + insets.bottom,
      }}
    >
      {items.map((it) => {
        const on = active === it.id;
        if (it.elevated) {
          return (
            <Pressable
              key={it.id}
              onPress={() => onSelect && onSelect(it)}
              style={{
                width: 56, height: 56, borderRadius: 99, backgroundColor: '#16162B', alignItems: 'center', justifyContent: 'center',
                marginTop: -22, shadowColor: '#16162B', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
              }}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24">{ICONS.plus('#F0A868')}</Svg>
            </Pressable>
          );
        }
        const color = on ? '#6B5DD3' : '#9A93A8';
        return (
          <Pressable
            key={it.id}
            onPress={() => onSelect && onSelect(it)}
            style={{ minHeight: theme.hit.min, minWidth: 56, alignItems: 'center', justifyContent: 'center', gap: theme.space[1] }}
          >
            <Svg width={21} height={21} viewBox="0 0 24 24">{ICONS[it.kind](color)}</Svg>
            <Text style={{ fontFamily: theme.fontFamily.mono, fontWeight: on ? '600' : '400', fontSize: 9, letterSpacing: 0.6, textTransform: 'uppercase', color }}>
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
export default TabBar;
