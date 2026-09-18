import { View, Text, Pressable } from 'react-native';
import { theme } from '@nocttua/theme/native';

/** ListRow — fila de lista tocable: cliente, integrante del equipo, evento del feed. */
export function ListRow({ leading, title, subtitle, trailing, onPress }) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: theme.space[7],
        borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.color.cremaLine,
        backgroundColor: theme.color.white, paddingHorizontal: theme.space[8], paddingVertical: theme.space[7],
      }}
    >
      {leading}
      <View style={{ flex: 1, minWidth: 0, gap: theme.space[1] }}>
        <Text numberOfLines={1} style={{ fontFamily: theme.fontFamily.uiAppMedium, fontSize: theme.fontSize.md, fontWeight: '500', color: theme.color.tintaFuerte }}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.sm, color: theme.color.tintaTenue }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </Wrapper>
  );
}

const AVATAR_TONES = {
  a: { bg: theme.color.violeta100, text: theme.color.violeta600 },
  b: { bg: theme.color.terracota100, text: theme.color.terracota500 },
  neutral: { bg: theme.color.cremaSand, text: theme.color.tintaSuave },
  good: { bg: theme.color.verde100, text: theme.color.verde600 },
};

/** Avatar circular con inicial. Bebé A violeta, bebé B terracota. */
export function Avatar({ initial, tone = 'a', size = 34 }) {
  const t = AVATAR_TONES[tone];
  return (
    <View style={{ width: size, height: size, borderRadius: theme.radius.pill, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: theme.fontFamily.uiAppMedium, fontSize: theme.fontSize.sm, fontWeight: '500', color: t.text }}>{initial}</Text>
    </View>
  );
}
export default ListRow;
