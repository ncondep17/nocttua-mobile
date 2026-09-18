import { View, Text, Pressable } from 'react-native';
import { theme } from '@nocttua/theme/native';
import { useHoldRepeat } from '../../lib/useHoldRepeat';

/** Stepper — ±paso para horas, duraciones y cantidades. Se usa con una mano, sin teclado. */
export function Stepper({ label, value, onDecrement, onIncrement, dark = false, style }) {
  const btnStyle = {
    height: 44, width: 44, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.pill, borderWidth: 1,
    borderColor: dark ? theme.color.noche600 : theme.color.cremaLineStrong,
  };
  const btnTextColor = dark ? theme.color.cremaPaper : theme.color.tintaCuerpo;
  const dec = useHoldRepeat(onDecrement);
  const inc = useHoldRepeat(onIncrement);
  return (
    <View style={[{ gap: theme.space[4] }, style]}>
      {label ? <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.sm, color: dark ? theme.color.sobreNocheSuave : theme.color.tintaTenue }}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[6] }}>
        <Pressable {...dec} accessibilityLabel="Restar" style={btnStyle}>
          <Text style={{ fontSize: theme.fontSize.lg, color: btnTextColor }}>−</Text>
        </Pressable>
        <Text style={{ flex: 1, textAlign: 'center', fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xl, color: dark ? theme.color.cremaPaper : theme.color.tintaFuerte }}>
          {value}
        </Text>
        <Pressable {...inc} accessibilityLabel="Sumar" style={btnStyle}>
          <Text style={{ fontSize: theme.fontSize.lg, color: btnTextColor }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}
export default Stepper;
