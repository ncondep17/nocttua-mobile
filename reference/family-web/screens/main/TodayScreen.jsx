import { ScreenHeader } from '../../../../components/layout/ScreenHeader';
import { ScreenScroll } from '../../../../components/layout/ScreenScroll';
import { WindowCountdown } from '../../../../components/data/WindowCountdown';
import { TimelineEvent } from '../../../../components/data/TimelineEvent';
import { Card } from '../../../../components/core/Card';
import { Button } from '../../../../components/core/Button';
import { Eyebrow } from '../../../../components/core/Eyebrow';
import { babies, todayFeed, nextWindow, dayStats } from '../../data/mock';

/**
 * Pantalla principal · Hoy.
 * Orden de lectura deliberado: primero la ventana (lo urgente),
 * después los dos botones grandes de registro, después el feed del día.
 */
export function TodayScreen({ onLogSleep, onLogFeed, onOpenEvent, onOpenDay }) {
  return (
    <>
      <ScreenScroll>
        <ScreenHeader
          eyebrow="Jueves 14 de agosto"
          title="Hoy"
          action={
            <div className="flex gap-3">
              {babies.map((b) => (
                <span key={b.id} className={['grid h-9 w-9 place-items-center rounded-pill font-ui-app text-sm font-medium', b.tone === 'a' ? 'bg-violeta-100 text-violeta-600' : 'bg-terracota-100 text-terracota-500'].join(' ')}>
                  {b.initial}
                </span>
              ))}
            </div>
          }
        />

        <WindowCountdown baby={nextWindow.baby} time={nextWindow.time} remaining={nextWindow.remaining} note={nextWindow.note} />

        <div className="grid grid-cols-2 gap-5">
          <Button variant="primary" size="lg" onClick={onLogSleep}>Anotar sueño</Button>
          <Button variant="secondary" size="lg" onClick={onLogFeed}>Anotar toma</Button>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {dayStats.map((s) => (
            <div key={s.label} className="flex flex-col gap-2 rounded-lg border border-crema-line bg-white px-7 py-6">
              <Eyebrow>{s.label}</Eyebrow>
              <span className={['font-mono text-lg', s.tone === 'success' ? 'text-verde-600' : 'text-tinta-fuerte'].join(' ')}>{s.value}</span>
              <span className="font-ui-app text-xs text-tinta-tenue">{s.hint}</span>
            </div>
          ))}
        </div>

        <Card title="El día" action={<span onClick={onOpenDay} className="cursor-pointer font-ui-app text-sm text-violeta-600">Ver semana</span>}>
          <div className="flex flex-col">
            {todayFeed.map((e) => (
              <TimelineEvent key={e.id} {...e} onClick={() => onOpenEvent && onOpenEvent(e)} />
            ))}
          </div>
        </Card>
      </ScreenScroll>
    </>
  );
}
export default TodayScreen;
