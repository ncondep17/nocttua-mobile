import { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@nocttua/theme/native';
import { UnitToggle } from '../../../components/v2/primitives';
import { fmtVolume, stepVolume, mlToOz, ozToMl } from '../../../lib/volume';
import { useHoldRepeat } from '../../../lib/useHoldRepeat';

function fmtClock(iso) {
  const d = new Date(iso);
  return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
}

/** El valor real siempre es ml — `unit` solo cambia cómo se ve y se escribe, igual que el resto de la app (Toma/Extracción manuales). */
function AmountStepper({ label, valueMl, onChange, chipsMl, unit }) {
  const clampMl = (v) => Math.max(0, Math.min(1200, v));
  const displayValue = unit === 'oz' ? mlToOz(valueMl).toFixed(1).replace('.', ',') : String(valueMl);
  const dec = useHoldRepeat(() => onChange(clampMl(stepVolume(valueMl, unit, -1))));
  const inc = useHoldRepeat(() => onChange(clampMl(stepVolume(valueMl, unit, 1))));
  return (
    <View style={{ backgroundColor: '#F7F4FE', borderRadius: 16, paddingHorizontal: 13, paddingVertical: 12, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 14.5, fontWeight: '600', color: '#16162B' }}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            {...dec}
            style={{ width: 34, height: 34, borderRadius: 99, backgroundColor: 'white', borderWidth: 1, borderColor: '#D9D2EE', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 17, color: '#6B5DD3' }}>−</Text>
          </Pressable>
          <View style={{ minWidth: 74, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 3 }}>
            <TextInput
              value={displayValue}
              onChangeText={(t) => {
                const n = parseFloat(t.replace(',', '.').replace(/[^0-9.]/g, ''));
                if (Number.isNaN(n)) { onChange(0); return; }
                onChange(clampMl(Math.round(unit === 'oz' ? ozToMl(n) : n)));
              }}
              keyboardType="decimal-pad"
              style={{ fontFamily: theme.fontFamily.mono, fontSize: 25, color: '#16162B', textAlign: 'right', minWidth: 46, padding: 0 }}
            />
            <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 12.5, color: '#8A8299' }}>{unit}</Text>
          </View>
          <Pressable
            {...inc}
            style={{ width: 34, height: 34, borderRadius: 99, backgroundColor: '#6B5DD3', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 17, color: 'white' }}>＋</Text>
          </Pressable>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 7 }}>
        {chipsMl.map((c) => {
          const on = valueMl === c;
          return (
            <Pressable
              key={c}
              onPress={() => onChange(c)}
              style={{
                flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center',
                backgroundColor: on ? '#6B5DD3' : 'white', borderWidth: 1, borderColor: on ? '#6B5DD3' : '#E0DAF2',
              }}
            >
              <Text style={{ fontSize: 12.5, color: on ? 'white' : '#6A6478' }}>{c === 0 ? '0' : fmtVolume(c, unit)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * "¿Cuánto salió?" — se abre al terminar una extracción cronometrada. El
 * timer mide tiempo, no volumen, así que el ml/oz por lado se carga acá, una
 * sola vez, en vez de pedirlo antes (cuando todavía no se sabe). Se guarda
 * siempre en ml (columna `volume_ml`) — oz es solo la unidad de pantalla,
 * igual que en Toma/Extracción manuales.
 */
export function PumpAmountSheet({ open, session, sides, suggestedChips, onClose, onSave, onDetails }) {
  const insets = useSafeAreaInsets();
  const [izq, setIzq] = useState(0);
  const [der, setDer] = useState(0);
  const [unit, setUnit] = useState('ml');

  useEffect(() => {
    if (!open) return;
    setIzq(0);
    setDer(0);
  }, [open, session]);

  if (!session) return null;

  const durationMin = Math.max(1, Math.round(session.totalMs / 60000));
  const chipsMl = (suggestedChips && suggestedChips.length === 3 ? suggestedChips : [60, 90, 120]).concat([0]);
  const total = (sides.indexOf('izq') >= 0 ? izq : 0) + (sides.indexOf('der') >= 0 ? der : 0);
  const amounts = { izq: sides.indexOf('izq') >= 0 ? izq : 0, der: sides.indexOf('der') >= 0 ? der : 0 };

  return (
    <Modal visible={!!open} transparent animationType="slide" onRequestClose={onClose}>
    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      <Pressable onPress={onClose} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(22,22,43,.35)' }} />
      <View style={{ borderTopLeftRadius: 22, borderTopRightRadius: 22, backgroundColor: 'white', paddingHorizontal: 15, paddingTop: 16, paddingBottom: 16 + insets.bottom, gap: 15 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ gap: 2 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: '#16162B' }}>¿Cuánto salió?</Text>
            <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 12.5, color: '#8A8299' }}>
              {durationMin} min · {fmtClock(session.startedAt)}
            </Text>
          </View>
          <UnitToggle unit={unit} onChange={setUnit} />
        </View>

        {sides.indexOf('izq') >= 0 ? <AmountStepper label="Pecho izquierdo" valueMl={izq} onChange={setIzq} chipsMl={chipsMl} unit={unit} /> : null}
        {sides.indexOf('der') >= 0 ? <AmountStepper label="Pecho derecho" valueMl={der} onChange={setDer} chipsMl={chipsMl} unit={unit} /> : null}

        <View style={{ borderTopWidth: 1, borderTopColor: '#EFE9DF', paddingTop: 13, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 14, color: '#6A6478' }}>Total al banco</Text>
          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 25, color: '#6B5DD3' }}>{fmtVolume(total, unit)}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 9 }}>
          <Pressable
            onPress={() => onDetails && onDetails(amounts)}
            style={{ width: 96, minHeight: 48, borderRadius: 13, borderWidth: 1.5, borderColor: '#E4DCD0', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 14, color: '#4A4459' }}>Detalles</Text>
          </Pressable>
          <Pressable
            onPress={() => onSave && onSave(amounts)}
            style={{ flex: 1, minHeight: 48, borderRadius: 13, backgroundColor: '#16162B', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FBF7F0' }}>Guardar extracción</Text>
          </Pressable>
        </View>

        <Text style={{ fontSize: 12, color: '#A9A2B5', textAlign: 'center' }}>
          Si dejas un lado en 0 lo guardamos como extracción de un solo pecho.
        </Text>
      </View>
    </View>
    </Modal>
  );
}
export default PumpAmountSheet;
