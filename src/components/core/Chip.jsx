import { Pressable, Text } from 'react-native';
import { theme } from '@nocttua/theme/native';

/** Chip — opción seleccionable de una hoja de registro (lugar, factores, contacto). */
export function Chip({ selected = false, onPress, children }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityState={{ selected }}
      style={{
        borderRadius: theme.radius.pill,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? theme.color.violeta600 : theme.color.cremaLineStrong,
        backgroundColor: selected ? theme.color.violeta50 : theme.color.white,
        paddingHorizontal: theme.space[7],
        paddingVertical: theme.space[4],
        minHeight: 38,
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.base, color: selected ? theme.color.violeta600 : theme.color.tintaCuerpo }}>
        {children}
      </Text>
    </Pressable>
  );
}
export default Chip;
