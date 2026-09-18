import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@nocttua/theme/native';
import { ACCENT } from '../../data/profiles';
import { Glyph } from '../../components/v2/primitives';
import { ML, medPlan, nextDose, doseWarning } from '../../lib/meds';
import { fmt, dur, minutesOfDay } from '../../lib/time';
import { useNowTick } from '../../lib/useNowTick';
import { getPrescriptionPhotoUrl } from '../../lib/prescriptionPhoto';

const fmtAt = (date) => fmt(minutesOfDay(date));

function DoseRing({ percent, size = 92 }) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, Math.max(0, percent)));
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke="#2A2848" strokeWidth={stroke} fill="none" />
      <Circle cx={size / 2} cy={size / 2} r={r} stroke="#D9705A" strokeWidth={stroke} fill="none" strokeDasharray={`${c} ${c}`} strokeDashoffset={offset} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Tratamiento activo — vista dedicada de UNA medicina en uso, para no tener
 * que revisar el chat con el pediatra ni adivinar cuándo tocó la última.
 * Reusa el motor de lib/meds.js (medPlan/nextDose/doseWarning) — no
 * recalcula nada nuevo, solo lo muestra con más detalle que la fila
 * compacta de Equipo.
 *
 * Límite real: el schema no guarda temperatura ni duración esperada del
 * tratamiento, así que "días anteriores" solo cuenta dosis, sin picos de
 * fiebre, y el encabezado no dice "día 3 de 5" (no hay un total que mostrar,
 * solo el día que va desde que se cargó la receta).
 */
