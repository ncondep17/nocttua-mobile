import { useState } from 'react';
import { PROFILES } from '../data/profiles';
import { solveSampleDay, SAMPLE_DAY_DISCLAIMER, SAMPLE_DAY_TWINS } from '../lib/sampleDay';
import { REGRESSIONS, REGRESSION_INTRO, REGRESSION_DO, REGRESSION_TWINS, regressionsForAge } from '../data/regressions';

/**
 * TABLAS DE REFERENCIA — arriba de "Por tema" en la pestaña Tips.
 * Tres acordeones, cerrados por defecto. Todo se deriva del perfil de edad
 * activo: no hay imágenes ni tablas fijas, cambiar de edad recalcula las tres.
 */
export function ReferenceCards({ profile, onSelectProfile }) {
  const [open, setOpen] = useState(null); // 'win' | 'day' | 'reg' | null
  const toggle = k => setOpen(open === k ? null : k);
  return (
    <div className="flex flex-col gap-[10px]">
      <span className="font-mono text-[11px] uppercase tracking-[.1em] text-[#8A8299]">Tablas de referencia</span>
      <WindowsCard profile={profile} onSelectProfile={onSelectProfile} open={open === 'win'} onToggle={() => toggle('win')} />
      <SampleDayCard profile={profile} open={open === 'day'} onToggle={() => toggle('day')} />
      <RegressionsCard profile={profile} open={open === 'reg'} onToggle={() => toggle('reg')} />
    </div>
  );
}

const Card = ({ icon, title, sub, open, onToggle, children }) => (
  <div className="flex flex-col rounded-[15px] border border-[#E4DCD0] bg-white px-[14px] py-[13px]">
    <div onClick={onToggle} className="flex cursor-pointer items-center gap-[11px]">
      <span className="grid h-[32px] w-[32px] flex-shrink-0 place-items-center rounded-[10px] bg-[#F6F1FB] text-[14px] text-[#6B5DD3]">{icon}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-[1px]">
        <span className="text-[15px] font-medium text-[#16162B]">{title}</span>
        <span className="text-[12px] text-[#8A8299]">{sub}</span>
      </div>
      <span className="text-[15px] text-[#A9A2B5] transition-transform" style={{ transform: 'rotate(' + (open ? 180 : 0) + 'deg)' }}>⌄</span>
    </div>
    {open && children}
  </div>
);

