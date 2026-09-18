import { Eyebrow, PrimaryButton } from '../../components/primitives';
import { Sheet } from '../../components/MobileChrome';

/**
 * Detalle de un día — se abre al tocar una fila del mapa de la semana.
 * Cada tiempo exacto de esa jornada, con el veredicto arriba en verde o ámbar.
 * Los valores que se salieron de rango van en coral; el resto en tinta.
 */
export function DayDetailSheet({ open, detail, onClose }) {
  if (!detail) return null;
  return (
    <Sheet open={open} onClose={onClose} maxH="88%">
      <div className="flex items-baseline justify-between">
        <div>
          <Eyebrow>{detail.weekday}</Eyebrow>
          <div className="font-display-app text-[26px] leading-[1.15] text-[#16162B]">{detail.title}</div>
        </div>
        <span onClick={onClose} className="cursor-pointer text-[15px] text-[#8A8299]">Cerrar</span>
      </div>

      <div style={{
        background: detail.good ? '#F3F7F4' : '#FFF3E3',
        border: '1px solid ' + (detail.good ? '#C9DED4' : '#EFCFA4'),
      }} className="rounded-[13px] px-[13px] py-[12px] text-[15px] leading-[1.45] text-[#4A4459]">{detail.verdict}</div>

      <div className="flex flex-col gap-[2px]">
        {detail.rows.map(r => (
          <div key={r.label} className="flex items-baseline justify-between border-b border-[#F0EAE0] py-[9px]">
            <span className="text-[14.5px] text-[#4A4459]">{r.label}</span>
            <span style={{ color: r.tone }} className="text-right font-mono text-[15px]">{r.value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-[7px] rounded-[14px] border border-[#E4DCD0] bg-[#FBF7F0] px-[13px] py-[12px]">
        <Eyebrow tracking=".08em">Contexto</Eyebrow>
        <span className="text-[14.5px] leading-[1.5] text-[#4A4459]">{detail.context}</span>
      </div>

      <PrimaryButton onClick={onClose}>Volver a la semana</PrimaryButton>
    </Sheet>
  );
}
export default DayDetailSheet;
