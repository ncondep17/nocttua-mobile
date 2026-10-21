import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { theme } from '@nocttua/theme/native';
import { Glyph } from '../../components/v2/primitives';
import { getDayRecords, getOpenNightEvent } from '../../data/dayRecords';
import { logNightWake, getMyProfileAndRelationship, insertEvent } from '../../data/family';
import { CONTACTS, CONTACT_KEYS, ACCENT } from '../../data/profiles';
import { fmt, minutesOfDay } from '../../lib/time';
import { agree, plural, genderLabel } from '../../lib/grammar';
import { useNowTick } from '../../lib/useNowTick';

const RELATIONSHIP_LABEL = { mama: 'mamá', papa: 'papá', ninera: 'niñera', otro: 'otro' };
const LATENCIES = ['<5 m', '10 m', '20 m', '30 m+'];
const LATENCY_MINUTES = { '<5 m': 4, '10 m': 10, '20 m': 20, '30 m+': 35 };
const OFFSETS = [-15, -10, -5, 0];

function MoonIcon() {
  return (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
      <Path d="M17.5 14.8A7 7 0 1 1 9.4 4.6a5.6 5.6 0 0 0 8.1 10.2z" stroke="#A79FE0" strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M19.6 3.2l.55 1.45 1.45.55-1.45.55-.55 1.45-.55-1.45-1.45-.55 1.45-.55z" fill="#8A6636" />
    </Svg>
  );
}

function BreathingRing() {
  const opacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 2200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 2200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={{ position: 'absolute', top: -14, left: -14, right: -14, bottom: -14, borderRadius: 99, borderWidth: 1, borderColor: '#2A2848', opacity }} />;
}

function NightChip({ active, dotColor, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1, minHeight: 56, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderWidth: 1, borderColor: active ? '#4A4468' : '#1E1C36', backgroundColor: active ? '#1B1934' : 'transparent',
      }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: active ? dotColor : 'transparent', borderWidth: 1, borderColor: dotColor }} />
      <Text style={{ fontSize: 14.5, fontWeight: '600', color: active ? '#DCD6F0' : '#8E87B5' }}>{label}</Text>
    </Pressable>
  );
}

function PillChip({ active, label, onPress, mono }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1, minHeight: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: active ? '#4A4468' : '#1E1C36', backgroundColor: active ? '#1B1934' : 'transparent',
      }}
    >
      <Text style={{ fontFamily: mono ? theme.fontFamily.mono : undefined, fontSize: mono ? 13 : 14, color: active ? '#DCD6F0' : '#8E87B5' }}>{label}</Text>
    </Pressable>
  );
}

/**
 * Modo noche — pantalla oscura de un toque para registrar un despertar a
 * mitad de la noche sin tener que navegar el resto de la app medio dormida.
 * Escribe directo sobre la noche YA ABIERTA de cada bebé (wake_count +
 * wake_minutes acumulados + last_wake_method) — no inventa un registro
 * nuevo, y no toca contact/fall_asleep_mood porque esos son de la hora de
 * acostarse, no de un despertar de madrugada.
 */
