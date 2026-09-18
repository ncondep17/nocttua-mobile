import { useState } from 'react';
import { Eyebrow } from '../../components/primitives';
import { FullScreen } from '../../components/MobileChrome';
import { ADVISOR } from '../../data/records';

/**
 * Código de asesora — paso 4 de 5 del onboarding, y también accesible desde Cuidado.
 * Es la puerta del modelo de negocio: una familia que entra con código usa la app
 * gratis y la asesora ve sus registros en tiempo real.
 *
 * El CTA arranca deshabilitado (crema) y se vuelve noche cuando el código valida.
 * La tarjeta verde de confirmación aparece con riseIn: es el momento de alivio.
 */
export function AdvisorCodeScreen({ onClose, onLink }) {
  const [code, setCode] = useState('');
  const matched = code === ADVISOR.code;

  return (
    <FullScreen>
      <div className="flex shrink-0 flex-col gap-[9px] px-[22px] pb-[10px] pt-[16px]">
        <div className="flex items-center justify-between">
          <span onClick={onClose} className="grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-[99px] border border-[#DCD4C8] text-[14px] text-[#4A4459]">←</span>
          <Eyebrow>Paso 4 de 5</Eyebrow>
          <span onClick={onClose} className="cursor-pointer text-[14px] text-[#8A8299]">Omitir</span>
        </div>
        <div className="h-[3px] rounded-[99px] bg-[#E4DCD0]">
          <div className="h-full w-[80%] rounded-[99px] bg-[#6B5DD3]" />
        </div>
      </div>

      <div className="no-bars flex min-h-0 flex-1 flex-col gap-[14px] overflow-auto px-[22px] pt-[14px]">
        <div className="flex flex-col gap-[8px]">
          <span className="grid h-[44px] w-[44px] place-items-center rounded-[14px] bg-[#DCEDE4] text-[19px] text-[#3F7A62]">◇</span>
          <span className="font-display-app text-[30px] leading-[1.1] text-[#16162B]">¿Tenés una asesora de sueño?</span>
          <span className="text-[14.5px] leading-[1.5] text-[#6E6878]">
            Si estás trabajando con una, ingresá su código y verá tus registros para armarte el plan. Podés hacerlo después.
          </span>
        </div>

        <div className="flex flex-col gap-[8px]">
          <Eyebrow>Código de la asesora</Eyebrow>
          <div className="flex gap-[7px]">
            {ADVISOR.code.split('').map((ch, i) => {
              const filled = i < code.length;
              return (
                <div key={i}
                  style={{
                    flex: 1, height: 52, borderRadius: 12, background: filled ? '#FFFFFF' : '#F3EEE6',
                    border: '1.5px solid ' + (filled ? '#6B5DD3' : '#DCD4C8'),
                  }}
                  className="grid place-items-center font-mono text-[21px] tracking-[.06em] text-[#16162B]">
                  {filled ? code[i] : ''}
                </div>
              );
            })}
          </div>

          {matched ? (
            <div className="flex animate-riseIn items-center gap-[11px] rounded-[13px] border border-[#C9DED4] bg-[#F3F7F4] px-[13px] py-[12px]">
              <span className="grid h-[34px] w-[34px] place-items-center rounded-[99px] bg-[#DCEDE4] text-[13px] font-bold text-[#3F7A62]">C</span>
              <div className="flex-1 leading-[1.3]">
                <div className="text-[15px] font-medium text-[#16162B]">{ADVISOR.name}</div>
                <div className="text-[12.5px] text-[#3F7A62]">Asesora de sueño certificada</div>
              </div>
              <span className="text-[15px] text-[#3F7A62]">✓</span>
            </div>
          ) : null}

          {/* En producción esto es el teclado del sistema + pegar del portapapeles. */}
          <div className="flex flex-wrap gap-[7px]">
            {[
              { label: 'Pegar código', act: () => setCode(ADVISOR.code) },
              { label: '＋ una letra', act: () => setCode(ADVISOR.code.slice(0, Math.min(6, code.length + 1))) },
              { label: 'Borrar', act: () => setCode('') },
            ].map(k => (
              <span key={k.label} onClick={k.act}
                className="cursor-pointer rounded-[99px] border border-[#DCD4C8] bg-white px-[12px] py-[8px] text-[13px] text-[#4A4459]">{k.label}</span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-[8px] rounded-[14px] border border-[#E4DCD0] bg-white px-[14px] py-[13px]">
          <span className="text-[13.5px] font-medium text-[#16162B]">Qué pasa cuando la vinculás</span>
          {[
            'Ve tus registros en tiempo real, sin que le mandes nada.',
            'Te arma el plan dentro de la app y lo ajusta cada semana.',
            'Vos y la niñera siguen registrando igual. Nada cambia del día a día.',
          ].map(t => (
            <div key={t} className="flex items-baseline gap-[8px]">
              <span className="text-[12px] text-[#C6BFB2]">→</span>
              <span className="text-[13.5px] leading-[1.45] text-[#6E6878]">{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-[9px] px-[22px] pb-[24px] pt-[12px]">
        <div onClick={matched ? onLink : onClose}
          style={{ minHeight: 52, background: matched ? '#16162B' : '#E4DCD0', color: matched ? '#FBF7F0' : '#8A8299' }}
          className="grid cursor-pointer place-items-center rounded-[14px] text-[16.5px] font-medium">
          {matched ? 'Vincular con Carolina' : 'Continuar'}
        </div>
        <div onClick={onClose} className="cursor-pointer text-center text-[14.5px] text-[#8A8299]">Todavía no tengo asesora</div>
      </div>
    </FullScreen>
  );
}
export default AdvisorCodeScreen;
