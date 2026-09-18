import { View, Text, TextInput, Keyboard } from 'react-native';
import { theme } from '@nocttua/theme/native';

const fieldBase = {
  borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.color.cremaLineStrong, backgroundColor: theme.color.white,
  paddingHorizontal: theme.space[7], paddingVertical: theme.space[6], fontSize: theme.fontSize.base, color: theme.color.tintaFuerte,
};

/** TextArea — nota libre de una hoja de registro o de un plan. */
export function TextArea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <View style={{ gap: theme.space[4] }}>
      {label ? <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.sm, color: theme.color.tintaTenue }}>{label}</Text> : null}
      <TextInput
        multiline
        numberOfLines={rows}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={theme.color.tintaApagada}
        onChangeText={onChange}
        returnKeyType="default"
        blurOnSubmit={false}
        style={[fieldBase, { fontFamily: theme.fontFamily.uiApp, minHeight: rows * 22, textAlignVertical: 'top' }]}
      />
    </View>
  );
}

/** TextField — una línea. Misma piel que TextArea. */
export function TextField({ label, value, onChange, placeholder, mono = false }) {
  return (
    <View style={{ gap: theme.space[4] }}>
      {label ? <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.sm, color: theme.color.tintaTenue }}>{label}</Text> : null}
      <TextInput
        value={value}
        placeholder={placeholder}
        placeholderTextColor={theme.color.tintaApagada}
        onChangeText={onChange}
        returnKeyType="done"
        blurOnSubmit
        onSubmitEditing={() => Keyboard.dismiss()}
        style={[fieldBase, { fontFamily: mono ? theme.fontFamily.mono : theme.fontFamily.uiApp, letterSpacing: mono ? 1 : 0 }]}
      />
    </View>
  );
}
export default TextArea;
