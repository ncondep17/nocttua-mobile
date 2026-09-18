import { useState } from 'react';
import { Eyebrow, NightCard, MetricBar } from '../../components/primitives';
import { FullScreen } from '../../components/MobileChrome';
import { PLANS } from '../../data/records';
import { avgWindow, baseWakes, correlations } from '../../lib/derive';
import { dur, one } from '../../lib/time';

/**
 * Paywall — aparece tras el 7º registro, nunca antes.
 * La estructura es deliberada y es lo que la hace honesta:
 *   1. se REGALA el primer insight real, calculado con sus datos;
 *   2. se muestran los factores DESENFOCADOS: se ve que existen, no qué dicen;
 *   3. precios sin cuenta regresiva ni descuento que expira;
 *   4. la letra chica aclara que sus registros siguen siendo gratis y suyos, y
 *      que con código de asesora las analíticas van incluidas.
 */
export function PaywallScreen({ profile, onClose, onSubscribe }) {
  const p = profile;
  const [plan, setPlan] = useState('anual');
  const corr = correlations().slice(0, 4);

  return (
    <FullScreen>
      <div className="no-bars flex min-h-0 flex-1 flex-col gap-[13px] overflow-auto px-[20px] pb-[6px] pt-[16px]">
        <div className="flex items-center justify-between">
          <Eyebrow>7 días registrados</Eyebrow>
          <span onClick={onClose} className="grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-[99px] border border-[#DCD4C8] text-[14px] text-[#8A8299]">✕</span>
        </div>

        <span className="font-display-app text-[29px] leading-[1.12] text-[#16162B]">Ya tenemos suficiente para leer su sueño.</span>

        <NightCard radius={18} pad="16px 17px" className="animate-riseIn shrink-0 gap-[11px]">
          <Eyebrow tone="amber">Tu primer insight</Eyebrow>
          <span className="font-display-app text-[22px] leading-[1.25] text-[#FBF7F0]">
            Llevan {dur(Math.round(avgWindow()))} despiertas antes de la siesta. Ahí está la noche.
          </span>
          <div className="flex flex-wrap gap-[16px] border-t border-[#33335F] pt-[11px]">
            <div><div className="font-mono text-[21px] text-[#FBF7F0]">{dur(Math.round(avgWindow()))}</div><div className="text-[11.5px] text-[#8E87B5]">ventana real</div></div>
            <div><div className="font-mono text-[21px] text-[#F0A868]">{p.windowTarget}</div><div className="text-[11.5px] text-[#8E87B5]">objetivo edad</div></div>
            <div><div className="font-mono text-[21px] text-[#FBF7F0]">{one(baseWakes())}</div><div className="text-[11.5px] text-[#8E87B5]">despertares</div></div>
          </div>
          <span className="text-[13.5px] leading-[1.5] text-[#B9B2C9]">
            Los 2 días que la ventana bajó de 5 h 30 tuvieron 2 y 3 despertares. Los 4 días por encima de 6 h, entre 5 y 6. Con 7 días ya podemos separar lo que es casualidad de lo que es patrón.
          </span>
        </NightCard>

        {/* Contenido bloqueado: desenfocado 4.5px + degradado crema. Se ve la forma, no el dato. */}
        <div className="relative shrink-0 overflow-hidden rounded-[18px]">
          <div style={{ filter: 'blur(4.5px)', opacity: .75 }}
            className="flex select-none flex-col gap-[12px] rounded-[18px] border border-[#E4DCD0] bg-white px-[16px] py-[15px]">
            <span className="text-[15.5px] font-medium text-[#16162B]">Qué está pesando en la noche</span>
            {corr.map(c => <MetricBar key={c.label} label={c.label} value={c.value} pct={c.pct} color={c.color} />)}
          </div>
          <div style={{ background: 'linear-gradient(180deg, rgba(251,247,240,0) 0%, rgba(251,247,240,.94) 62%)' }} className="absolute bottom-0 left-0 right-0 top-[30%]" />
          <div className="absolute bottom-[12px] left-0 right-0 flex flex-col items-center gap-[5px]">
            <span className="grid h-[30px] w-[30px] place-items-center rounded-[99px] bg-[#16162B] text-[13px] text-[#F0A868]">✦</span>
            <span className="text-[13px] text-[#4A4459]">Desbloqueá los 6 factores que estamos midiendo</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-[9px]">
          {PLANS.map(pl => {
            const on = plan === pl.id;
            return (
              <div key={pl.id} onClick={() => setPlan(pl.id)}
                style={{
                  borderRadius: 15, padding: '14px 15px',
                  background: on ? '#F6F1FB' : '#FFFFFF',
                  border: on ? '1.5px solid #6B5DD3' : '1px solid #DCD4C8',
                }}
                className="cursor-pointer">
                <div className="flex items-start justify-between gap-[10px]">
                  <div className="flex items-start gap-[10px]">
                    <span style={{ border: '1.5px solid ' + (on ? '#6B5DD3' : '#DCD4C8') }}
                      className="mt-[1px] grid h-[20px] w-[20px] shrink-0 place-items-center rounded-[99px]">
                      {on ? <span className="h-[10px] w-[10px] rounded-[99px] bg-[#6B5DD3]" /> : null}
                    </span>
                    <div className="flex flex-col gap-[2px]">
                      <span className="text-[15.5px] font-medium text-[#16162B]">{pl.name}</span>
                      <span className="text-[12.5px] leading-[1.4] text-[#8A8299]">{pl.detail}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-[3px]">
                    <span className="font-mono text-[17px] text-[#16162B]">{pl.price}</span>
                    {pl.badge ? <span className="rounded-[99px] bg-[#DCEDE4] px-[8px] py-[3px] text-[11px] text-[#3F7A62]">{pl.badge}</span> : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-[8px] border-t border-[#F0EAE0] bg-[#FBF7F0] px-[20px] pb-[22px] pt-[10px]">
        <div onClick={onSubscribe} style={{ minHeight: 52 }}
          className="grid cursor-pointer place-items-center rounded-[14px] bg-[#16162B] text-[16.5px] font-medium text-[#FBF7F0]">
          Empezar · {plan === 'anual' ? '$4,99' : '$7,99'} al mes
        </div>
        <span className="text-center text-[11.5px] leading-[1.45] text-[#A9A2B5]">
          Tus registros y tu historial siguen siendo tuyos y gratis. Si tu asesora te invita con su código, las analíticas quedan incluidas sin costo.
        </span>
        <div onClick={onClose} className="cursor-pointer text-center text-[14px] text-[#8A8299]">Seguir registrando sin analíticas</div>
      </div>
    </FullScreen>
  );
}
export default PaywallScreen;
