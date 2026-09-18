import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { theme } from '@nocttua/theme/native';
import { PROFILES } from '../../data/profiles';
import { solveSampleDay, SAMPLE_DAY_DISCLAIMER, SAMPLE_DAY_TWINS } from '../../lib/sampleDay';
import { REGRESSIONS, REGRESSION_INTRO, REGRESSION_DO, REGRESSION_TWINS, regressionsForAge } from '../../data/regressions';
import { Eyebrow } from './primitives';

/**
 * Tablas de referencia — arriba de "Por tema" en Tips. Tres acordeones,
 * cerrados por defecto. Todo se deriva del perfil de edad activo: no hay
 * imágenes ni tablas fijas, cambiar de edad recalcula las tres.
 *
 * `profile`/`onSelectProfile` son una VISTA PREVIA local a estas tres
 * tarjetas, no el perfil real del bebé (que sigue viniendo de su fecha de
 * nacimiento en el resto de la app) — tocar una fila deja ver cómo es esa
 * etapa sin fingir que cambia la edad real.
 */
export function ReferenceCards({ profile, onSelectProfile }) {
  const [open, setOpen] = useState(null); // 'win' | 'day' | 'reg' | null
  const toggle = (k) => setOpen(open === k ? null : k);
  return (
    <View style={{ gap: 10 }}>
      <Eyebrow>Tablas de referencia</Eyebrow>
      <WindowsCard profile={profile} onSelectProfile={onSelectProfile} open={open === 'win'} onToggle={() => toggle('win')} />
      <SampleDayCard profile={profile} open={open === 'day'} onToggle={() => toggle('day')} />
      <RegressionsCard profile={profile} open={open === 'reg'} onToggle={() => toggle('reg')} />
    </View>
  );
}

