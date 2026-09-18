import { NAMES, ACCENT } from '../data/profiles';
import { medPlan, nextDose } from '../lib/meds';
import { fmt, dur } from '../lib/time';

/**
 * Hoja de Medicinas. Se abre desde el recuadro de Sueño y contiene TODO lo del
 * episodio: próxima dosis, una fila por medicina y niña, y el cierre del episodio.
 * Desde acá se abre GiveDoseSheet (dos hojas apiladas: esta se oculta cuando
 * la de dosis está abierta).
 */
export function MedsSheet({ episode, doses, now, onGive, onToggleEpisode, onGoCare, onClose }) {
  const next = nextDose(doses, now);
  const rows = medPlan(doses, now);

  return (
    <div className="absolute inset-0 flex flex-col justify-end bg-[rgba(22,22,43,.35)]">
      <div onClick={onClose} className="flex-1" />
      <div className="flex max-h-[92%] flex-col gap-[14px] overflow-auto rounded-t-[24px] rounded-b-[34px] bg-white px-[20px] pb-[24px] pt-[10px]">
        <div className="mx-auto h-[4px] w-[40px] flex-none rounded-full bg-[#DCD4C8]" />

        <div className="flex flex-none items-baseline justify-between">
          <span className="text-[19px] font-medium text-[#16162B]">Medicinas</span>
          <span onClick={onClose} className="cursor-pointer text-[15px] text-[#8A8299]">Cerrar</span>
        </div>

        {episode.active ? (
          <div className="flex flex-none flex-col gap-[13px]">
            <div className="flex flex-col gap-[12px] rounded-[16px] border border-[#EFCFC7] bg-[#FFF6F4] px-[15px] py-[14px]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[.08em] text-[#C25F45]">
                  Modo enfermedad · día {episode.day}
                </span>
                <span onClick={onToggleEpisode} className="cursor-pointer text-[12.5px] text-[#A9A2B5]">Ya está bien</span>
              </div>

              <div className="flex items-end justify-between gap-[10px]">
                <div className="flex flex-col gap-[2px]">
                  <span className="text-[16.5px] font-medium leading-[1.3] text-[#16162B]">
                    {next ? next.med.name + ' · ' + NAMES[next.baby] : 'Nada pendiente ahora'}
                  </span>
                  <span className="text-[12.5px] text-[#8A8299]">
                    {next ? next.dose + ' · cada ' + next.med.everyH + ' h' : 'La próxima dosis se abre cuando pasen las horas'}
                  </span>
                </div>
                {next && (
                  <div className="flex-shrink-0 text-right">
                    <div className="font-mono text-[21px] text-[#16162B]">{fmt(next.at)}</div>
                    <div className="font-mono text-[12px] text-[#C25F45]">
                      {next.due ? 'le toca ya' : 'en ' + dur(next.at - now)}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-[8px] border-t border-[#F3DED8] pt-[11px]">
                {rows.map(r => (
                  <div key={r.med.id + r.baby} className="flex items-center gap-[10px]">
                    <span
                      className="grid h-[28px] w-[28px] flex-shrink-0 place-items-center rounded-full text-[11.5px] font-bold"
                      style={{ background: r.baby === 0 ? '#E8DFF6' : '#FDE8D7', color: ACCENT[r.baby] }}
                    >
                      {NAMES[r.baby][0]}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-[1px]">
                      <span className="text-[14.5px] font-medium text-[#16162B]">{r.med.name} · {r.dose}</span>
                      <span className="text-[12px] leading-[1.35] text-[#8A8299]">
                        {r.last ? 'última ' + fmt(r.last.t) + ' · ' + r.last.by : 'sin dosis hoy'}
                      </span>
                    </div>
                    <span
                      onClick={() => onGive(r.med.id, r.baby)}
                      className="flex-shrink-0 cursor-pointer rounded-[10px] px-[13px] py-[7px] text-[13.5px]"
                      style={
                        r.due
                          ? { background: '#16162B', color: '#FBF7F0', fontWeight: 500 }
                          : { background: '#fff', border: '1px solid #E4DCD0', color: '#8A8299', fontFamily: 'DM Mono, monospace', fontSize: '12.5px' }
                      }
                    >
                      {r.due ? 'Dar' : 'a las ' + fmt(r.at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div onClick={onGoCare} className="flex flex-none cursor-pointer items-center gap-[11px]">
              <span className="grid h-[30px] w-[30px] flex-shrink-0 place-items-center rounded-[9px] bg-[#F6F1FB] text-[13px] text-[#6B5DD3]">◇</span>
              <span className="flex-1 text-[14px] leading-[1.35] text-[#4A4459]">Ver o editar las dosis que indicó el doctor</span>
              <span className="text-[14px] text-[#A9A2B5]">→</span>
            </div>

            <div className="flex-none text-[11.5px] leading-[1.5] text-[#A9A2B5]">
              Estos días quedan marcados como atípicos en Datos, así no mueven tus promedios ni las ventanas del plan.
            </div>
          </div>
        ) : (
          <div className="flex flex-none flex-col gap-[13px]">
            <span className="text-[14.5px] leading-[1.5] text-[#4A4459]">
              Cuando estén enfermas, activá el modo enfermedad: tenés las dosis que indicó el doctor a mano, sabés a qué hora toca la próxima y quién dio la última.
            </span>
            <div onClick={onToggleEpisode} className="grid min-h-[50px] cursor-pointer place-items-center rounded-[13px] bg-[#16162B] text-[16.5px] font-medium text-[#FBF7F0]">
              Activar modo enfermedad
            </div>
            <div onClick={onGoCare} className="grid min-h-[46px] cursor-pointer place-items-center rounded-[13px] border border-[#DCD4C8] text-[14.5px] text-[#4A4459]">
              Ver las dosis indicadas
            </div>
            <span className="text-[11.5px] leading-[1.5] text-[#A9A2B5]">Los días de enfermedad quedan fuera de tus promedios de sueño.</span>
          </div>
        )}
      </div>
    </div>
  );
}
