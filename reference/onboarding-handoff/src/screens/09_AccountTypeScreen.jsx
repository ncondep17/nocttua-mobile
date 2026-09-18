import { useState } from 'react';
import { NightCanvas, StatusBar, Headline, BACKGROUNDS } from '../components/OnboardingChrome';

/**
 * 09 · Individual o invitada
 * Padding lateral 24 (no 26): las tarjetas necesitan ese ancho extra.
 * La tarjeta de asesora despliega el campo de código con botón "Pegar" crema.
 * El campo muestra el formato real del link: nocttua.app/c/…
 */
export function AccountTypeScreen({ onContinue, onPaste }) {
  const [mode, setMode] = useState('solo');

  return (
    <NightCanvas background={BACKGROUNDS.nocheBaja}>
      <StatusBar />
      <div className="flex flex-1 flex-col justify-center gap-[20px] px-[24px]">
        <Headline size={31} gap={10} bodySize={14.5} title="¿Vas sola o te acompaña una asesora?" body="Puedes cambiarlo cuando quieras." />

        <div className="flex flex-col gap-[11px]">
          <button type="button" onClick={() => setMode('solo')}
            style={{ borderWidth: mode === 'solo' ? 1.5 : 1, background: mode === 'solo' ? 'rgba(107,93,211,.18)' : 'transparent' }}
            className={['flex flex-col gap-[5px] rounded-[18px] p-[16px] text-left', mode === 'solo' ? 'border-[#6B5DD3]' : 'border-[#4A4A7A]'].join(' ')}>
            <span className="flex items-center justify-between">
              <span className="text-[16px] font-medium text-[#FBF7F0]">Por mi cuenta</span>
              {mode === 'solo'
                ? <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[99px] bg-[#6B5DD3] text-[11px] text-[#FBF7F0]">✓</span>
                : <span className="h-[18px] w-[18px] rounded-[99px] border border-[#6E6890]" />}
            </span>
            <span className="text-[13px] leading-[1.5] text-[#D6D0E4]">La app completa, con las guías incluidas.</span>
          </button>

          <div onClick={() => setMode('code')}
            style={{ borderWidth: mode === 'code' ? 1.5 : 1, background: mode === 'code' ? 'rgba(107,93,211,.18)' : 'transparent' }}
            className={['flex cursor-pointer flex-col gap-[12px] rounded-[18px] p-[16px]', mode === 'code' ? 'border-[#6B5DD3]' : 'border-[#4A4A7A]'].join(' ')}>
            <div className="flex items-center justify-between">
              <span className="text-[16px] font-medium text-[#FBF7F0]">Me invitó una asesora</span>
              {mode === 'code'
                ? <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[99px] bg-[#6B5DD3] text-[11px] text-[#FBF7F0]">✓</span>
                : <span className="h-[18px] w-[18px] rounded-[99px] border border-[#6E6890]" />}
            </div>
            <span className="text-[13px] leading-[1.5] text-[#B9B2C9]">Pega el link o escribe el código que te envió.</span>
            <div className="flex gap-[8px]">
              <span className="flex-1 rounded-[12px] border border-[#6E6890] bg-[rgba(22,22,43,.6)] p-[13px] font-mono text-[14px] tracking-[.08em] text-[#B9B2C9]">nocttua.app/c/…</span>
              <button type="button" onClick={onPaste} className="rounded-[12px] bg-[#FBF7F0] px-[14px] py-[13px] text-[14px] font-medium text-[#16162B]">Pegar</button>
            </div>
          </div>
        </div>

        <button type="button" onClick={onContinue} className="rounded-[14px] bg-[#6B5DD3] px-[16px] py-[16px] text-center text-[16px] font-medium text-[#FBF7F0]">Continuar</button>
      </div>
    </NightCanvas>
  );
}
export default AccountTypeScreen;
