import { ScrollView, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@nocttua/theme/native';

/** ScreenScroll — cuerpo scrolleable de una pantalla móvil, con el respiro del sistema. */
export function ScreenScroll({ children, style }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={[{ flex: 1 }, style]}
      contentContainerStyle={{ gap: theme.space[7], paddingHorizontal: theme.space[9], paddingBottom: theme.space[9], paddingTop: theme.space[6] + insets.top }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      onScrollBeginDrag={Keyboard.dismiss}
    >
      {children}
    </ScrollView>
  );
}
export default ScreenScroll;
