import { ScreenHeader } from '../../../../components/layout/ScreenHeader';
import { ScreenScroll } from '../../../../components/layout/ScreenScroll';
import { Card } from '../../../../components/core/Card';
import { Button } from '../../../../components/core/Button';
import { Eyebrow } from '../../../../components/core/Eyebrow';
import { TimelineEvent } from '../../../../components/data/TimelineEvent';
import { milkLog, milkStats } from '../../data/mock';

/** Pestaña · Leche. Tomas, extracción y reserva del congelador. */
export function MilkScreen({ onLogPump, onOpenEvent }) {
  return (
    <ScreenScroll>
      <ScreenHeader eyebrow="Últimas 24 horas" title="Leche" />

      <div className="flex flex-col gap-5 rounded-3xl bg-noche-900 px-10 py-9">
        <Eyebrow tone="night">Reserva en congelador</Eyebrow>
        <div className="flex items-baseline gap-6">
          <span className="font-display-app text-display-lg leading-tight text-crema-paper">1,4 L</span>
          <span className="font-mono text-base text-verde-400">+215 ml hoy</span>
        </div>
        <span className="font-ui-app text-base leading-relaxed text-noite-suave">Alcanza para cubrir unas 14 tomas de madrugada al volumen actual.</span>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {milkStats.map((s) => (
          <div key={s.label} className="flex flex-col gap-2 rounded-lg border border-crema-line bg-white px-7 py-6">
            <Eyebrow>{s.label}</Eyebrow>
            <span className={['font-mono text-lg', s.tone === 'success' ? 'text-verde-600' : 'text-tinta-fuerte'].join(' ')}>{s.value}</span>
          </div>
        ))}
      </div>

      <Button variant="primary" size="lg" full onClick={onLogPump}>Anotar extracción</Button>

      <Card title="Registro del día">
        <div className="flex flex-col">
          {milkLog.map((e) => <TimelineEvent key={e.id} {...e} onClick={() => onOpenEvent && onOpenEvent(e)} />)}
        </div>
      </Card>
    </ScreenScroll>
  );
}
export default MilkScreen;
