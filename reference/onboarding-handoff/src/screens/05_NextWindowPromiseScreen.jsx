import { NightCanvas, StatusBar, StepHeader, StepFooter, Headline, BACKGROUNDS } from '../components/OnboardingChrome';

/**
 * 05 · PRÓXIMA VENTANA — PROMESA CRÍTICA
 * ─────────────────────────────────────────────────────────────────────────────
 * Esta pantalla VENDE un servicio de severidad 1. Si el aviso no llega, la
 * familia pierde la ventana y la app deja de ser un sistema funcional.
 * Antes de implementarla, leer CONTRATO-AVISO-VENTANA.md — es obligatorio.
 * ─────────────────────────────────────────────────────────────────────────────
 * Fondo ámbar-arriba (el único del flujo). Tres bloques:
 *   1. Titular + párrafo
 *   2. Notificación crema simulada, con sombra 0 16px 34px -14px
 *   3. Caja "Compromiso del sistema" con borde, sin relleno
 */
export function NextWindowPromiseScreen({ onNext, onSkip }) {
  return (
    <NightCanvas background={BACKGROUNDS.ambarArriba}>
      <StatusBar />
      <StepHeader label="La promesa" onSkip={onSkip} />
      <div className="flex flex-1 flex-col justify-between px-[26px] pb-[30px] pt-[22px]">
        <Headline
          size={32} gap={12} bodySize={14.5}
          title="Te avisamos cuál es la próxima ventana."
          body="Con lo que registras — siestas del día, última toma, despertares — calculamos el horario que le conviene hoy. No tienes que abrir la app ni hacer cuentas."
        />

        {/* Notificación real del sistema, en crema sobre la noche */}
        <div className="flex items-start gap-[12px] rounded-[18px] bg-[#FBF7F0] px-[15px] py-[14px] shadow-[0_16px_34px_-14px_rgba(22,22,43,.6)]">
          <img src="/assets/iso-noche.svg" alt="" className="mt-[2px] h-[26px] w-[26px]" />
          <span className="flex flex-col gap-[3px]">
            <span className="flex items-baseline justify-between gap-[8px]">
              <span className="text-[13.5px] font-bold text-[#16162B]">Nocttua</span>
              <span className="font-mono text-[11px] text-[#8A8299]">ahora</span>
            </span>
            <span className="text-[13.5px] leading-[1.45] text-[#16162B]">Bebé A: ventana 12:30. Última toma 10:20, conviene ofrecer antes de dormir.</span>
          </span>
        </div>

        <div className="flex flex-col gap-[8px] rounded-[18px] border border-[#4A4A7A] p-[15px]">
          <span className="font-mono text-[10.5px] uppercase tracking-[.1em] text-[#F0A868]">Compromiso del sistema</span>
          <span className="text-[12.5px] leading-[1.55] text-[#D6D0E4]">El aviso se programa en tu teléfono, no en un servidor. Llega con o sin internet.</span>
        </div>

        <StepFooter active={3} onNext={onNext} />
      </div>
    </NightCanvas>
  );
}
export default NextWindowPromiseScreen;