function Card({ icon, title, sub, open, onToggle, children }) {
  return (
    <View style={{ borderRadius: 15, borderWidth: 1, borderColor: '#E4DCD0', backgroundColor: 'white', paddingHorizontal: 14, paddingVertical: 13 }}>
      <Pressable onPress={onToggle} style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
        <View style={{ height: 32, width: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F1FB' }}>
          <Text style={{ fontSize: 14, color: '#6B5DD3' }}>{icon}</Text>
        </View>
        <View style={{ flex: 1, gap: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '500', color: '#16162B' }}>{title}</Text>
          <Text style={{ fontSize: 12, color: '#8A8299' }}>{sub}</Text>
        </View>
        <Text style={{ fontSize: 15, color: '#A9A2B5' }}>{open ? '︿' : '⌄'}</Text>
      </Pressable>
      {open ? children : null}
    </View>
  );
}

/** Ventanas de vigilia por edad. Tocar una fila previsualiza esa etapa acá abajo. */
function WindowsCard({ profile, onSelectProfile, open, onToggle }) {
  return (
    <Card icon="◷" title="Ventanas de vigilia por edad" sub="Cuánto puede estar despierto antes de dormir" open={open} onToggle={onToggle}>
      <View style={{ gap: 2, paddingTop: 13 }}>
        <View style={{ flexDirection: 'row', gap: 8, borderBottomWidth: 1, borderBottomColor: '#E4DCD0', paddingHorizontal: 9, paddingBottom: 7 }}>
          <Text style={{ width: 68, fontFamily: theme.fontFamily.mono, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', color: '#8A8299' }}>Edad</Text>
          <Text style={{ flex: 1, fontFamily: theme.fontFamily.mono, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', color: '#8A8299' }}>Ventana</Text>
          <Text style={{ width: 54, textAlign: 'right', fontFamily: theme.fontFamily.mono, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', color: '#8A8299' }}>Siestas</Text>
        </View>
        {PROFILES.map((pr) => {
          const on = pr.id === profile.id;
          return (
            <Pressable
              key={pr.id}
              onPress={() => onSelectProfile(pr.id)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 9, padding: 9, backgroundColor: on ? '#F6F1FB' : 'transparent' }}
            >
              <Text style={{ width: 68, fontFamily: theme.fontFamily.mono, fontSize: 12.5, color: on ? '#6B5DD3' : '#8A8299' }}>{pr.short}</Text>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: on ? '500' : '400', color: on ? '#16162B' : '#4A4459' }}>{pr.window}</Text>
              <Text style={{ width: 54, textAlign: 'right', fontFamily: theme.fontFamily.mono, fontSize: 13, color: on ? '#6B5DD3' : '#8A8299' }}>{pr.napsLabel}</Text>
            </Pressable>
          );
        })}
        <Text style={{ paddingHorizontal: 9, paddingTop: 10, fontSize: 11.5, lineHeight: 11.5 * 1.5, color: '#A9A2B5' }}>
          A los {profile.short} la ventana es de {profile.window}. Toca otra edad para ver esa etapa.
        </Text>
      </View>
    </Card>
  );
}

/** Un día de ejemplo, resuelto por lib/sampleDay.js para la edad activa. */
function SampleDayCard({ profile, open, onToggle }) {
  const day = solveSampleDay(profile);
  return (
    <Card
      icon="❏"
      title="Un día de ejemplo"
      sub={'Despertar ' + day.wake + ' · ' + day.naps + ' siesta(s) · a la cama ' + day.bed}
      open={open}
      onToggle={onToggle}
    >
      <View style={{ gap: 11, paddingTop: 13 }}>
        <View>
          {day.rows.map((r, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingVertical: 9, borderBottomWidth: i === day.rows.length - 1 ? 0 : 1, borderBottomColor: '#F0EAE0' }}>
              <Text style={{ minWidth: 44, fontFamily: theme.fontFamily.mono, fontSize: 13, color: '#16162B' }}>{r.time}</Text>
              <View style={{ marginTop: 5, height: 8, width: 8, borderRadius: 99, backgroundColor: r.tone }} />
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={{ fontSize: 14, lineHeight: 14 * 1.4, color: '#4A4459' }}>{r.what}</Text>
                {r.detail ? <Text style={{ fontSize: 11.5, color: '#A9A2B5' }}>{r.detail}</Text> : null}
              </View>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {day.chips.map((c) => (
            <Text key={c} style={{ borderRadius: 99, borderWidth: 1, borderColor: '#E4DCD0', backgroundColor: '#FBF7F0', paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, color: '#4A4459' }}>{c}</Text>
          ))}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 12, borderWidth: 1, borderColor: '#EFDCC4', backgroundColor: '#FFF9F0', paddingHorizontal: 12, paddingVertical: 11 }}>
          <View style={{ height: 20, width: 20, borderRadius: 99, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5E3C8' }}>
            <Text style={{ fontSize: 11, color: '#B08A55' }}>i</Text>
          </View>
          <Text style={{ flex: 1, fontSize: 12.5, lineHeight: 12.5 * 1.5, color: '#4A4459' }}>{SAMPLE_DAY_TWINS}</Text>
        </View>

        <Text style={{ fontSize: 11.5, lineHeight: 11.5 * 1.5, color: '#A9A2B5' }}>{SAMPLE_DAY_DISCLAIMER}</Text>
      </View>
    </Card>
  );
}

/** Regresiones: qué son y cuándo. Se resalta la que corresponde a la edad activa. */
function RegressionsCard({ profile, open, onToggle }) {
  const now = regressionsForAge(profile.id);
  return (
    <Card
      icon="◔"
      title="Regresiones: qué son y cuándo"
      sub={now.length ? 'A su edad: ' + now.map((r) => r.age).join(' y ') : 'Qué esperar en cada salto'}
      open={open}
      onToggle={onToggle}
    >
      <View style={{ gap: 12, paddingTop: 13 }}>
        <Text style={{ fontSize: 14, lineHeight: 14 * 1.55, color: '#4A4459' }}>{REGRESSION_INTRO}</Text>

        <View style={{ gap: 9 }}>
          {REGRESSIONS.map((r) => {
            const on = r.ages.indexOf(profile.id) >= 0;
            return (
              <View
                key={r.age}
                style={{ gap: 7, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 12, backgroundColor: on ? '#F6F1FB' : '#FBF7F0', borderWidth: 1, borderColor: on ? '#C9C1D8' : '#EFE9DF' }}
              >
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 8 }}>
                  <Text style={{ fontSize: 14.5, fontWeight: '500', color: on ? '#6B5DD3' : '#16162B' }}>{r.age}</Text>
                  <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 11, color: '#8A8299' }}>{r.when}</Text>
                  <Text style={{ marginLeft: 'auto', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, fontSize: 11, color: '#4A4459', backgroundColor: on ? '#E8DFF6' : 'white', borderWidth: 1, borderColor: on ? '#C9C1D8' : '#E4DCD0' }}>{r.dur}</Text>
                </View>
                <Text style={{ fontSize: 13.5, lineHeight: 13.5 * 1.5, color: '#4A4459' }}>{r.what}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                  <Text style={{ fontSize: 11, color: '#C6BFB2' }}>→</Text>
                  <Text style={{ flex: 1, fontSize: 12.5, lineHeight: 12.5 * 1.45, color: '#8A8299' }}>{r.sign}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ gap: 8, borderRadius: 12, borderWidth: 1, borderColor: '#C9DED4', backgroundColor: '#F3F7F4', paddingHorizontal: 13, paddingVertical: 12 }}>
          <Eyebrow tone="#3F7A62" size={10.5} tracking={0.9}>Mientras dura</Eyebrow>
          {REGRESSION_DO.map((d) => (
            <View key={d} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <Text style={{ fontSize: 12, color: '#7FB09A' }}>·</Text>
              <Text style={{ flex: 1, fontSize: 13.5, lineHeight: 13.5 * 1.5, color: '#4A4459' }}>{d}</Text>
            </View>
          ))}
        </View>

        <Text style={{ fontSize: 11.5, lineHeight: 11.5 * 1.5, color: '#A9A2B5' }}>{REGRESSION_TWINS}</Text>
      </View>
    </Card>
  );
}
