import { NightCanvas, StatusBar, Headline, CreamButton, Twinkle, BACKGROUNDS } from '../components/OnboardingChrome';

/**
 * 10 · Listo
 * Cierra con la misma luz ámbar de la 01. La tarjeta de la asesora SOLO se
 * muestra si la cuenta se vinculó en la 09 (prop `advisor`).
 * El CTA pide la primera acción concreta, no felicita.
 */
export function ReadyScreen({ advisor, onLogNow }) {
  return (
    <NightCanvas background={BACKGROUNDS.ambarAbajo}>
      <StatusBar />
      <Twinkle top={148} left={44} size={11} color="#F0A868" duration={4.5} />

      <div className="flex flex-1 flex-col justify-center gap-[22px] px-[26px]">
        <div className="flex flex-col gap-[12px]">
          <span className="font-mono text-[10.5px] uppercase tracking-[.12em] text-[#F0A868]">Listo</span>
          <Headline
            size={34} gap={12}
            title="Ya está. Empieza por lo último que pasó."
            body="Registra la última toma o el último sueño. El resto lo vamos completando solos."
          />
        </div>

        {advisor ? (
          <div className="flex items-center gap-[12px] rounded-[18px] border border-[#4A4A7A] bg-[rgba(251,247,240,.07)] p-[15px]">
            <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[99px] bg-[#4A4A7A] font-display-app text-[17px] text-[#FBF7F0]">{advisor.initial}</span>
            <span className="flex flex-col gap-[2px]">
              <span className="text-[14.5px] font-medium text-[#FBF7F0]">{advisor.name}, tu asesora</span>
              <span className="text-[12.5px] text-[#B9B2C9]">Ve tus registros y te deja notas.</span>
            </span>
          </div>
        ) : null}

        <CreamButton onClick={onLogNow}>Registrar ahora</CreamButton>
      </div>
    </NightCanvas>
  );
}
export default ReadyScreen;
