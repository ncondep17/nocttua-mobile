import { MEDS, ML } from '../data/meds';
import { NAMES, ACCENT } from '../data/profiles';

/**
 * "Medicinas indicadas" — vive en la pestaña Cuidado, DEBAJO del separador
 * "FUERA DEL SUEÑO". Es el lugar donde la indicación del médico se guarda una
 * sola vez para no volver a buscarla en el chat con el pediatra.
 *
 * Regla de producto: se muestra la indicación con nombre del médico y fecha.
 * Noctua no calcula dosis por peso ni sugiere medicación. Editable solo por admin.
 */
export function MedsPrescriptionCard({ onEdit }) {
  return (
    <div className="flex flex-col gap-[12px] rounded-[16px] border border-[#E4DCD0] bg-white px-[15px] py-[14px]">
      <div className="flex items-start justify-between gap-[10px]">
        <div className="flex flex-col gap-[2px]">
          <span className="text-[16px] font-medium text-[#16162B]">Medicinas indicadas</span>
          <span className="text-[12.5px] leading-[1.35] text-[#8A8299]">Lo que dijo el doctor, guardado una vez</span>
        </div>
        <span onClick={onEdit} className="flex-shrink-0 cursor-pointer text-[13px] text-[#6B5DD3]">Editar</span>
      </div>

      {MEDS.map(m => (
        <div key={m.id} className="flex flex-col gap-[10px] rounded-[13px] bg-[#FBF7F0] px-[13px] py-[12px]">
          <div className="flex items-baseline justify-between gap-[8px]">
            <span className="text-[15px] font-medium text-[#16162B]">{m.name}</span>
            <span className="font-mono text-[11.5px] text-[#8A8299]">cada {m.everyH} h · máx {m.maxDay}/día</span>
          </div>
          <span className="text-[12.5px] text-[#8A8299]">{m.conc}</span>
          <div className="grid grid-cols-2 gap-[8px]">
            {[0, 1].map(b => (
              <div key={b} className="flex flex-col gap-[2px] rounded-[11px] border border-[#E4DCD0] bg-white px-[10px] py-[9px]">
                <span className="text-[12px] font-medium" style={{ color: ACCENT[b] }}>{NAMES[b]}</span>
                <span className="font-mono text-[17px] text-[#16162B]">{ML(m.ml[b])}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-[4px] border-t border-dashed border-[#E4DCD0] pt-[9px]">
            <span className="text-[12.5px] leading-[1.4] text-[#4A4459]">{m.note}</span>
            <span className="text-[11.5px] text-[#A9A2B5]">{m.doctor} · {m.when}</span>
          </div>
        </div>
      ))}

      <div className="text-[11.5px] leading-[1.5] text-[#A9A2B5]">
        Noctua solo repite la indicación de tu doctor, con su nombre y fecha. No calcula dosis ni sustituye una consulta.
      </div>
    </div>
  );
}
