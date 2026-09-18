import { NightCanvas, StatusBar, Headline, CreamButton, Twinkle, BACKGROUNDS } from '../components/OnboardingChrome';

/**
 * 01 · Bienvenida
 * Fondo ámbar-abajo. Contenido anclado al FONDO (justify-end), no centrado.
 * El logotipo Nocttua (wordmark recortado al glifo) abre la pantalla a 120px, opacidad .92:
 * a mayor tamaño compite con el titular, que es de la misma familia serif.
 * Titular 38px — el más grande del flujo junto al 10.
 * Entra con riseIn .6s (opacidad 0→1, translateY 14px→0).
 */
export function WelcomeScreen({ onStart, onSignIn }) {
  return (
    <NightCanvas background={BACKGROUNDS.ambarAbajo}>
      <StatusBar />
      <Twinkle top={118} left={50} size={12} color="#F0A868" duration={4} />
      <Twinkle top={186} right={62} size={9} color="#C9C1D8" duration={5.5} />

      <div className="flex flex-1 animate-[riseIn_.6s_ease_both] flex-col justify-end gap-[22px] px-[26px] pb-[34px]">
        <img src="/assets/wordmark-tight-crema.svg" alt="Nocttua" className="block w-[120px] opacity-[.92]" />
        <Headline
          size={38}
          gap={12}
          bodySize={15.5}
          title="Un bebé o dos. Todo en el mismo lugar."
          body="Sueño, tomas, lactancia y extracción. Nocttua guarda lo que pasó y te dice qué sigue."
        />
        <div className="flex flex-col gap-[12px]">
          <CreamButton onClick={onStart}>Empezar</CreamButton>
          <button type="button" onClick={onSignIn} className="text-center text-[14px] text-[#B9B2C9]">Ya tengo cuenta</button>
        </div>
      </div>
    </NightCanvas>
  );
}
export default WelcomeScreen;
