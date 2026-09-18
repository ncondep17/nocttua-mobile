import { View, Text } from 'react-native';
import { theme } from '@nocttua/theme/native';
import { Eyebrow } from '../core/Eyebrow';

/**
 * WindowCountdown — la tarjeta noche que corona la pantalla Hoy.
 * Responde la única pregunta de las 3 a.m.: cuánto falta para la próxima ventana.
 */
export function WindowCountdown({ eyebrow = 'Próxima ventana', baby, time, remaining, note, action, style }) {
  return (
    <View
      style={[
        { gap: theme.space[7], borderRadius: theme.radius['3xl'], backgroundColor: theme.color.noche900, paddingHorizontal: theme.space[10], paddingVertical: theme.space[9] },
        theme.elevation.raised,
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.space[6] }}>
        <Eyebrow tone="night">{eyebrow}</Eyebrow>
        {baby ? <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.sm, color: theme.color.sobreNocheSuave }}>{baby}</Text> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: theme.space[6] }}>
        <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: theme.fontSize['display-lg'], lineHeight: theme.fontSize['display-lg'] * theme.lineHeight.tight, color: theme.color.cremaPaper }}>
          {time}
        </Text>
        {remaining ? <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.base, color: theme.color.ambar500 }}>{remaining}</Text> : null}
      </View>
      {note ? (
        <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.base, lineHeight: theme.fontSize.base * theme.lineHeight.relaxed, color: theme.color.sobreNocheSuave }}>
          {note}
        </Text>
      ) : null}
      {action}
    </View>
  );
}
export default WindowCountdown;
