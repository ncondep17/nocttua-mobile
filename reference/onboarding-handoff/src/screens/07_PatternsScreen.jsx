import { NightCanvas, StatusBar, StepHeader, StepFooter, Headline, GlassCard, BACKGROUNDS } from '../components/OnboardingChrome';

/**
 * 07 · Patrones y reportes
 * Barras de 7 días con degradado de importancia deliberado:
 *   días 1-3 #4A4A7A (pasado lejano) · 4-6 #A79FE0 (semana en curso) · 7 #F0A868 (hoy)
 * Alturas exactas en porcentaje: 48 62 44 70 78 66 88 sobre una caja de 84px.
 */
const BARS = [
  { h: '48%', c: '#4A4A7A' }, { h: '62%', c: '#4A4A7A' }, { h: '44%', c: '#4A4A7A' },
  { h: '70%', c: '#A79FE0' }, { h: '78%', c: '#A79FE0' }, { h: '66%', c: '#A79FE0' },
  { h: '88%', c: '#F0A868' },
];

export function PatternsScreen({ onNext, onSkip }) {
  const bar = (label, pct, color) => (
    <span className="flex items-center gap-[8px]">
      <span className="w-[56px] text-[11.5px] text-[#B9B2C9]">{label}</span>
      <span className="h-[7px] flex-1 overflow-hidden rounded-[99px] bg-[#33335F]">
        <span style={{ width: pct, background: color }} className="block h-full rounded-[99px]" />
      </span>
    </span>
  );

  return (
    <NightCanvas background={BACKGROUNDS.noche}>
      <StatusBar />
      <StepHeader label="Patrones" onSkip={onSkip} />
      <div className="flex flex-1 flex-col justify-between px-[26px] pb-[30px] pt-[24px]">
        <Headline
          title="Ves qué mueve la aguja, no solo la noche de ayer."
          body="Cuánto durmió, cuánto tomó y cómo se relacionan. Una mala noche no dice nada; la semana sí."
        />

        <GlassCard gap={13}>
          <div className="flex items-baseline justify-between">
            <span className="text-[14px] font-medium text-[#FBF7F0]">Últimos 7 días</span>
            <span className="font-mono text-[12px] text-[#7FB09A]">+42 min de noche</span>
          </div>
          <div className="flex h-[84px] items-end gap-[9px]">
            {BARS.map((b, i) => <span key={i} style={{ height: b.h, background: b.c }} className="flex-1 rounded-[6px]" />)}
          </div>
          <div className="flex flex-col gap-[6px]">
            {bar('Tomas', '72%', '#C2703F')}
            {bar('Extracción', '45%', '#7FB09A')}
          </div>
          <span className="text-[12.5px] leading-[1.5] text-[#B9B2C9]">Si el pediatra lo pide, lo exportas en un toque.</span>
        </GlassCard>

        <StepFooter active={4} onNext={onNext} />
      </div>
    </NightCanvas>
  );
}
export default PatternsScreen;
