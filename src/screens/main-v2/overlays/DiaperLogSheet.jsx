import { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert, TextInput } from 'react-native';
import { theme } from '@nocttua/theme/native';
import { Chip, GroupLabel, PrimaryButton, GhostButton, DangerButton, CategoryIcon } from '../../../components/v2/primitives';
import { SheetV2 } from '../../../components/v2/MobileChrome';
import { TimeField } from '../../../components/forms/TimeField';
import { DayPicker } from '../../../components/forms/DayPicker';
import { addDays, daysBetween, startOfDay } from '../../../lib/dates';

// El valor guardado se queda igual que siempre ('Pipí y popó') porque
// TodayScreen cuenta pipís/popós buscando esas palabras como substring del
// kind guardado — si acá se guardara literal "Las dos cosas", un pañal
// combinado dejaría de sumar en los dos conteos. Solo la ETIQUETA del chip
// cambia, mismo patrón que genderLabel() para moods/contexto.
const DIAPER_KINDS = [
  { value: 'Pipí', label: 'Pipí' },
  { value: 'Popó', label: 'Popó' },
  { value: 'Pipí y popó', label: 'Las dos cosas' },
  { value: 'Seco', label: 'Seco' },
];

/**
 * Registro de pañales — solo relevante 0-3 meses, cuando pipí/popó es de lo
 * primero que pregunta el pediatra para saber si el bebé está bien
 * alimentado e hidratado. TodayScreen decide si mostrar la entrada según la
 * franja de edad; esta hoja no sabe nada de eso, solo guarda el registro.
 *
 * Compacta para cargar rápido: día/hora y comentario quedan detrás de
 * "Agregar más detalles", en su valor por defecto ("ahora", sin comentario)
 * si nunca se abre esa sección.
 */
export function DiaperLogSheet({ open, babies, initialBaby = 0, editing = null, onClose, onSave, onSaveBoth, onDelete }) {
  const [day, setDay] = useState(startOfDay(new Date()));
  const [time, setTime] = useState(new Date());
  const [who, setWho] = useState(0);
  const [kind, setKind] = useState('Pipí');
  const [note, setNote] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDay(startOfDay(editing ? new Date(editing.started_at) : new Date()));
    setTime(editing ? new Date(editing.started_at) : new Date());
    setWho(editing ? Math.max(0, babies.findIndex((b) => b.id === editing.baby_id)) : initialBaby);
    setKind(editing?.kind ?? 'Pipí');
    setNote(editing?.note ?? '');
    setShowDetails(!!editing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, initialBaby]);

  const handleDayChange = (newDay) => {
    const delta = daysBetween(newDay, day);
    if (delta === 0) return;
    setDay(newDay);
    setTime((t) => addDays(t, delta));
  };

  const isToday = daysBetween(day, startOfDay(new Date())) === 0;
  const timeLabel = time.getHours() + ':' + String(time.getMinutes()).padStart(2, '0');
  const payload = (babyId) => ({ babyId, type: 'diaper', startedAt: time.toISOString(), kind, note: note.trim() || undefined });

  const confirmDelete = () => {
    Alert.alert('¿Borrar este registro?', 'No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => onDelete && onDelete() },
    ]);
  };

  return (
    <SheetV2
      open={open}
      onClose={onClose}
      footer={
        <>
          <PrimaryButton style={{ flex: 1 }} onPress={() => onSave && onSave(payload(babies[who]?.id))}>Guardar el pañal</PrimaryButton>
          {!editing && babies.length > 1 ? <GhostButton onPress={() => onSaveBoth && onSaveBoth(payload(null))}>Aplicar{'\n'}a ambas</GhostButton> : null}
        </>
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
        <CategoryIcon category="panal" size={40} />
        <View style={{ flex: 1, gap: 1 }}>
          <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 23, lineHeight: 23 * 1.05, color: '#16162B' }}>
            {editing ? 'Editar pañal' : 'Registrar pañal'}
          </Text>
          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: '#8A8299' }}>
            {(babies[who]?.name ?? '').toUpperCase() + ' · ' + (isToday ? 'HOY' : 'OTRO DÍA') + ' ' + timeLabel}
          </Text>
        </View>
        <Text onPress={onClose} style={{ fontSize: 13, color: '#6B5DD3' }}>Cerrar</Text>
      </View>

      {babies.length > 1 ? (
        <View style={{ flexDirection: 'row', gap: 7 }}>
          {babies.map((baby, i) => <Chip key={baby.id} selected={who === i} onPress={() => setWho(i)}>{baby.name}</Chip>)}
        </View>
      ) : null}

      <View style={{ gap: 8 }}>
        <GroupLabel>Qué había</GroupLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          {DIAPER_KINDS.map((x) => <Chip key={x.value} selected={kind === x.value} onPress={() => setKind(x.value)}>{x.label}</Chip>)}
        </View>
      </View>

      <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 12, color: '#8A8299' }}>
        {(DIAPER_KINDS.find((x) => x.value === kind)?.label ?? kind) + ' · ' + (isToday ? 'ahora' : timeLabel) + ' · ' + (babies[who]?.name ?? '')}
      </Text>

      <Pressable onPress={() => setShowDetails((v) => !v)} style={{ paddingVertical: 4 }}>
        <Text style={{ fontSize: 13, color: '#6B5DD3' }}>{showDetails ? 'Ocultar detalles' : '+ Agregar más detalles'}</Text>
      </Pressable>

      {showDetails ? (
        <View style={{ gap: 13, borderTopWidth: 1, borderTopColor: '#F0EAE0', paddingTop: 13 }}>
          <DayPicker day={day} onChange={handleDayChange} />
          <TimeField label="Hora" value={time} onChange={setTime} />

          <View style={{ gap: 8 }}>
            <GroupLabel>Comentario (opcional)</GroupLabel>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Ej. tiene diarrea, noté algo diferente en el pañal..."
              placeholderTextColor="#B9B2C9"
              multiline
              numberOfLines={3}
              style={{
                minHeight: 70, borderRadius: 12, borderWidth: 1, borderColor: '#DCD4C8', backgroundColor: 'white',
                paddingHorizontal: 13, paddingVertical: 10, fontSize: 14.5, color: '#16162B', textAlignVertical: 'top',
              }}
            />
          </View>

          {editing && onDelete ? (
            <DangerButton onPress={confirmDelete} minH={44}>Borrar este registro</DangerButton>
          ) : null}
        </View>
      ) : null}
    </SheetV2>
  );
}
export default DiaperLogSheet;
