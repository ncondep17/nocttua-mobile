import { View, Text, Pressable } from 'react-native';
import { theme } from '@nocttua/theme/native';

/** SegmentedControl — filtro de 2-4 opciones. Vive en el hueco crema hundido. */
export function SegmentedControl({ items, active, onSelect }) {
  return (
    <View style={{ flexDirection: 'row', alignSelf: 'flex-start', gap: theme.space[1], borderRadius: theme.radius.sm, backgroundColor: theme.color.cremaSand, padding: theme.space[1] }}>
      {items.map((it) => {
        const on = active === it.id;
        return (
          <Pressable
            key={it.id}
            onPress={() => onSelect && onSelect(it.id)}
            style={[
              { borderRadius: 7, paddingHorizontal: theme.space[7], paddingVertical: theme.space[4], backgroundColor: on ? theme.color.white : 'transparent' },
              on ? theme.elevation.card : null,
            ]}
          >
            <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.base, color: on ? theme.color.tintaFuerte : theme.color.tintaSuave }}>{it.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
export default SegmentedControl;
