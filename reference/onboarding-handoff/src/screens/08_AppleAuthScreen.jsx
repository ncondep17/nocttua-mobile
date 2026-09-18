import { NightCanvas, StatusBar, Headline, BACKGROUNDS } from '../components/OnboardingChrome';

/**
 * 08 · Acceso con Apple
 * Un solo camino: Apple. No hay Google ni correo en este flujo.
 * Fondo violeta-abajo. Contenido centrado, gap 26.
 */
export function AppleAuthScreen({ onApple, onTerms, onPrivacy }) {
  return (
    <NightCanvas background={BACKGROUNDS.violetaAbajo}>
      <StatusBar />
      <div className="flex flex-1 flex-col justify-center gap-[26px] px-[26px]">
        <div className="flex flex-col gap-[12px]">
          <img src="/assets/iso-crema.svg" alt="" className="h-[38px] w-[38px]" />
          <Headline title="Entra en dos toques." body="Sin contraseñas nuevas que recordar a las tres de la mañana." />
        </div>

        <div className="flex flex-col gap-[12px]">
          <button type="button" onClick={onApple}
            className="flex items-center justify-center gap-[9px] rounded-[14px] bg-[#FBF7F0] px-[16px] py-[16px] text-[16px] font-medium text-[#16162B]">
            <span className="text-[18px] leading-none"></span>Continuar con Apple
          </button>
          <span className="text-center text-[12.5px] leading-[1.55] text-[#B9B2C9]">Puedes ocultar tu correo. Guardamos solo lo necesario para tus registros.</span>
        </div>

        <span className="text-center text-[12px] leading-[1.6] text-[#8E87B5]">
          Al continuar aceptas los <button type="button" onClick={onTerms} className="text-[#C9C1D8]">Términos</button> y la <button type="button" onClick={onPrivacy} className="text-[#C9C1D8]">Privacidad</button>.
        </span>
      </div>
    </NightCanvas>
  );
}
export default AppleAuthScreen;
