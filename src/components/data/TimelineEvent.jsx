import { View, Text, Pressable } from 'react-native';
import { theme } from '@nocttua/theme/native';
import { Badge } from '../core/Badge';

const DOT = { a: theme.color.violeta600, b: theme.color.terracota500, both: theme.color.noche900 };

/**
 * TimelineEvent — fila del feed del día: sueño, toma, extracción.
 * La hora va en mono a la izquierda; el punto de color dice de qué bebé es.
 * `isLast` suprime el borde inferior (equivalente a :last-child en la web).
 */
export function TimelineEvent({ time, title, meta, chip, chipTone = 'accent', baby = 'a', onPress, isLast = false }) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'flex-start', gap: theme.space[7], paddingVertical: theme.space[6],
        borderBottomWidth: isLast ? 0 : 1, borderBottomColor: theme.color.cremaHairline,
      }}
    >
      <Text style={{ width: 46, paddingTop: 1, fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.sm, color: theme.color.tintaTenue }}>{time}</Text>
      <View style={{ marginTop: 7, width: 7, height: 7, borderRadius: theme.radius.pill, backgroundColor: DOT[baby] }} />
      <View style={{ flex: 1, minWidth: 0, gap: theme.space[2] }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: theme.space[4] }}>
          <Text style={{ fontFamily: theme.fontFamily.uiAppMedium, fontSize: theme.fontSize.base, fontWeight: '500', color: theme.color.tintaFuerte }}>{title}</Text>
          {chip ? <Badge tone={chipTone}>{chip}</Badge> : null}
        </View>
        {meta ? <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.sm, color: theme.color.tintaTenue }}>{meta}</Text> : null}
      </View>
    </Wrapper>
  );
}
export default TimelineEvent;