/** Ventanas de vigilia por edad. Tocar una fila cambia el perfil de toda la app. */
function WindowsCard({ profile, onSelectProfile, open, onToggle }) {
  return (
    <Card icon="◷" title="Ventanas de vigilia por edad" sub="Cuánto puede estar despierta antes de dormir" open={open} onToggle={onToggle}>
      <div className="flex flex-col gap-[2px] pt-[13px]">
        <div className="grid grid-cols-[68px_1fr_54px] gap-[8px] border-b border-[#E4DCD0] px-[9px] pb-[7px]">
          <span className="font-mono text-[10px] uppercase tracking-[.08em] text-[#8A8299]">Edad</span>
          <span className="font-mono text-[10px] uppercase tracking-[.08em] text-[#8A8299]">Ventana</span>
          <span className="text-right font-mono text-[10px] uppercase tracking-[.08em] text-[#8A8299]">Siestas</span>
        </div>
        {PROFILES.map(pr => {
          const on = pr.id === profile.id;
          return (
            <div
              key={pr.id}
              onClick={() => onSelectProfile(pr.id)}
              className="grid cursor-pointer grid-cols-[68px_1fr_54px] items-center gap-[8px] rounded-[9px] p-[9px]"
              style={{ background: on ? '#F6F1FB' : 'transparent' }}
            >
              <span className="font-mono text-[12.5px]" style={{ color: on ? '#6B5DD3' : '#8A8299' }}>{pr.short}</span>
              <span className="text-[14px]" style={{ color: on ? '#16162B' : '#4A4459', fontWeight: on ? 500 : 400 }}>{pr.window}</span>
              <span className="text-right font-mono text-[13px]" style={{ color: on ? '#6B5DD3' : '#8A8299' }}>{pr.napsLabel}</span>
            </div>
          );
        })}
        <span className="px-[9px] pt-[10px] text-[11.5px] leading-[1.5] text-[#A9A2B5]">
          Ahora Mía y Lía están en {profile.short}: ventana de {profile.window}. Tu asesora ajustó el objetivo a {profile.windowTarget}. Tocá otra edad para ver esa etapa.
        </span>
      </div>
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
      <div className="flex flex-col gap-[11px] pt-[13px]">
        <div className="flex flex-col">
          {day.rows.map((r, i) => (
            <div key={i} className="flex items-start gap-[11px] py-[9px]" style={{ borderBottom: i === day.rows.length - 1 ? 'none' : '1px solid #F0EAE0' }}>
              <span className="min-w-[44px] font-mono text-[13px] text-[#16162B]">{r.time}</span>
              <span className="mt-[5px] h-[8px] w-[8px] flex-shrink-0 rounded-full" style={{ background: r.tone }} />
              <div className="flex min-w-0 flex-1 flex-col gap-[1px]">
                <span className="text-[14px] leading-[1.4] text-[#4A4459]">{r.what}</span>
                <span className="text-[11.5px] text-[#A9A2B5]">{r.detail}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-[8px]">
          {day.chips.map(c => (
            <span key={c} className="rounded-full border border-[#E4DCD0] bg-[#FBF7F0] px-[10px] py-[6px] text-[12px] text-[#4A4459]">{c}</span>
          ))}
        </div>

        <div className="flex items-start gap-[9px] rounded-[12px] border border-[#EFDCC4] bg-[#FFF9F0] px-[12px] py-[11px]">
          <span className="grid h-[20px] w-[20px] flex-shrink-0 place-items-center rounded-full bg-[#F5E3C8] text-[11px] text-[#B08A55]">i</span>
          <span className="text-[12.5px] leading-[1.5] text-[#4A4459]">{SAMPLE_DAY_TWINS}</span>
        </div>

        <span className="text-[11.5px] leading-[1.5] text-[#A9A2B5]">{SAMPLE_DAY_DISCLAIMER}</span>
      </div>
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
      sub={now.length ? 'A su edad: ' + now.map(r => r.age).join(' y ') : 'Qué esperar en cada salto'}
      open={open}
      onToggle={onToggle}
    >
      <div className="flex flex-col gap-[12px] pt-[13px]">
        <span className="text-[14px] leading-[1.55] text-[#4A4459]">{REGRESSION_INTRO}</span>

        <div className="flex flex-col gap-[9px]">
          {REGRESSIONS.map(r => {
            const on = r.ages.indexOf(profile.id) >= 0;
            return (
              <div
                key={r.age}
                className="flex flex-col gap-[7px] rounded-[13px] px-[13px] py-[12px]"
                style={{ background: on ? '#F6F1FB' : '#FBF7F0', border: '1px solid ' + (on ? '#C9C1D8' : '#EFE9DF') }}
              >
                <div className="flex flex-wrap items-baseline gap-[8px]">
                  <span className="text-[14.5px] font-medium" style={{ color: on ? '#6B5DD3' : '#16162B' }}>{r.age}</span>
                  <span className="font-mono text-[11px] text-[#8A8299]">{r.when}</span>
                  <span
                    className="ml-auto rounded-full px-[8px] py-[3px] text-[11px] text-[#4A4459]"
                    style={{ background: on ? '#E8DFF6' : '#fff', border: '1px solid ' + (on ? '#C9C1D8' : '#E4DCD0') }}
                  >
                    {r.dur}
                  </span>
                </div>
                <span className="text-[13.5px] leading-[1.5] text-[#4A4459]">{r.what}</span>
                <div className="flex items-baseline gap-[8px]">
                  <span className="text-[11px] text-[#C6BFB2]">→</span>
                  <span className="text-[12.5px] leading-[1.45] text-[#8A8299]">{r.sign}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-[8px] rounded-[12px] border border-[#C9DED4] bg-[#F3F7F4] px-[13px] py-[12px]">
          <span className="font-mono text-[10.5px] uppercase tracking-[.09em] text-[#3F7A62]">Mientras dura</span>
          {REGRESSION_DO.map(d => (
            <div key={d} className="flex items-baseline gap-[8px]">
              <span className="text-[12px] text-[#7FB09A]">·</span>
              <span className="text-[13.5px] leading-[1.5] text-[#4A4459]">{d}</span>
            </div>
          ))}
        </div>

        <span className="text-[11.5px] leading-[1.5] text-[#A9A2B5]">{REGRESSION_TWINS}</span>
      </div>
    </Card>
  );
}
