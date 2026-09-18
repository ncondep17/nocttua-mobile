import { useState } from 'react';
import { Eyebrow, Avatar } from '../../components/primitives';
import { BrowserWindow, Panel, PanelTitle } from './DesktopChrome';
import { FAMILIES, ADVISOR, BILLING } from '../../data/records';
import { one } from '../../lib/time';

/**
 * Escritorio · Suscripción — la cuenta profesional de la asesora.
 * Modelo de negocio: ella paga por cupos (12 de 15) y las familias que entran
 * por su link usan la app gratis. El link de invitación es el activo comercial:
 * por eso tiene su propia tarjeta con borde violeta y botón de copiar.
 */
export function BillingDashboard() {
  const [filter, setFilter] = useState('activos');
  const [copied, setCopied] = useState(false);

  const rows = FAMILIES.filter(f =>
    filter === 'todos' ? true : filter === 'atencion' ? f.flag : f.state !== 'Cerrado');

  const cols = 'minmax(140px,1fr) 46px 78px 62px 86px';

  return (
    <BrowserWindow url="noctua.app/pro/carolina · mi cuenta">
      <div className="flex flex-wrap items-start justify-between gap-[26px]">
        <div className="flex flex-col gap-[7px]">
          <Eyebrow size={12} tracking=".12em">Cuenta profesional</Eyebrow>
          <h3 className="m-0 font-display-app text-[34px] font-normal text-[#16162B]">{ADVISOR.name}</h3>
          <span className="text-[14.5px] text-[#6E6878]">{ADVISOR.role}</span>
        </div>
        <div className="flex gap-[20px] rounded-[16px] border border-[#E4DCD0] bg-white px-[20px] py-[15px]">
          {BILLING.kpis.map(k => (
            <div key={k.label}>
              <div className="font-mono text-[22px] text-[#16162B]">{k.value}</div>
              <div className="text-[12px] text-[#8A8299]">{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.75fr)] items-start gap-[20px]">
        <div className="flex flex-col gap-[20px]">
          <div style={{ background: '#16162B', borderRadius: 18, padding: 22 }} className="flex flex-col gap-[15px]">
            <div className="flex items-center justify-between">
              <Eyebrow tone="amber" size={11} tracking=".12em">Suscripción</Eyebrow>
              <span style={{ background: 'rgba(63,122,98,.28)' }} className="rounded-[99px] px-[10px] py-[4px] text-[12px] text-[#A7DCC2]">Activa</span>
            </div>
            <div className="flex items-baseline gap-[8px]">
              <span className="font-display-app text-[40px] leading-none text-[#FBF7F0]">{BILLING.planPrice}</span>
              <span className="text-[14px] text-[#8E87B5]">/ mes · {BILLING.planName}</span>
            </div>
            <div className="flex flex-col gap-[7px]">
              <div className="flex justify-between text-[13.5px]">
                <span className="text-[#8E87B5]">Casos activos</span>
                <span className="font-mono text-[#FBF7F0]">{BILLING.seats}</span>
              </div>
              <div className="h-[8px] overflow-hidden rounded-[99px] bg-[#2C2C52]">
                <div style={{ width: BILLING.seatPct + '%' }} className="h-full animate-growW rounded-[99px] bg-[#F0A868]" />
              </div>
              <span className="text-[12.5px] text-[#8E87B5]">{BILLING.seatNote}</span>
            </div>
            <div className="flex flex-col gap-[9px] border-t border-[#33335F] pt-[13px]">
              <div className="flex justify-between text-[13.5px]"><span className="text-[#8E87B5]">Próximo cobro</span><span className="font-mono text-[#FBF7F0]">{BILLING.nextCharge}</span></div>
              <div className="flex justify-between text-[13.5px]"><span className="text-[#8E87B5]">Método</span><span className="font-mono text-[#FBF7F0]">{BILLING.method}</span></div>
            </div>
            <div className="flex gap-[9px]">
              <div className="flex-1 cursor-pointer rounded-[12px] bg-[#F0A868] p-[11px] text-center text-[15px] font-medium text-[#16162B]">{BILLING.cta}</div>
              <div className="cursor-pointer rounded-[12px] border border-[#4A4A7A] px-[15px] py-[11px] text-[15px] text-[#FBF7F0]">Facturas</div>
            </div>
          </div>

          <Panel border="#C9C1D8" gap={13}>
            <div className="flex flex-col gap-[3px]">
              <span className="text-[17px] font-medium text-[#16162B]">Tu link de invitación</span>
              <span className="text-[13px] leading-[1.45] text-[#8A8299]">Las familias que entran por acá quedan vinculadas a tu cuenta y usan la app gratis.</span>
            </div>
            <div className="flex items-stretch gap-[9px]">
              <div className="flex min-w-0 flex-1 flex-col gap-[3px] rounded-[12px] border border-[#DCD4C8] bg-[#FBF7F0] px-[13px] py-[11px]">
                <Eyebrow tone="faint" size={10.5} tracking=".08em">Link</Eyebrow>
                <span className="truncate font-mono text-[13.5px] text-[#16162B]">noctua.app/i/{ADVISOR.code}</span>
              </div>
              <div onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                style={{ background: copied ? '#DCEDE4' : '#16162B', color: copied ? '#3F7A62' : '#FBF7F0' }}
                className="grid shrink-0 cursor-pointer place-items-center rounded-[12px] px-[18px] text-[14.5px] font-medium">
                {copied ? 'Copiado ✓' : 'Copiar'}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-[12px]">
              <div className="flex flex-col gap-[3px]">
                <Eyebrow tone="faint" size={10.5} tracking=".08em">Código para ingresar a mano</Eyebrow>
                <span className="font-mono text-[19px] tracking-[.16em] text-[#6B5DD3]">{ADVISOR.code}</span>
              </div>
              <div className="ml-auto cursor-pointer rounded-[10px] border border-[#DCD4C8] px-[13px] py-[9px] text-[13.5px] text-[#4A4459]">Generar nuevo</div>
            </div>
          </Panel>
        </div>

        <Panel gap={15}>
          <PanelTitle right={
            <div style={{ background: '#EFE9DF' }} className="flex gap-[5px] rounded-[10px] p-[4px]">
              {[{ id: 'activos', label: 'Activos' }, { id: 'atencion', label: 'Necesitan atención' }, { id: 'todos', label: 'Todos' }].map(f => {
                const on = filter === f.id;
                return (
                  <div key={f.id} onClick={() => setFilter(f.id)}
                    style={{ background: on ? '#FFFFFF' : 'transparent', color: on ? '#16162B' : '#8A8299', fontWeight: on ? 500 : 400, boxShadow: on ? '0 1px 3px rgba(22,22,43,.12)' : 'none' }}
                    className="cursor-pointer rounded-[8px] px-[12px] py-[7px] text-[13.5px]">{f.label}</div>
                );
              })}
            </div>
          }>Familias vinculadas</PanelTitle>

          <div style={{ gridTemplateColumns: cols }} className="grid gap-[6px] border-b border-[#E4DCD0] pb-[8px] font-mono text-[10px] uppercase tracking-[.05em] text-[#8A8299]">
            <span>Familia</span><span>Edad</span><span>Semana</span><span>Desp.</span><span>Estado</span>
          </div>

          {rows.map(f => (
            <div key={f.name}
              style={{
                gridTemplateColumns: cols,
                background: f.flag ? 'linear-gradient(90deg, rgba(255,243,227,.7), rgba(255,243,227,0) 70%)' : 'transparent',
              }}
              className="grid items-center gap-[6px] border-b border-[#F0EAE0] py-[11px]">
              <div className="flex min-w-0 items-center gap-[10px]">
                <Avatar initial={f.name[0]} bg={f.flag ? '#FFF3E3' : '#F6F1FB'} fg={f.flag ? '#B07A3C' : '#6B5DD3'} />
                <div className="min-w-0 leading-[1.3]">
                  <div className="truncate text-[14.5px] font-medium text-[#16162B]">{f.name}</div>
                  <div className="text-[12px] text-[#A9A2B5]">{f.parents}</div>
                </div>
              </div>
              <span className="font-mono text-[13px] text-[#4A4459]">{f.age}</span>
              <div className="flex flex-col gap-[4px]">
                <span className="font-mono text-[12.5px] text-[#4A4459]">sem {f.week}/8</span>
                <div className="h-[5px] overflow-hidden rounded-[99px] bg-[#F3EEE6]">
                  <div style={{ width: Math.round((f.week / 8) * 100) + '%' }} className="h-full rounded-[99px] bg-[#6B5DD3]" />
                </div>
              </div>
              <span style={{ color: f.wakes >= 4 ? '#D9705A' : f.wakes >= 2.5 ? '#B07A3C' : '#3F7A62' }} className="font-mono text-[13.5px]">{one(f.wakes)}</span>
              <span style={{
                background: f.flag ? '#FFF3E3' : f.state === 'Cerrado' ? '#F3EEE6' : '#DCEDE4',
                color: f.flag ? '#B07A3C' : f.state === 'Cerrado' ? '#8A8299' : '#3F7A62',
              }} className="rounded-[99px] px-[10px] py-[5px] text-center text-[12px]">{f.state}</span>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-[12px] border-t border-[#F0EAE0] pt-[13px]">
            <span className="text-[13px] leading-[1.45] text-[#8A8299]">Las familias marcadas llevan 3 días sin registrar o empeoraron esta semana.</span>
            <div className="cursor-pointer rounded-[11px] bg-[#16162B] px-[14px] py-[9px] text-[14px] text-[#FBF7F0]">Invitar familia</div>
          </div>
        </Panel>
      </div>
    </BrowserWindow>
  );
}
export default BillingDashboard;
