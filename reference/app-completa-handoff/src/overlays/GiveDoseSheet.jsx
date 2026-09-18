import { useState } from 'react';
import { NAMES } from '../data/profiles';
import { ML } from '../data/meds';
import { lastDose, doseCount, doseWarning, doseHistory } from '../lib/meds';
import { fmt } from '../lib/time';

/**
 * "Dar medicina". Diseñada para las 3am con una mano:
 * la dosis en 44px es el elemento más grande de la pantalla, y el botón
 * confirma repitiendo la cantidad ("Le di 1,2 ml") para que no haya duda.
 * El aviso informa (intervalo, máximo) pero NUNCA bloquea: decide el cuidador.
 */
export function GiveDoseSheet({ med, doses, now, baby: initialBaby, onSave, onSaveBoth, onClose }) {
  const [baby, setBaby] = useState(initialBaby);
  const [at, setAt] = useState(now);

  const last = lastDose(doses, med.id, baby);
  const given = doseCount(doses, med.id, baby);
  const warn = doseWarning(med, doses, baby, at);

  return (
    <div className="absolute inset-0 flex flex-col justify-end bg-[rgba(22,22,43,.35)]">
      <div onClick={onClose} className="flex-1" />
      <div className="flex max-h-[92%] flex-col gap-[14px] overflow-auto rounded-t-[24px] rounded-b-[34px] bg-white px-[20px] pb-[22px] pt-[10px]">
        <div className="mx-auto h-[4px] w-[40px] flex-none rounded-full bg-[#DCD4C8]" />

        <div className="flex flex-none items-baseline justify-between">
          <span className="text-[19px] font-medium text-[#16162B]">Dar medicina</span>
          <span onClick={onClose} className="cursor-pointer text-[15px] text-[#8A8299]">Cerrar</span>
        </div>

        <div className="flex flex-none gap-[5px] rounded-[11px] bg-[#EFE9DF] p-[4px]">
          {[0, 1].map(b => (
            <div
              key={b}
              onClick={() => setBaby(b)}
              className="flex-1 cursor-pointer rounded-[8px] p-[8px] text-center text-[14.5px]"
              style={baby === b ? { background: '#fff', color: '#16162B', fontWeight: 500, boxShadow: '0 1px 3px rgba(22,22,43,.12)' } : { color: '#8A8299' }}
            >
              {NAMES[b]}
            </div>
          ))}
        </div>

        <div className="flex flex-none flex-col items-center gap-[6px] rounded-[16px] border border-[#EFCFC7] bg-[#FFF6F4] p-[16px] text-center">
          <span className="text-[15px] text-[#4A4459]">{med.name}</span>
          <span className="font-mono text-[44px] leading-none text-[#16162B]">{ML(med.ml[baby])}</span>
          <span className="text-[13px] text-[#8A8299]">{med.conc}</span>
          <span className="mt-[4px] text-[12px] text-[#A9A2B5]">Indicado por {med.doctor} el {med.when}</span>
        </div>

        <div className="flex flex-none gap-[9px]">
          <Stat value={last ? fmt(last.t) : '—'} label={last ? 'última dosis · ' + last.by : 'sin dosis hoy'} />
          <Stat value={given + ' de ' + med.maxDay} label="dosis de hoy" tone={given >= med.maxDay ? '#D9705A' : '#16162B'} />
        </div>

        <div className="flex flex-none items-center justify-between">
          <span className="text-[15.5px] text-[#4A4459]">Hora</span>
          <div className="flex items-center gap-[10px]">
            <Stepper onClick={() => setAt(at - 5)}>−</Stepper>
            <span className="min-w-[62px] text-center font-mono text-[21px] text-[#16162B]">{fmt(at)}</span>
            <Stepper onClick={() => setAt(at + 5)}>＋</Stepper>
          </div>
        </div>

        {warn && (
          <div className="flex flex-none items-start gap-[9px] rounded-[12px] border border-[#EFCFC7] bg-[#FFF6F4] px-[12px] py-[11px]">
            <span className="grid h-[20px] w-[20px] flex-shrink-0 place-items-center rounded-full bg-[#F7DED7] text-[11px] text-[#C25F45]">!</span>
            <span className="text-[12.5px] leading-[1.45] text-[#4A4459]">{warn}</span>
          </div>
        )}

        <div className="flex flex-none flex-col gap-[7px]">
          <span className="font-mono text-[10.5px] uppercase tracking-[.09em] text-[#8A8299]">Dosis de hoy</span>
          {doseHistory(doses).map((h, i) => (
            <div key={i} className="flex items-center gap-[10px] border-b border-[#F0EAE0] py-[7px]">
              <span className="min-w-[46px] font-mono text-[13px] text-[#16162B]">{h.time}</span>
              <span className="flex-1 text-[13.5px] text-[#4A4459]">{h.what}</span>
              <span className="text-[12px] text-[#8A8299]">{h.by}</span>
            </div>
          ))}
        </div>

        <div className="sticky -bottom-[22px] z-[2] -mb-[22px] -mt-[10px] flex flex-none gap-[9px] bg-white pb-[22px] pt-[10px]">
          <div
            onClick={() => onSave(med.id, baby, at)}
            className="grid min-h-[50px] flex-1 cursor-pointer place-items-center rounded-[13px] bg-[#16162B] text-[16.5px] font-medium text-[#FBF7F0]"
          >
            Le di {ML(med.ml[baby])}
          </div>
          <div
            onClick={() => onSaveBoth(med.id, at)}
            className="grid min-h-[50px] cursor-pointer place-items-center rounded-[13px] border border-[#DCD4C8] px-[15px] text-center text-[14.5px] leading-[1.2] text-[#4A4459]"
          >
            Las<br />dos
          </div>
        </div>
      </div>
    </div>
  );
}

const Stat = ({ value, label, tone = '#16162B' }) => (
  <div className="flex flex-1 flex-col gap-[3px] rounded-[12px] border border-[#E4DCD0] bg-[#FBF7F0] px-[11px] py-[10px]">
    <span className="font-mono text-[17px]" style={{ color: tone }}>{value}</span>
    <span className="text-[11.5px] leading-[1.3] text-[#8A8299]">{label}</span>
  </div>
);

const Stepper = ({ onClick, children }) => (
  <span onClick={onClick} className="grid h-[34px] w-[34px] cursor-pointer place-items-center rounded-[10px] border border-[#DCD4C8] text-[16px] text-[#4A4459]">
    {children}
  </span>
);
