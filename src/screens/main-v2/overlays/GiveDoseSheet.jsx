import { useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { theme } from '@nocttua/theme/native';
import { ML, lastDose, doseCountToday, doseWarning, doseHistory, isAtDoseLimit } from '../../../lib/meds';
import { fmt, minutesOfDay } from '../../../lib/time';
import { SheetV2 } from '../../../components/v2/MobileChrome';
import { SegTabs, Stepper, PrimaryButton, GhostButton } from '../../../components/v2/primitives';

const fmtAt = (date) => fmt(minutesOfDay(date));
const withMinutes = (date, delta) => new Date(date.getTime() + delta * 60000);

/**
 * "Dar medicina". Pensada para las 3am con una mano: la dosis en 44px es el
 * elemento más grande de la pantalla, y el botón confirma repitiendo la
 * cantidad ("Le di 1,2 ml") para que no haya duda. El aviso informa
 * (intervalo, máximo) pero NUNCA bloquea: decide el cuidador.
 */
export function GiveDoseSheet({ open, prescription, prescriptions, doses, babies, now, initialBabyId, onSave, onSaveBoth, onClose }) {
  const [babyId, setBabyId] = useState(initialBabyId);
  const [at, setAt] = useState(now);

  useEffect(() => {
    if (open) { setBabyId(initialBabyId); setAt(now); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialBabyId]);

  if (!open || !prescription) return null;
  const baby = babies.find((b) => b.id === babyId);
  const ml = prescription.doses[babyId];
  const last = lastDose(doses, prescription.id, babyId);
  const given = doseCountToday(doses, prescription.id, babyId, now);
  const warn = doseWarning(prescription, doses, babyId, at);
  const atLimit = isAtDoseLimit(prescription, doses, babyId, now);
  const anyAtLimit = babies.some((b) => prescription.doses[b.id] != null && isAtDoseLimit(prescription, doses, b.id, now));

  const confirmPastLimit = (count) => new Promise((resolve) => {
    Alert.alert(
      'Ya se dio el máximo indicado',
      'El pediatra indicó hasta ' + prescription.maxDay + ' al día' + (count > 1 ? ' por bebé' : '') + '. ¿Registrar de todas formas?',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Sí, registrar igual', style: 'destructive', onPress: () => resolve(true) },
      ],
    );
  });

  const handleSave = async () => {
    if (atLimit && !(await confirmPastLimit(1))) return;
    onSave(prescription.id, babyId, at, atLimit);
  };
  const handleSaveBoth = async () => {
    if (anyAtLimit && !(await confirmPastLimit(2))) return;
    onSaveBoth(prescription.id, at, anyAtLimit);
  };

  return (
    <SheetV2
      open={open}
      onClose={onClose}
      title="Dar medicina"
      footer={
        <>
          <PrimaryButton style={{ flex: 1 }} onPress={handleSave}>{atLimit ? 'Registrar igual' : 'Le di ' + ML(ml)}</PrimaryButton>
          {babies.length > 1 ? <GhostButton onPress={handleSaveBoth}>Las{'\n'}dos</GhostButton> : null}
        </>
      }
    >
      {babies.length > 1 ? (
        <SegTabs items={babies.map((b) => ({ id: b.id, label: b.name }))} active={babyId} onSelect={setBabyId} />
      ) : null}

      <View style={{ alignItems: 'center', gap: 6, borderRadius: 16, borderWidth: 1, borderColor: '#EFCFC7', backgroundColor: '#FFF6F4', padding: 16 }}>
        <Text style={{ fontSize: 15, color: '#4A4459' }}>{prescription.name}</Text>
        <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 44, lineHeight: 44, color: '#16162B' }}>{ML(ml)}</Text>
        <Text style={{ fontSize: 13, color: '#8A8299' }}>{prescription.conc}</Text>
        <Text style={{ marginTop: 4, fontSize: 12, color: '#A9A2B5' }}>Indicado por {prescription.doctor} el {prescription.prescribedOn}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 9 }}>
        <Stat value={last ? fmtAt(last.givenAt) : '—'} label={last ? 'última dosis · ' + last.by : 'sin dosis hoy'} />
        <Stat value={given + ' de ' + prescription.maxDay} label="dosis de hoy" tone={given >= prescription.maxDay ? '#D9705A' : '#16162B'} />
      </View>

      <Stepper label="Hora" value={fmtAt(at)} onDec={() => setAt(withMinutes(at, -5))} onInc={() => setAt(withMinutes(at, 5))} />

      {warn ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 12, borderWidth: 1, borderColor: '#EFCFC7', backgroundColor: '#FFF6F4', paddingHorizontal: 12, paddingVertical: 11 }}>
          <View style={{ height: 20, width: 20, borderRadius: 99, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7DED7' }}>
            <Text style={{ fontSize: 11, color: '#C25F45' }}>!</Text>
          </View>
          <Text style={{ flex: 1, fontSize: 12.5, lineHeight: 12.5 * 1.45, color: '#4A4459' }}>{warn}</Text>
        </View>
      ) : null}

      <View style={{ gap: 7 }}>
        <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10.5, letterSpacing: 0.9, textTransform: 'uppercase', color: '#8A8299' }}>Dosis de hoy</Text>
        {doseHistory(doses, prescriptions, babies, now).map((h, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#F0EAE0', paddingVertical: 7 }}>
            <Text style={{ minWidth: 46, fontFamily: theme.fontFamily.mono, fontSize: 13, color: '#16162B' }}>{h.time}</Text>
            <Text style={{ flex: 1, fontSize: 13.5, color: '#4A4459' }}>{h.what}</Text>
            <Text style={{ fontSize: 12, color: '#8A8299' }}>{h.by}</Text>
          </View>
        ))}
      </View>
    </SheetV2>
  );
}
export default GiveDoseSheet;

function Stat({ value, label, tone = '#16162B' }) {
  return (
    <View style={{ flex: 1, gap: 3, borderRadius: 12, borderWidth: 1, borderColor: '#E4DCD0', backgroundColor: '#FBF7F0', paddingHorizontal: 11, paddingVertical: 10 }}>
      <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 17, color: tone }}>{value}</Text>
      <Text style={{ fontSize: 11.5, lineHeight: 11.5 * 1.3, color: '#8A8299' }}>{label}</Text>
    </View>
  );
}
