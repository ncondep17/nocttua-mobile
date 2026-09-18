import { View, Text, Pressable } from 'react-native';
import { theme } from '@nocttua/theme/native';
import { ACCENT } from '../../../data/profiles';
import { medPlan, nextDose } from '../../../lib/meds';
import { fmt, dur, minutesOfDay } from '../../../lib/time';
import { SheetV2 } from '../../../components/v2/MobileChrome';

const fmtAt = (date) => fmt(minutesOfDay(date));

/**
 * Hoja de Medicinas. Se abre desde el recuadro de Sueño. El plan de dosis
 * (próxima dosis, una fila por medicina y bebé) sale de las medicinas
 * marcadas "en uso" — independiente de si el modo enfermedad está activo:
 * el catálogo completo puede estar cargado de antes (Panadol, Flogobrón,
 * Gravol...) y solo importa cuál se está dando en este momento. El modo
 * enfermedad sigue existiendo aparte, para excluir estos días de los
 * promedios de sueño.
 */
export function MedsSheet({ open, episode, prescriptions, doses, babies, now, onGive, onToggleEpisode, onGoCare, onClose }) {
  const babyIds = babies.map((b) => b.id);
  const activeMeds = prescriptions.filter((p) => p.inUse);
  const next = activeMeds.length ? nextDose(activeMeds, doses, babyIds, now) : null;
  const rows = activeMeds.length ? medPlan(activeMeds, doses, babyIds, now) : [];

  return (
    <SheetV2 open={open} onClose={onClose} title="Medicinas" maxH="92%">
      <View style={{ gap: 13 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, borderColor: episode ? '#EFCFC7' : '#E4DCD0', backgroundColor: episode ? '#FFF6F4' : '#FBF7F0', paddingHorizontal: 15, paddingVertical: 12 }}>
          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 11, letterSpacing: 0.9, textTransform: 'uppercase', color: episode ? '#C25F45' : '#8A8299' }}>
            {episode ? 'Modo enfermedad · día ' + episode.day : 'Modo enfermedad inactivo'}
          </Text>
          <Pressable
            onPress={onToggleEpisode}
            style={{ borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: episode ? '#F0EAE0' : '#F6F1FB' }}
          >
            <Text style={{ fontSize: 12.5, fontWeight: '500', color: episode ? '#8A8299' : '#6B5DD3' }}>{episode ? 'Ya está bien' : 'Activar'}</Text>
          </Pressable>
        </View>

        {activeMeds.length > 0 ? (
          <View style={{ gap: 12, borderRadius: 16, borderWidth: 1, borderColor: '#E4DCD0', backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
              <View style={{ gap: 2 }}>
                <Text style={{ fontSize: 16.5, fontWeight: '500', lineHeight: 16.5 * 1.3, color: '#16162B' }}>
                  {next ? next.prescription.name + ' · ' + (babies.find((b) => b.id === next.babyId)?.name ?? '') : 'Nada pendiente ahora'}
                </Text>
                <Text style={{ fontSize: 12.5, color: '#8A8299' }}>
                  {next ? next.doseMl + ' · cada ' + next.prescription.everyHours + ' h' : 'La próxima dosis se abre cuando pasen las horas'}
                </Text>
              </View>
              {next ? (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 21, color: '#16162B' }}>{fmtAt(next.at)}</Text>
                  <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 12, color: '#C25F45' }}>
                    {next.due ? 'le toca ya' : 'en ' + dur(Math.round((next.at - now) / 60000))}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={{ gap: 8, borderTopWidth: 1, borderTopColor: '#F3DED8', paddingTop: 11 }}>
              {rows.map((r) => {
                const baby = babies.find((b) => b.id === r.babyId);
                return (
                  <View key={r.prescription.id + r.babyId} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ height: 28, width: 28, borderRadius: 99, alignItems: 'center', justifyContent: 'center', backgroundColor: baby?.tone === 'a' ? '#E8DFF6' : '#FDE8D7' }}>
                      <Text style={{ fontSize: 11.5, fontWeight: '700', color: baby ? ACCENT[baby.tone] : '#6B5DD3' }}>{baby?.name?.[0]}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 1 }}>
                      <Text style={{ fontSize: 14.5, fontWeight: '500', color: '#16162B' }}>{r.prescription.name} · {r.doseMl}</Text>
                      <Text style={{ fontSize: 12, lineHeight: 12 * 1.35, color: '#8A8299' }}>
                        {r.last ? 'última ' + fmtAt(r.last.givenAt) + ' · ' + r.last.by : 'sin dosis hoy'}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => onGive(r.prescription.id, r.babyId)}
                      style={r.due
                        ? { borderRadius: 10, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: '#16162B' }
                        : { borderRadius: 10, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: 'white', borderWidth: 1, borderColor: '#E4DCD0' }}
                    >
                      <Text style={r.due
                        ? { fontSize: 13.5, fontWeight: '500', color: '#FBF7F0' }
                        : { fontFamily: theme.fontFamily.mono, fontSize: 12.5, color: '#8A8299' }}
                      >
                        {r.due ? 'Dar' : 'a las ' + fmtAt(r.at)}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <Text style={{ fontSize: 14.5, lineHeight: 14.5 * 1.5, color: '#4A4459' }}>
            Ninguna medicina marcada como "en uso" ahora. Marca la que le estés dando desde "Ver o editar las dosis" para ver acá cuándo toca la próxima.
          </Text>
        )}

        <Pressable onPress={onGoCare} style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
          <View style={{ height: 30, width: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F1FB' }}>
            <Text style={{ fontSize: 13, color: '#6B5DD3' }}>◇</Text>
          </View>
          <Text style={{ flex: 1, fontSize: 14, lineHeight: 14 * 1.35, color: '#4A4459' }}>Ver o editar las dosis que indicó el doctor</Text>
          <Text style={{ fontSize: 14, color: '#A9A2B5' }}>→</Text>
        </Pressable>

        {episode ? (
          <Text style={{ fontSize: 11.5, lineHeight: 11.5 * 1.5, color: '#A9A2B5' }}>
            Estos días quedan marcados como atípicos en Datos, así no mueven tus promedios ni las ventanas del plan.
          </Text>
        ) : null}
      </View>
    </SheetV2>
  );
}
export default MedsSheet;
