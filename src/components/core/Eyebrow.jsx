import { Text } from 'react-native';
import { theme } from '@nocttua/theme/native';

const TONES = {
  muted: theme.color.tintaTenue,
  accent: theme.color.violeta600,
  warm: theme.color.ambar700,
  night: theme.color.sobreNocheTenue,
  good: theme.color.verde600,
};

/** Etiqueta mono en versalitas. El recurso tipográfico de la marca. */
export function Eyebrow({ tone = 'muted', wide = false, children, style }) {
  const tracking = (wide ? theme.eyebrow.trackingWide : theme.eyebrow.tracking) * theme.fontSize.xs;
  return (
    <Text
      style={[
        {
          fontFamily: theme.fontFamily.mono,
          fontSize: theme.fontSize.xs,
          letterSpacing: tracking,
          textTransform: 'uppercase',
          color: TONES[tone],
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export default Eyebrow;
