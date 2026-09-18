import { NightCanvas, StatusBar, StepHeader, StepFooter, Headline, GlassCard, BACKGROUNDS } from '../components/OnboardingChrome';

/**
 * 03 · Registro de sueño y tomas
 * Muestra la hoja real de registro: pregunta "¿Qué pasó?" + rejilla 2×2 + selector de bebé.
 * La opción activa es crema con texto noche; las demás, borde #6E6890.
 */
export function LoggingScreen({ onNext, onSkip }) {
  const cell = (label, active = false, dim = false) => (
    <span className={['rounded-[12px] p-[12px] text-center text-[14.5px]',
      active ? 'bg-[#FBF7F0] font-medium text-[#16162B]' : 'border border-[#6E6890] ' + (dim ? 'text-[#D6D0E4]' : 'text-[#FBF7F0]')].join(' ')}>{label}</span>
  );
  const pill = (label, active = false) => (
    <span className={['flex-1 rounded-[99px] border border-[#6E6890] p-[9px] text-center text-[13px]',
      active ? 'bg-[rgba(107,93,211,.2)] text-[#FBF7F0]' : 'text-[#D6D0E4]'].join(' ')}>{label}</span>
  );

  return (
    <NightCanvas background={BACKGROUNDS.noche}>
      <StatusBar />
      <StepHeader label="Registro" onSkip={onSkip} />
      <div className="flex flex-1 flex-col justify-between px-[26px] pb-[30px] pt-[24px]">
        <Headline
          title="Sueño y tomas, con un toque cada uno."
          body="Se durmió, despertó, tomó o no tomó. No hace falta anotar cada microsiesta: lo importante es lo que arma la rutina."
        />

        <GlassCard>
          <div className="flex items-baseline justify-between">
            <span className="font-display-app text-[25px] text-[#FBF7F0]">¿Qué pasó?</span>
            <span className="font-mono text-[14px] text-[#F0A868]">20:12</span>
          </div>
          <div className="grid grid-cols-2 gap-[8px]">
            {cell('Se durmió', true)}
            {cell('Tomó leche')}
            {cell('Pañal', false, true)}
            {cell('Nota', false, true)}
          </div>
          <div className="flex gap-[8px]">{pill('Bebé A', true)}{pill('Bebé B')}{pill('Los dos')}</div>
          <span className="text-[12.5px] leading-[1.5] text-[#B9B2C9]">Lo corriges a la mañana, cuando estés despierta.</span>
        </GlassCard>

        <StepFooter active={1} onNext={onNext} />
      </div>
    </NightCanvas>
  );
}
export default LoggingScreen;
