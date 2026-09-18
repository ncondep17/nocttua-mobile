import { useState } from 'react';
import { NightCanvas, StatusBar, StepHeader, StepFooter, Headline, BACKGROUNDS } from '../components/OnboardingChrome';

/**
 * 02 · Uno o dos bebés — LA pantalla que decide toda la app.
 * Dos tarjetas lado a lado + tarjeta de vidrio que demuestra el paralelo.
 * Bebé A violeta #A79FE0 · Bebé B terracota #C2703F. Nunca al revés.
 * Seleccionada: borde 1.5px #6B5DD3 sobre rgba(107,93,211,.18) + check de 17px.
 */
export function BabyCountScreen({ onNext, onSkip, onSelect }) {
  const [sel, setSel] = useState('two');

  const card = (id, title, body) => {
    const on = sel === id;
    return (
      <button type="button" onClick={() => { setSel(id); onSelect && onSelect(id); }}
        style={{ borderWidth: on ? 1.5 : 1, background: on ? 'rgba(107,93,211,.18)' : 'transparent' }}
        className={['flex flex-1 flex-col gap-[6px] rounded-[16px] p-[14px] text-left', on ? 'border-[#6B5DD3]' : 'border-[#4A4A7A]'].join(' ')}>
        <span className="flex items-center justify-between">
          <span className="text-[15px] font-medium text-[#FBF7F0]">{title}</span>
          {on ? <span className="flex h-[17px] w-[17px] items-center justify-center rounded-[99px] bg-[#6B5DD3] text-[10.5px] text-[#FBF7F0]">✓</span> : null}
        </span>
        <span className={['text-[12.5px] leading-[1.45]', on ? 'text-[#D6D0E4]' : 'text-[#B9B2C9]'].join(' ')}>{body}</span>
      </button>
    );
  };

  const baby = (dot, name, data) => (
    <span className="flex flex-1 flex-col gap-[4px]">
      <span className="flex items-center gap-[7px]">
        <span style={{ background: dot }} className="h-[8px] w-[8px] rounded-[99px]" />
        <span className="text-[13.5px] text-[#FBF7F0]">{name}</span>
      </span>
      <span className="font-mono text-[13px] text-[#B9B2C9]">{data}</span>
    </span>
  );

  return (
    <NightCanvas background={BACKGROUNDS.noche}>
      <StatusBar />
      <StepHeader label="Tu casa" onSkip={onSkip} />
      <div className="flex flex-1 flex-col justify-between px-[26px] pb-[30px] pt-[24px]">
        <Headline
          title="¿Cuántos bebés estás siguiendo?"
          body="Con uno, Nocttua te quita el cuaderno de encima. Con dos, te quita el caos: nadie más los sigue en paralelo de verdad."
        />

        <div className="flex flex-col gap-[11px]">
          <div className="flex gap-[10px]">
            {card('one', 'Un bebé', 'Una sola línea de tiempo, sin ruido.')}
            {card('two', 'Dos bebés', 'Cada uno con su ritmo, en una pantalla.')}
          </div>
          <div className="flex flex-col gap-[11px] rounded-[18px] border border-[#4A4A7A] bg-[rgba(251,247,240,.07)] p-[15px]">
            <div className="flex gap-[10px]">
              {baby('#A79FE0', 'Bebé A', 'durmió 4h · 3 tomas')}
              {baby('#C2703F', 'Bebé B', 'durmió 5h · 4 tomas')}
            </div>
            <span className="text-[12.5px] leading-[1.5] text-[#D6D0E4]">Registras a uno y te ofrecemos copiar al otro. Si van desfasados, cada uno mantiene su horario.</span>
          </div>
        </div>

        <StepFooter active={0} onNext={onNext} />
      </div>
    </NightCanvas>
  );
}
export default BabyCountScreen;
