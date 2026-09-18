import { Sheet } from '../../../../components/feedback/Sheet';
import { Button } from '../../../../components/core/Button';
import { Eyebrow } from '../../../../components/core/Eyebrow';

/** Hoja · Detalle de un registro. Editar o borrar, sin ceremonia. */
export function EventDetailSheet({ open, event, onClose, onEdit, onDelete }) {
  if (!event) return null;
  return (
    <Sheet
      open={open} onClose={onClose} title={event.title} subtitle={event.time}
      footer={
        <>
          <Button variant="secondary" size="lg" className="flex-1" onClick={onEdit}>Editar</Button>
          <Button variant="danger" size="lg" onClick={onDelete}>Borrar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-6 rounded-md bg-crema-paper px-8 py-7">
        <div className="flex flex-col gap-1">
          <Eyebrow>Detalle</Eyebrow>
          <span className="font-ui-app text-base leading-relaxed text-tinta-cuerpo">{event.meta}</span>
        </div>
      </div>
    </Sheet>
  );
}
export default EventDetailSheet;
