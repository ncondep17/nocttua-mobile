import { useState } from 'react';
import { Platform, View, Text, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '@nocttua/theme/native';

const fmt = (d) => d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** DateField — selector de fecha nativo (nacimiento del bebé, etc). */
export function DateField({ label, value, onChange }) {
  const [show, setShow] = useState(false);

  if (Platform.OS === 'ios') {
    return (
      <View style={{ gap: theme.space[4] }}>
        {label ? <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.sm, color: theme.color.tintaTenue }}>{label}</Text> : null}
        <DateTimePicker
          value={value}
          mode="date"
          display="compact"
          maximumDate={new Date()}
          onChange={(_, selected) => selected && onChange(selected)}
        />
      </View>
    );
  }

  return (
    <View style={{ gap: theme.space[4] }}>
      {label ? <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.sm, color: theme.color.tintaTenue }}>{label}</Text> : null}
      <Pressable
        onPress={() => setShow(true)}
        style={{ borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.color.cremaLineStrong, backgroundColor: theme.color.white, paddingHorizontal: theme.space[7], paddingVertical: theme.space[6] }}
      >
        <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.base, color: theme.color.tintaFuerte }}>{fmt(value)}</Text>
      </Pressable>
      {show ? (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(_, selected) => {
            setShow(false);
            if (selected) onChange(selected);
          }}
        />
      ) : null}
    </View>
  );
}
export default DateField;
