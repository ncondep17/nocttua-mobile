import { medStripCopy } from '../lib/meds';

/**
 * Recuadro de medicinas en la pantalla Sueño, justo debajo de Alimentación.
 * MISMO peso visual que el atajo de Alimentación: esto es un feature secundario
 * en una app de sueño. Nunca una tarjeta abierta de forma permanente,
 * nunca una pestaña propia.
 */
export function MedStrip({ episode, doses, now, onOpen }) {
  const c = medStripCopy(episode, doses, now);
  const sick = episode.active;
  return (
    <div
      onClick={onOpen}
      className="flex cursor-pointer items-center gap-[11px] rounded-[16px] bg-white px-[14px] py-[12px]"
      style={{ border: '1px solid ' + (sick ? '#EFCFC7' : '#E4DCD0') }}
    >
      <span
        className="grid h-[32px] w-[32px] flex-shrink-0 place-items-center rounded-[10px] text-[14px]"
        style={{ background: sick ? '#FFF1EE' : '#F6F1FB', color: sick ? '#C25F45' : '#6B5DD3' }}
      >
        ✚
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="text-[14.5px] font-medium text-[#16162B]">{c.title}</span>
        <span className="text-[12.5px] leading-[1.35] text-[#8A8299]">{c.sub}</span>
      </div>
      {sick ? (
        <span
          className="flex-shrink-0 rounded-[10px] px-[12px] py-[6px] text-[13px]"
          style={
            c.due
              ? { background: '#16162B', color: '#FBF7F0', fontWeight: 500 }
              : { background: '#FBF7F0', border: '1px solid #E4DCD0', color: '#8A8299' }
          }
        >
          {c.tag}
        </span>
      ) : (
        <span className="flex-shrink-0 text-[15px] text-[#A9A2B5]">→</span>
      )}
    </div>
  );
}
