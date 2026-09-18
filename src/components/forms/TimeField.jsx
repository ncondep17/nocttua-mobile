import { useState } from 'react';
import { Platform, View, Text, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '@nocttua/theme/native';

const fmt = (d) => d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

/**
 * TimeField — selector de hora nativo (rueda/reloj del sistema), para elegir
 * cualquier horario de un toque en vez de sumar de a minutos con un Stepper.
 */
export function TimeField({ label, value, onChange, dark = false, minuteInterval }) {
  const [showAndroid, setShowAndroid] = useState(false);
  const labelColor = dark ? theme.color.sobreNocheSuave : theme.color.tintaTenue;

  if (Platform.OS === 'ios') {
    return (
      <View style={{ gap: theme.space[4] }}>
        {label ? <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.sm, color: labelColor }}>{label}</Text> : null}
        <DateTimePicker
          value={value}
          mode="time"
          display="compact"
          themeVariant={dark ? 'dark' : 'light'}
          minuteInterval={minuteInterval}
          onChange={(_, selected) => selected && onChange(selected)}
        />
      </View>
    );
  }

  return (
    <View style={{ gap: theme.space[4] }}>
      {label ? <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.sm, color: labelColor }}>{label}</Text> : null}
      <Pressable
        onPress={() => setShowAndroid(true)}
        style={{ borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.color.cremaLineStrong, backgroundColor: theme.color.white, paddingHorizontal: theme.space[7], paddingVertical: theme.space[6] }}
      >
        <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.base, color: theme.color.tintaFuerte }}>{fmt(value)}</Text>
      </Pressable>
      {showAndroid ? (
        <DateTimePicker
          value={value}
          mode="time"
          display="default"
          minuteInterval={minuteInterval}
          onChange={(_, selected) => {
            setShowAndroid(false);
            if (selected) onChange(selected);
          }}
        />
      ) : null}
    </View>
  );
}
export default TimeField;
