import { View, Pressable, Text } from 'react-native';
import { DateField } from './DateField';
import { addDays, daysBetween, startOfDay } from '../../lib/dates';

function DayChip({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 13, paddingVertical: 9, borderRadius: 99, minHeight: 40, alignItems: 'center', justifyContent: 'center',
        backgroundColor: selected ? '#16162B' : '#FBF7F0', borderWidth: 1, borderColor: selected ? '#16162B' : '#DCD4C8',
      }}
    >
      <Text style={{ fontSize: 14.5, color: selected ? '#FBF7F0' : '#4A4459' }}>{label}</Text>
    </Pressable>
  );
}

/**
 * Hoy / ayer / otro día — para poder cargar un registro atrasado (se te
 * olvidó ayer) sin perder el seguimiento. `day` es la fecha de referencia
 * del registro; quien lo usa se encarga de correr las horas ya elegidas la
 * misma cantidad de días cuando cambia (ver addDays en cada hoja).
 */
export function DayPicker({ day, onChange }) {
  const today = startOfDay(new Date());
  const diff = daysBetween(day, today); // day - today: ayer da -1, no +1
  const isToday = diff === 0;
  const isYesterday = diff === -1;
  const isOther = !isToday && !isYesterday;

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 7 }}>
        <DayChip label="Hoy" selected={isToday} onPress={() => onChange(today)} />
        <DayChip label="Ayer" selected={isYesterday} onPress={() => onChange(addDays(today, -1))} />
        <DayChip label="Otro día" selected={isOther} onPress={() => onChange(addDays(today, -2))} />
      </View>
      {isOther ? <DateField label="Fecha del registro" value={day} onChange={onChange} /> : null}
    </View>
  );
}
export default DayPicker;
