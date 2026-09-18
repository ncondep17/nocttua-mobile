import { View, Text, Pressable } from 'react-native';
import { theme } from '@nocttua/theme/native';
import { ML, nextDose, doseCountToday } from '../../lib/meds';
import { fmt, dur, minutesOfDay } from '../../lib/time';
import { CategoryIcon } from './primitives';

const fmtAt = (date) => fmt(minutesOfDay(date));

/**
 * "Botiquín" — vive en Equipo, debajo del separador "Fuera del sueño". Es
 * el lugar donde la indicación del médico se guarda una sola vez para no
 * volver a buscarla en el chat con el pediatra.
 *
 * Regla de producto: se muestra la indicación con nombre del médico y
 * fecha. Nocttua no calcula dosis por peso ni sugiere medicación. Editable
 * solo por quien tiene acceso total (lo exige la RLS de med_prescriptions).
 *
 * La activa (inUse) se expande con la próxima dosis y lleva a Tratamiento
 * activo al tocarla; las guardadas quedan en una fila angosta con "Activar".
 */
export function MedsPrescriptionCard({ prescriptions, babies, doses, now, onEdit, onToggleInUse, onOpenTreatment }) {
  const babyIds = babies.map((b) => b.id);

  return (
    <View style={{ gap: 9 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 9.5, letterSpacing: 1.4, textTransform: 'uppercase', color: '#8A8299' }}>Botiquín · dosis del pediatra</Text>
        <Pressable onPress={onEdit}><Text style={{ fontSize: 12.5, color: '#6B5DD3' }}>{prescriptions.length ? 'Agregar' : 'Cargar'}</Text></Pressable>
      </View>

      {prescriptions.length === 0 ? (
        <Text style={{ fontSize: 13.5, lineHeight: 13.5 * 1.4, color: '#8A8299' }}>Todavía no hay ninguna medicina indicada.</Text>
      ) : prescriptions.map((m) => {
        if (!m.inUse) {
          return (
            <Pressable
              key={m.id}
              onPress={() => onToggleInUse && onToggleInUse(m.id, true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, backgroundColor: 'white', borderWidth: 1, borderColor: '#E4DCD0', paddingHorizontal: 13, paddingVertical: 12 }}
            >
              <CategoryIcon category="medicina" size={34} />
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '600', color: '#16162B' }}>{m.name}</Text>
                <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10.5, color: '#8A8299' }}>
                  {m.conc ? m.conc + ' · ' : ''}guardado
                </Text>
              </View>
              <Text style={{ fontSize: 12.5, color: '#6B5DD3' }}>Activar</Text>
            </Pressable>
          );
        }

        const next = nextDose([m], doses, babyIds, now);
        const forWho = next ? (babies.length > 1 && babyIds.filter((id) => m.doses[id] != null).length > 1 ? 'las dos' : babies.find((b) => b.id === next.babyId)?.name) : null;

        return (
          <Pressable
            key={m.id}
            onPress={() => onOpenTreatment && onOpenTreatment(m.id)}
            style={{ borderRadius: 16, backgroundColor: '#FDEEE9', borderWidth: 1, borderColor: '#E8B5A6', paddingHorizontal: 13, paddingVertical: 12, gap: 9 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <CategoryIcon category="medicina" size={34} />
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '600', color: '#16162B' }}>{m.name}</Text>
                <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10.5, color: '#A85A45' }}>
                  {next?.doseMl ?? ML(Object.values(m.doses)[0] ?? 0)} cada {m.everyHours} h · máx {m.maxDay} al día
                </Text>
              </View>
              <View style={{ borderRadius: 99, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: '#D9705A' }}>
                <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase', color: '#FBF7F0' }}>Activo</Text>
              </View>
            </View>

            {next ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#FBF7F0', borderRadius: 11, paddingHorizontal: 11, paddingVertical: 9 }}>
                <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: '#D9705A' }} />
                <Text style={{ fontSize: 13, color: '#4A4459' }}>Próxima dosis</Text>
                <Text style={{ marginLeft: 'auto', fontFamily: theme.fontFamily.mono, fontSize: 14, color: '#16162B' }}>
                  {fmtAt(next.at)} · {next.due ? 'ya' : 'en ' + dur(Math.max(0, Math.round((next.at - now) / 60000)))}
                </Text>
              </View>
            ) : null}

            <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10, color: '#A85A45' }}>
              {[m.doctor, m.prescribedOn, forWho, m.remindMinutesBefore ? 'avisa ' + m.remindMinutesBefore + ' min antes' : null].filter(Boolean).join(' · ')}
            </Text>
          </Pressable>
        );
      })}

      <Text style={{ fontSize: 11.5, lineHeight: 11.5 * 1.5, color: '#A9A2B5' }}>
        Nocttua solo repite la indicación de tu doctor, con su nombre y fecha. No calcula dosis ni sustituye una consulta.
      </Text>
    </View>
  );
}
