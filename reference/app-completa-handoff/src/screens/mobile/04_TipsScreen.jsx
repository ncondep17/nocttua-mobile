import { useState } from 'react';
import { ScreenTitle, NightCard, Eyebrow } from '../../components/primitives';
import { ScreenBody } from '../../components/MobileChrome';
import { TIP_CATS, FEATURED, tipsForAge } from '../../data/insights';
import { avgLatency, avgNightFeeds, nowMinutes } from '../../lib/derive';
import { toMin, dur, one } from '../../lib/time';
import { ReferenceCards } from '../../components/ReferenceCards';

/**
 * Tips — recordatorios cortos, NO un plan.
 * Frontera de producto: el plan y sus ajustes vienen siempre de la asesora
 * (pestaña Cuidado). Esta pantalla nunca prescribe: recuerda.
 *
 * Arriba de "Por tema" van las TABLAS DE REFERENCIA (ventanas por edad, un día
 * de ejemplo, regresiones): material para papás primerizos, derivado del perfil
 * de edad activo. Son referencia, no plan: no generan acciones.
 *
 * Dos estados: portada (3 destacados elegidos por los datos de la semana +
 * rejilla de temas) y detalle de tema (acordeón filtrado).
 */
export function TipsScreen({ profile, onGoTeam, onSelectProfile }) {
  const p = profile;
  const [cat, setCat] = useState('todo');   // 'todo' = portada · 'all' = todos · id de tema
  const [open, setOpen] = useState(null);
  const now = nowMinutes(p);
  const awake = now - toMin('6:20');
  const passed = awake > p.windowMin;

  const forAge = tipsForAge(p.id);
  const atHome = cat === 'todo';
  const list = forAge.filter(i => atHome ? FEATURED.indexOf(i.title) >= 0 : (cat === 'all' || i.cat === cat));

  /** El dato propio que se le pega a un tip cuando aplica. Es lo que lo vuelve tuyo. */
  const dataFor = (title) => {
    if (title.indexOf('latencia') >= 0) return 'Tu latencia media: ' + Math.round(avgLatency()) + ' min.';
    if (title.indexOf('si le tocaba') >= 0) return one(avgNightFeeds()) + ' tomas nocturnas por noche, ninguna marcada como «le tocaba».';
    if (title.indexOf('en el medio') >= 0) return 'Vas por la noche 5 del plan.';
    if (title.indexOf('5:40') >= 0) return 'Su despertar más temprano fue 6:05 — dentro de rango.';
    return '';
  };

  return (
    <ScreenBody gap={13}>
      <ScreenTitle eyebrow="Recordatorios cortos" title="Tips" />

      <NightCard pad="15px 16px" className="animate-riseIn gap-[9px]">
        <Eyebrow tone="amber">Para hoy</Eyebrow>
        <span className="font-display-app text-[24px] leading-[1.25] text-[#FBF7F0]">
          {passed ? 'La ventana ya se pasó del objetivo.' : 'Arrancá la rutina de siesta antes de que se pase la ventana.'}
        </span>
        <span className="text-[13.5px] leading-[1.5] text-[#B9B2C9]">
          {passed
            ? 'Llevan ' + dur(awake) + ' despiertas y el objetivo es ' + p.windowTarget + '. Acostalas ya, aunque no den señales de sueño: pasado ese punto cuesta más y la noche se fragmenta.'
            : 'Llevan ' + dur(awake) + ' despiertas y el objetivo es ' + p.windowTarget + '. Empezá el ritual unos 15 min antes para que lleguen a la cama tranquilas, no dormidas.'}
        </span>
        <div onClick={onGoTeam} className="flex cursor-pointer items-center justify-between border-t border-[#33335F] pt-[11px]">
          <span className="text-[13.5px] text-[#8E87B5]">El plan lo define Carolina</span>
          <span className="text-[13.5px] text-[#F0A868]">Ver plan →</span>
        </div>
      </NightCard>

      {atHome ? (
        <>
          <ReferenceCards profile={p} onSelectProfile={onSelectProfile} />

          <div className="flex flex-col gap-[11px]">
            <Eyebrow>Por tema</Eyebrow>
            <div className="grid grid-cols-2 gap-[9px]">
              {TIP_CATS.map(c => (
                <div key={c.id} onClick={() => { setCat(c.id); setOpen(null); }}
                  className="flex cursor-pointer items-center gap-[10px] rounded-[14px] border border-[#E4DCD0] bg-white px-[13px] py-[12px]">
                  <span className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-[10px] bg-[#F6F1FB] text-[15px] text-[#6B5DD3]">{c.icon}</span>
                  <div className="flex flex-col gap-[1px]">
                    <span className="text-[15px] font-medium text-[#16162B]">{c.label}</span>
                    <span className="text-[12px] text-[#8A8299]">{forAge.filter(i => i.cat === c.id).length} tips</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-[3px] flex items-center gap-[9px]">
            <Eyebrow>Para tu semana</Eyebrow>
            <div className="h-px flex-1 bg-[#DCD4C8]" />
          </div>
          <span className="-mt-[6px] text-[12.5px] leading-[1.45] text-[#8A8299]">Elegidos por lo que vimos en tus registros.</span>
        </>
      ) : (
        <div onClick={() => { setCat('todo'); setOpen(null); }} className="flex cursor-pointer items-center gap-[8px]">
          <span className="grid h-[30px] w-[30px] place-items-center rounded-[99px] border border-[#DCD4C8] text-[14px] text-[#4A4459]">←</span>
          <span className="text-[15px] text-[#4A4459]">
            {cat === 'all' ? 'Todos los tips' : (TIP_CATS.filter(c => c.id === cat)[0] || {}).label}
          </span>
          <span className="ml-auto font-mono text-[12px] text-[#8A8299]">{list.length} tips</span>
        </div>
      )}

      {list.map((i, ix) => {
        const isOpen = open === i.title;
        const mine = i.ages !== '*';   // específico de su edad → borde y número violeta
        const data = dataFor(i.title);
        return (
          <div key={i.title}
            style={{
              border: '1px solid ' + (isOpen ? '#B9AFEA' : (mine ? '#C9C1D8' : '#E4DCD0')),
              boxShadow: isOpen ? '0 10px 26px -18px rgba(107,93,211,.7)' : 'none',
              animationDelay: (ix * 0.03).toFixed(2) + 's',
            }}
            className="flex animate-riseIn flex-col rounded-[14px] bg-white px-[14px] py-[13px]">
            <div onClick={() => setOpen(isOpen ? null : i.title)} className="flex cursor-pointer items-start gap-[12px]">
              <span style={{ color: mine ? '#6B5DD3' : '#C6BFB2' }} className="shrink-0 pt-[3px] font-mono text-[11.5px]">
                {String(ix + 1).padStart(2, '0')}
              </span>
              <div className="flex flex-1 flex-col gap-[3px]">
                <span style={{ color: isOpen ? '#6B5DD3' : '#16162B' }} className="text-[15.5px] font-medium leading-[1.3]">{i.title}</span>
                <span className="text-[13.5px] leading-[1.45] text-[#6E6878]">{i.hook}</span>
              </div>
              <span style={{ transform: 'rotate(' + (isOpen ? 180 : 0) + 'deg)' }} className="shrink-0 pt-[3px] text-[15px] leading-none text-[#A9A2B5] transition-transform">⌄</span>
            </div>

            {isOpen ? (
              <div className="flex animate-riseIn flex-col gap-[9px] pb-[2px] pl-[34px] pt-[11px]">
                <span className="text-[14.5px] leading-[1.55] text-[#4A4459]">{i.body}</span>
                {i.how && i.how.length ? (
                  <div className="flex flex-col gap-[6px] rounded-[11px] bg-[#FBF7F0] px-[12px] py-[11px]">
                    <Eyebrow tone="brown" size={10.5} tracking=".09em">Cómo se hace</Eyebrow>
                    {i.how.map(h => (
                      <div key={h} className="flex items-baseline gap-[8px]">
                        <span className="text-[12px] text-[#C6BFB2]">→</span>
                        <span className="text-[13.5px] leading-[1.5] text-[#4A4459]">{h}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                {data ? (
                  <span className="rounded-[10px] bg-[#F6F1FB] px-[11px] py-[9px] font-mono text-[12px] leading-[1.5] text-[#6B5DD3]">{data}</span>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}

      {atHome ? (
        <div onClick={() => { setCat('all'); setOpen(null); }}
          className="cursor-pointer rounded-[14px] border border-dashed border-[#C9C1D8] p-[13px] text-center text-[14.5px] text-[#6B5DD3]">
          Ver los {forAge.length} tips
        </div>
      ) : null}

      <div className="text-[11.5px] leading-[1.5] text-[#A9A2B5]">Tips de recordatorio. Tu plan y sus ajustes vienen siempre de tu asesora.</div>
    </ScreenBody>
  );
}
export default TipsScreen;
