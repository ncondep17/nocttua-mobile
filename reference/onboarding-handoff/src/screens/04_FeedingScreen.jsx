import { NightCanvas, StatusBar, StepHeader, StepFooter, Headline, GlassCard, BACKGROUNDS } from '../components/OnboardingChrome';

/**
 * 04 · Lactancia y extracción
 * Tres cajas de dato (lado izq., lado der., fórmula) + línea de reserva separada
 * por un borde superior #4A4A7A. La cifra de reserva va en verde #7FB09A.
 */
export function FeedingScreen({ onNext, onSkip }) {
  const box = (label, value) => (
    <span className="flex flex-1 flex-col gap-[3px] rounded-[14px] border border-[#6E6890] p-[11px]">
      <span className="text-[12px] text-[#B9B2C9]">{label}</span>
      <span className="font-mono text-[17px] text-[#FBF7F0]">{value}</span>
    </span>
  );

  return (
    <NightCanvas background={BACKGROUNDS.noche}>
      <StatusBar />
      <StepHeader label="Lactancia" onSkip={onSkip} />
      <div className="flex flex-1 flex-col justify-between px-[26px] pb-[30px] pt-[24px]">
        <Headline
          title="Pecho, fórmula y extracción en el mismo registro."
          body="Qué lado tocaba, cuántos minutos, cuántos ml y qué te queda en reserva. Sin cuadernos ni notas del teléfono."
        />

        <GlassCard gap={13}>
          <div className="flex items-baseline justify-between">
            <span className="text-[14px] font-medium text-[#FBF7F0]">Última toma</span>
            <span className="font-mono text-[12.5px] text-[#F0A868]">hace 2h 10</span>
          </div>
          <div className="flex gap-[9px]">
            {box('Pecho izq.', '12 min')}
            {box('Pecho der.', '9 min')}
            {box('Fórmula', '60 ml')}
          </div>
          <div className="flex items-center justify-between border-t border-[#4A4A7A] pt-[11px]">
            <span className="text-[13px] text-[#D6D0E4]">Extracción de hoy</span>
            <span className="font-mono text-[13px] text-[#7FB09A]">120 ml · reserva 640 ml</span>
          </div>
          <span className="text-[12.5px] leading-[1.5] text-[#B9B2C9]">Te avisamos de qué lado toca la próxima, para no adivinar.</span>
        </GlassCard>

        <StepFooter active={2} onNext={onNext} />
      </div>
    </NightCanvas>
  );
}
export default FeedingScreen;
