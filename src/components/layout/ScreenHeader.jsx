import { View, Text } from 'react-native';
import { theme } from '@nocttua/theme/native';
import { Eyebrow } from '../core/Eyebrow';

/** ScreenHeader — encabezado de pantalla móvil: fecha mono + titular serif + acción. */
export function ScreenHeader({ eyebrow, title, action }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: theme.space[6] }}>
      <View style={{ gap: theme.space[2] }}>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: theme.fontSize['display-md'], lineHeight: theme.fontSize['display-md'] * theme.lineHeight.tight, color: theme.color.tintaFuerte }}>
          {title}
        </Text>
      </View>
      {action}
    </View>
  );
}
export default ScreenHeader;