export function TreatmentScreen({ prescription, doses, babies, onOpenGiveDose, onStopUsing, onClose }) {
  useNowTick();
  const [photoUrl, setPhotoUrl] = useState(null);
  const now = new Date();

  useEffect(() => {
    let cancelled = false;
    if (prescription?.photoUrl) getPrescriptionPhotoUrl(prescription.photoUrl).then((url) => { if (!cancelled) setPhotoUrl(url); });
    else setPhotoUrl(null);
    return () => { cancelled = true; };
  }, [prescription?.photoUrl]);

  if (!prescription) return null;

  const babyIds = babies.filter((b) => prescription.doses[b.id] != null).map((b) => b.id);
  const rows = medPlan([prescription], doses, babyIds, now);
  const next = nextDose([prescription], doses, babyIds, now);
  const dayNum = prescription.prescribedOn ? Math.max(1, Math.floor((now - new Date(prescription.prescribedOn)) / 86400000) + 1) : null;

  const percent = next ? 1 - Math.max(0, (next.at - now)) / (prescription.everyHours * 3600000) : 0;
  const warn = next ? doseWarning(prescription, doses, next.babyId, now) : '';

  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayDoses = doses.filter((d) => d.prescriptionId === prescription.id && d.givenAt >= todayStart).sort((a, b) => a.givenAt - b.givenAt);

  const priorDays = {};
  doses.filter((d) => d.prescriptionId === prescription.id && d.givenAt < todayStart).forEach((d) => {
    const key = d.givenAt.toDateString();
    priorDays[key] = (priorDays[key] || 0) + 1;
  });
  const priorDayKeys = Object.keys(priorDays).sort((a, b) => new Date(b) - new Date(a)).slice(0, 3);

  const confirmDeactivate = () => {
    Alert.alert('¿Ya no se la está dando?', 'Sigue guardada para volver a activarla si hace falta.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sí, ya no', onPress: () => onStopUsing && onStopUsing(prescription.id) },
    ]);
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#FBF7F0' }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 16 + insets.top, paddingBottom: 30 + insets.bottom, gap: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ gap: 2 }}>
            <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase', color: '#A85A45' }}>
              Tratamiento{dayNum ? ' · día ' + dayNum : ''}
            </Text>
            <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 30, lineHeight: 30 * 1.05, color: '#16162B' }}>{prescription.name}</Text>
          </View>
          <Pressable onPress={onClose}><Text style={{ fontSize: 15, color: '#6B5DD3' }}>Cerrar</Text></Pressable>
        </View>

        <View style={{ borderRadius: 20, backgroundColor: '#16162B', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ width: 92, height: 92, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute' }}><DoseRing percent={percent} /></View>
            <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 18, color: '#FBF7F0' }}>
              {next ? (next.due ? 'ya' : dur(Math.max(0, Math.round((next.at - now) / 60000)))) : '—'}
            </Text>
            <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 8.5, letterSpacing: 1, textTransform: 'uppercase', color: '#8E87B5' }}>{next?.due ? 'toca ya' : 'faltan'}</Text>
          </View>
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 9.5, letterSpacing: 1.4, textTransform: 'uppercase', color: '#F0A868' }}>Próxima dosis</Text>
            <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 28, lineHeight: 28, color: '#FBF7F0' }}>{next ? fmtAt(next.at) : '—'}</Text>
            <Text style={{ fontSize: 12.5, lineHeight: 12.5 * 1.4, color: '#B9B2C9' }}>
              {next ? next.doseMl + (babyIds.length > 1 ? ' a cada una.' : ' a ' + (babies.find((b) => b.id === next.babyId)?.name ?? '') + '.') : 'Sin dosis pendientes ahora.'}
            </Text>
          </View>
        </View>

        {warn ? (
          <View style={{ flexDirection: 'row', gap: 9, borderRadius: 12, borderWidth: 1, borderColor: '#EFCFC7', backgroundColor: '#FFF6F4', paddingHorizontal: 12, paddingVertical: 11 }}>
            <View style={{ height: 20, width: 20, borderRadius: 99, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7DED7' }}>
              <Text style={{ fontSize: 11, color: '#C25F45' }}>!</Text>
            </View>
            <Text style={{ flex: 1, fontSize: 12.5, lineHeight: 12.5 * 1.45, color: '#4A4459' }}>{warn}</Text>
          </View>
        ) : null}

        {/* Abre GiveDoseSheet en vez de guardar directo con `now` — esa hoja
            ya tiene el stepper de hora (±5 min), el selector de bebé y el
            aviso de tope diario; antes esto guardaba la hora actual sin
            poder elegir si se la dio a las 8am o al mediodía. */}
        <Pressable
          onPress={() => onOpenGiveDose && onOpenGiveDose(prescription.id, babyIds[0])}
          style={{ minHeight: 60, borderRadius: 15, backgroundColor: '#D9705A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }}
        >
          <Glyph category="confirmado" size={19} color="#FBF7F0" />
          <Text style={{ fontSize: 15.5, fontWeight: '600', color: '#FBF7F0' }}>Dar dosis</Text>
        </Pressable>

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 9.5, letterSpacing: 1.4, textTransform: 'uppercase', color: '#8A8299' }}>Dosis de hoy</Text>
            <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10.5, color: '#8A8299' }}>{todayDoses.length} de {prescription.maxDay} por bebé</Text>
          </View>
          {todayDoses.length === 0 ? (
            <Text style={{ fontSize: 13.5, color: '#8A8299' }}>Sin dosis todavía hoy.</Text>
          ) : todayDoses.map((d) => {
            const baby = babies.find((b) => b.id === d.babyId);
            return (
              <View key={d.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 12.5, color: '#16162B', minWidth: 40 }}>{fmtAt(d.givenAt)}</Text>
                <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: baby ? ACCENT[baby.tone] : '#8A8299' }} />
                <Text style={{ fontSize: 13.5, color: '#4A4459' }}>{(baby?.name ?? '—') + ' · ' + ML(prescription.doses[d.babyId] ?? 0)}</Text>
                <Text style={{ marginLeft: 'auto', fontFamily: theme.fontFamily.mono, fontSize: 11, color: '#8A8299' }}>{d.by}</Text>
              </View>
            );
          })}
        </View>

        <View style={{ borderRadius: 16, backgroundColor: '#F3EFE6', padding: 14, gap: 7 }}>
          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 9.5, letterSpacing: 1.4, textTransform: 'uppercase', color: '#8A8299' }}>Lo que dijo la pediatra</Text>
          <Text style={{ fontSize: 13.5, lineHeight: 13.5 * 1.5, color: '#4A4459' }}>
            {prescription.note || (ML(Object.values(prescription.doses)[0] ?? 0) + ' cada ' + prescription.everyHours + ' h · máximo ' + prescription.maxDay + ' dosis en 24 h.')}
          </Text>
          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10.5, color: '#8A8299' }}>
            {[prescription.doctor, prescription.prescribedOn ? 'receta del ' + prescription.prescribedOn : null].filter(Boolean).join(' · ')}
          </Text>
          {photoUrl ? <Image source={{ uri: photoUrl }} style={{ width: '100%', height: 180, borderRadius: 12, marginTop: 4 }} resizeMode="cover" /> : null}
        </View>

        {priorDayKeys.length > 0 ? (
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 9.5, letterSpacing: 1.4, textTransform: 'uppercase', color: '#8A8299' }}>Días anteriores</Text>
            {priorDayKeys.map((key) => (
              <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#F3EFE6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
                <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 12, color: '#16162B', minWidth: 46 }}>
                  {new Date(key).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                </Text>
                <Text style={{ fontSize: 13, color: '#4A4459' }}>{priorDays[key]} dosis</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 10, borderRadius: 16, borderWidth: 1, borderColor: '#EFD9BC', backgroundColor: '#FFF9F0', paddingHorizontal: 13, paddingVertical: 12, alignItems: 'center' }}>
          <Ionicons name="pulse-outline" size={18} color="#C08A3E" />
          <Text style={{ flex: 1, fontSize: 12.5, lineHeight: 12.5 * 1.45, color: '#8A6636' }}>
            Cada dosis queda registrada junto a los despertares de esa noche.
          </Text>
        </View>

        <Pressable onPress={confirmDeactivate} style={{ alignItems: 'center', paddingVertical: 8 }}>
          <Text style={{ fontSize: 13, color: '#A9A2B5' }}>Ya no se la está dando</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
export default TreatmentScreen;
