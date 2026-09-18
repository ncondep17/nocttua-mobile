import { ScreenTitle, NightCard, Eyebrow, SectionRule, Avatar } from '../../components/primitives';
import { ScreenBody } from '../../components/MobileChrome';
import { NAMES, ACCENT, SOFT } from '../../data/profiles';
import { RELEVO_NOTES } from '../../data/records';
import { planBlocks, nowMinutes, feedsDone, feedAt } from '../../lib/derive';
import { MedStrip } from '../../components/MedStrip';
import { toMin, fmt, dur } from '../../lib/time';

/**
 * Hoy — la pantalla que se abre a las 3 de la mañana.
 * Orden de lectura deliberado:
 *   1. próxima ventana (lo único urgente)
 *   2. plan del día en bloques, con las dos bebés lado a lado
 *   3. resumen de alimentación (atajo a Leche)
 *   4. notas de relevo entre cuidadores
 *
 * Cada bloque del plan es "Registrado" (borde crema, celdas de color) o
 * "Sugerido" (borde violeta 1.5px + sombra, celdas punteadas): el contraste
 * entre lo que pasó y lo que el plan propone es la idea central de la pantalla.
 */
export function TodayScreen({ profile, showRelevoNotes = true, onOpenLog, onGoMilk, episode, doses, onOpenMeds }) {
  const p = profile;
  const pb = planBlocks(p);
  const now = nowMinutes(p);
  const firstNap = toMin(pb[1].times[0]);
  const bedtime = toMin(pb[pb.length - 1].times[0]);
  const done = feedsDone(p);
  const feeds = done.filter(e => e.kind !== 'pump');
  const pumps = done.filter(e => e.kind === 'pump');
  const lastFeed = feeds.slice().sort((a, b) => feedAt(b) - feedAt(a))[0];
  const nightFeeds = feeds.filter(e => e.night).length;

  const note = p.id === '18-36'
    ? 'Plan de la asesora: bajar la ventana de la mañana de 6 h a 4 h 55 esta semana. Se acuestan sobre las ' + fmt(bedtime) + '.'
    : 'Con ' + p.label.toLowerCase() + ' esperamos ' + p.napsLabel + ' siestas, ventanas de ' + p.window + ' y noche sobre las ' + fmt(bedtime) + '.';

  return (
    <ScreenBody gap={12}>
      <ScreenTitle
        eyebrow="Martes 28 jul"
        title="Hoy"
        action={
          <div className="flex items-center gap-[7px]">
            <Avatar initial="M" bg="#E8DFF6" fg="#6B5DD3" size={29} fontSize="12px" />
            <span className="-ml-[13px]"><Avatar initial="L" bg="#FDE8D7" fg="#C2703F" size={29} fontSize="12px" /></span>
            <span className="text-[13px] text-[#8A8299]">niñera de turno</span>
          </div>
        }
      />

      <NightCard>
        <div className="flex items-center justify-between">
          <Eyebrow tone="lilac">Próxima ventana</Eyebrow>
          <span className="font-mono text-[13px] text-[#F0A868]">en {dur(firstNap - now)}</span>
        </div>
        <div className="text-[17px] leading-[1.35] text-[#FBF7F0]">
          Empezar a dormirlas <strong className="font-mono">{fmt(firstNap)}</strong>
        </div>
        <div className="text-[13.5px] leading-[1.45] text-[#B9B2C9]">{note}</div>
      </NightCard>

      <SectionRule>Sueño · {p.napsLabel} siesta(s)</SectionRule>

      {pb.map(b => (
        <div key={b.key}
          style={{
            background: '#FFFFFF', borderRadius: 16, padding: '11px 14px',
            border: b.logged ? '1px solid #E4DCD0' : '1.5px solid #6B5DD3',
            boxShadow: b.logged ? 'none' : '0 8px 22px -14px rgba(107,93,211,.5)',
          }}
          className="flex flex-col gap-[9px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[9px]">
              <span style={{ width: 8, height: 8, borderRadius: 99, background: b.key === 'night' ? '#2C2C52' : b.key === 'wake' ? '#F0A868' : '#6B5DD3' }} />
              <span className="text-[16px] font-medium text-[#16162B]">{b.label}</span>
            </div>
            <span style={{ color: b.logged ? '#7FB09A' : '#8A8299' }} className="text-[13px] font-medium">
              {b.logged ? 'Registrado' : 'Sugerido'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-[9px]">
            {[0, 1].map(i => (
              <div key={i} onClick={() => onOpenLog && onOpenLog(b.label, i)}
                style={{
                  background: b.logged ? SOFT[i] : '#FBF7F0',
                  border: b.logged ? 'none' : '1px dashed #C9C1D8',
                  borderRadius: 12, padding: '9px 11px',
                }}
                className="flex cursor-pointer flex-col gap-[2px]">
                <span style={{ color: ACCENT[i] }} className="text-[12.5px] font-medium">{NAMES[i]}</span>
                <span style={{ color: b.logged ? '#16162B' : '#8A8299' }} className="font-mono text-[20px]">{b.times[i]}</span>
                <span className="text-[12.5px] leading-[1.3] text-[#8A8299]">{b.details[i]}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <SectionRule onClick={onGoMilk}>Alimentación</SectionRule>

      <div onClick={onGoMilk} className="flex cursor-pointer items-center gap-[11px] rounded-[16px] border border-[#E4DCD0] bg-white px-[14px] py-[12px]">
        <span className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-[10px] bg-[#F6F1FB] text-[14px] text-[#6B5DD3]">◍</span>
        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <span className="text-[14.5px] font-medium text-[#16162B]">
            {feeds.length} tomas · {pumps.length} {pumps.length === 1 ? 'extracción' : 'extracciones'} hasta ahora
          </span>
          <span className="text-[12.5px] leading-[1.35] text-[#8A8299]">
            {lastFeed ? 'Última hace ' + dur(now - feedAt(lastFeed)) : 'Sin tomas aún'} · {nightFeeds} de noche (esperadas {p.nightFeeds})
          </span>
        </div>
        <span className="text-[15px] text-[#A9A2B5]">→</span>
      </div>

      {/* Medicinas: feature secundario, mismo peso visual que Alimentación y siempre
          DEBAJO de ella. Esta es una app de sueño — nunca una tarjeta siempre abierta. */}
      {episode ? <MedStrip episode={episode} doses={doses} now={now} onOpen={onOpenMeds} /> : null}

      {showRelevoNotes ? (
        <div className="flex flex-col gap-[9px] rounded-[16px] border border-[#EFDCC4] bg-[#FFF9F0] px-[14px] py-[12px]">
          <Eyebrow tone="brown" tracking=".08em">Notas de relevo</Eyebrow>
          {RELEVO_NOTES.map(n => (
            <div key={n.who} className="flex flex-col gap-[2px]">
              <span className="text-[12px] text-[#B08A55]">{n.who}</span>
              <span className="text-[14.5px] leading-[1.45] text-[#4A4459]">{n.text}</span>
            </div>
          ))}
          <div className="border-t border-dashed border-[#EFDCC4] pt-[9px] text-[14px] text-[#B08A55]">＋ Dejar nota para el siguiente turno</div>
        </div>
      ) : null}
    </ScreenBody>
  );
}
export default TodayScreen;