export function NightModeScreen({ familyId, babies, onClose }) {
  const insets = useSafeAreaInsets();
  useNowTick(1000);

  const [openNights, setOpenNights] = useState([]);
  const [relationship, setRelationship] = useState(null);
  const [nightWho, setNightWho] = useState(babies.length > 1 ? 'both' : 0);
  const [step, setStep] = useState(0);
  const [off, setOff] = useState(0);
  const [lat, setLat] = useState(null);
  const [how, setHow] = useState(null);
  const [awakeSince, setAwakeSince] = useState(new Date());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null); // { label, time, night }
  const [startingNight, setStartingNight] = useState(false);

  const load = async () => {
    const { sleepEvents } = await getDayRecords(familyId, 2);
    setOpenNights(getOpenNightEvent(sleepEvents, babies.map((b) => b.id)));
  };

  useEffect(() => {
    load();
    getMyProfileAndRelationship().then((p) => setRelationship(p.relationship)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { setAwakeSince(new Date()); }, [nightWho]);

  const selectedBabies = nightWho === 'both' ? babies : [babies[nightWho]];
  const selectedLabel = nightWho === 'both' ? 'Las dos' : babies[nightWho]?.name;
  const nightsToSave = nightWho === 'both'
    ? babies.map((b, i) => openNights[i]).filter(Boolean)
    : [openNights[nightWho]].filter(Boolean);
  const missingNight = nightWho === 'both' && nightsToSave.length < babies.length && nightsToSave.length > 0;
  const canSave = nightsToSave.length > 0;

  const now = new Date();
  const awakeMin = Math.max(0, Math.floor((now.getTime() - awakeSince.getTime()) / 60000));
  const awakeSec = Math.max(0, Math.floor((now.getTime() - awakeSince.getTime()) / 1000));
  const awakeTimer = awakeMin >= 1 ? awakeMin + ' m' : awakeSec + ' s';

  const sleptAtDate = new Date(now.getTime() + off * 60000);
  const sleptMin = minutesOfDay(sleptAtDate);

  // Abre la noche de una vez desde acá — antes esto mandaba a Hoy y de
  // vuelta acá, dos pantallas para una sola tarea. Solo abre la noche de
  // quien todavía no la tenga abierta (con "Las dos" y una que ya se
  // durmió antes, esa no se toca — nightsToSave/canSave ya filtran ese caso
  // arriba, esto es una segunda barrera por las dudas).
  const handleStartNight = async () => {
    if (startingNight) return;
    const idxs = nightWho === 'both' ? babies.map((_, i) => i) : [nightWho];
    const targets = idxs.filter((i) => !openNights[i]).map((i) => babies[i]);
    if (!targets.length) return;
    try {
      setStartingNight(true);
      const nowIso = new Date().toISOString();
      await Promise.all(targets.map((b) => insertEvent(familyId, {
        babyId: b.id, type: 'sleep', session: 'night', startedAt: nowIso, fellAsleepAt: nowIso, place: 'Su cuna',
      })));
      await load();
    } catch (err) {
      Alert.alert('No se pudo guardar', err.message ?? String(err));
    } finally {
      setStartingNight(false);
    }
  };

  // Solo se llama desde el botón del paso "despierta" (canSave ya es true
  // ahí — ver el render más abajo), así que no necesita su propio guard.
  const tapAsleep = () => {
    setOff(0); setLat(null); setHow(null);
    setStep(1);
  };

  const handleSave = async () => {
    if (!lat) { Alert.alert('Falta un dato', 'Elegí cuánto tardó en dormirse.'); return; }
    try {
      setSaving(true);
      const minutes = LATENCY_MINUTES[lat];
      const method = how ? CONTACT_KEYS[how] : undefined;
      await Promise.all(nightsToSave.map((night) => logNightWake(night, { minutes, method })));
      setSaved({ label: selectedLabel, time: fmt(sleptMin) });
      setStep(2);
      await load();
    } catch (err) {
      Alert.alert('No se pudo guardar', err.message ?? String(err));
    } finally {
      setSaving(false);
    }
  };

  const resetNight = () => {
    setStep(0); setHow(null); setOff(0); setLat(null); setAwakeSince(new Date());
  };

  // genderLabel ya acepta un grupo (ver lib/grammar.js) — con "Las dos"
  // seleccionado, antes esto caía siempre al femenino por defecto aunque
  // alguno de los dos fuera niño.
  const savedNote = saved
    ? plural(selectedBabies, 'Tardó ', 'Tardaron ') + lat + ' en dormirse. ' +
      (how ? plural(selectedBabies, 'Se durmió ', 'Se durmieron ') + genderLabel(how, selectedBabies).toLowerCase() + '. ' : '') +
      'Vuelve a dormir: el resumen te espera en la mañana.'
    : '';

  const currentNight = nightWho === 'both' ? openNights[0] : openNights[nightWho];
  const footWakeCount = currentNight?.wake_count ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A14' }}>
      <View style={{ flex: 1, paddingTop: 16 + insets.top, paddingHorizontal: 20, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10, letterSpacing: 2.2, textTransform: 'uppercase', color: '#8E87B5' }}>Modo noche</Text>
          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#8E87B5' }}>
            {relationship ? 'Turno · ' + RELATIONSHIP_LABEL[relationship] : ''}
          </Text>
        </View>

        {babies.length > 1 ? (
          <View style={{ marginTop: 22, flexDirection: 'row', gap: 8 }}>
            {babies.map((b, i) => (
              <NightChip key={b.id} active={nightWho === i} dotColor={ACCENT[b.tone]} label={b.name} onPress={() => step === 0 && setNightWho(i)} />
            ))}
            <NightChip active={nightWho === 'both'} dotColor="#A79FE0" label="Las dos" onPress={() => step === 0 && setNightWho('both')} />
          </View>
        ) : null}

        {step === 0 && !canSave ? (
          // Antes esto mandaba a Hoy a abrir la noche y volver — dos
          // pantallas para una sola tarea. Ahora se puede abrir la noche
          // desde acá mismo: mismo círculo y copia que usa el flujo de
          // despertar, para no aprender una interacción nueva.
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 26 }}>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Glyph category="sueno" size={30} color="#8E87B5" />
              <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 22, color: '#DCD6F0', textAlign: 'center' }}>
                {(selectedLabel ?? '').toUpperCase() === 'LAS DOS' ? 'Todavía no empezó la noche' : selectedLabel + ' todavía no empezó la noche'}
              </Text>
            </View>

            <Pressable
              onPress={handleStartNight}
              disabled={startingNight}
              style={{ width: 216, height: 216, borderRadius: 999, backgroundColor: '#1B1934', borderWidth: 1, borderColor: '#302D52', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: startingNight ? 0.7 : 1 }}
            >
              <MoonIcon />
              <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 27, color: '#DCD6F0' }}>
                {plural(selectedBabies, 'Se durmió', 'Se durmieron')}
              </Text>
              <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 11, color: '#8E87B5' }}>ahora · {fmt(minutesOfDay(now))}</Text>
            </Pressable>

            <Text style={{ fontSize: 12.5, lineHeight: 18, color: '#8E87B5', textAlign: 'center', maxWidth: 250 }}>
              Un toque abre la noche. Cuando se despierte, volvés a esta pantalla para cerrarla.
            </Text>
          </View>
        ) : step === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 26 }}>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: '#8E87B5' }}>
                {(selectedLabel ?? '').toUpperCase() + ' · ' + agree(selectedBabies, 'despierto', 'despierta').toUpperCase()}
              </Text>
              <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 40, lineHeight: 40, color: '#6E6A8E' }}>{awakeTimer}</Text>
            </View>

            <Pressable onPress={tapAsleep} style={{ width: 216, height: 216, borderRadius: 999, backgroundColor: '#1B1934', borderWidth: 1, borderColor: '#302D52', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <BreathingRing />
              <MoonIcon />
              <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 27, color: '#DCD6F0' }}>
                {plural(selectedBabies, 'Se durmió', 'Se durmieron')}
              </Text>
              <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 11, color: '#8E87B5' }}>ahora · {fmt(minutesOfDay(now))}</Text>
            </Pressable>

            <Text style={{ fontSize: 12.5, lineHeight: 18, color: '#8E87B5', textAlign: 'center', maxWidth: 250 }}>
              Un toque cierra el despertar. Todo lo demás se puede ajustar mañana.
            </Text>
            {missingNight ? (
              <Text style={{ fontSize: 11.5, color: '#B07A3C', textAlign: 'center', maxWidth: 260 }}>
                Solo una de las dos tiene la noche abierta — se va a guardar únicamente para esa.
              </Text>
            ) : null}
          </View>
        ) : null}

        {step === 1 ? (
          <View style={{ flex: 1, gap: 18, paddingTop: 26 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: '#8E87B5' }}>
                {plural(selectedBabies, 'Se durmió', 'Se durmieron') + ' a las'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
                <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 52, lineHeight: 52, color: '#DCD6F0' }}>{fmt(sleptMin)}</Text>
                <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 12, color: '#8E87B5' }}>{off === 0 ? 'hace un momento' : 'hace ' + -off + ' min'}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 7 }}>
              {OFFSETS.map((o) => (
                <PillChip key={o} mono active={off === o} label={o === 0 ? 'ahora' : o + 'm'} onPress={() => setOff(o)} />
              ))}
            </View>

            <View style={{ gap: 9 }}>
              <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: '#8E87B5' }}>
                {plural(selectedBabies, 'Cuánto tardó en dormirse', 'Cuánto tardaron en dormirse')}
              </Text>
              <View style={{ flexDirection: 'row', gap: 7 }}>
                {LATENCIES.map((l) => <PillChip key={l} mono active={lat === l} label={l} onPress={() => setLat(l)} />)}
              </View>
            </View>

            <View style={{ gap: 9 }}>
              <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: '#8E87B5' }}>
                {plural(selectedBabies, 'Cómo se durmió', 'Cómo se durmieron') + ' · opcional'}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {CONTACTS.map((c) => (
                  <View key={c} style={{ minWidth: '47%', flexGrow: 1 }}>
                    <PillChip active={how === c} label={genderLabel(c, selectedBabies)} onPress={() => setHow(how === c ? null : c)} />
                  </View>
                ))}
              </View>
            </View>

            <Pressable onPress={handleSave} disabled={saving} style={{ marginTop: 'auto', marginBottom: 22, minHeight: 62, borderRadius: 18, backgroundColor: '#6B5DD3', alignItems: 'center', justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
              <Text style={{ fontSize: 16.5, fontWeight: '600', color: '#FBF7F0' }}>Listo</Text>
            </Pressable>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <View style={{ width: 64, height: 64, borderRadius: 99, backgroundColor: '#1B2E26', alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
                <Path d="M5 12.6l4.2 4.2L19 7" stroke="#6FA98D" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 28, color: '#DCD6F0', textAlign: 'center' }}>
              {'Listo. ' + (saved?.label ?? '') + ', ' + (saved?.time ?? '') + '.'}
            </Text>
            <Text style={{ fontSize: 13.5, lineHeight: 20, color: '#8E87B5', textAlign: 'center', maxWidth: 260 }}>{savedNote}</Text>
            <Pressable onPress={resetNight} style={{ marginTop: 10, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#2A2848' }}>
              <Text style={{ fontSize: 13.5, color: '#6E6A8E' }}>Registrar otro despertar</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, paddingBottom: 8 + insets.bottom, borderTopWidth: 1, borderTopColor: '#14142A' }}>
          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10.5, color: '#8E87B5' }}>
            {footWakeCount > 0 ? footWakeCount + ' despertar' + (footWakeCount === 1 ? '' : 'es') + ' esta noche' : 'Ningún despertar todavía'}
          </Text>
          {/* Antes era solo texto mono 10.5px en #8E87B5 (el tono "faint" del
              modo noche) — a oscuras y medio dormida, ese botón era casi
              invisible. Ahora tiene borde y más contraste, sin llegar a ser
              tan brillante como para desvelar. */}
          <Pressable onPress={onClose} style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2A2848', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#8E87B5' }}>Salir del modo noche</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
export default NightModeScreen;
