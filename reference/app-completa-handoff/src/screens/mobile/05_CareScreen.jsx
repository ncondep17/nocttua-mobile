import { ScreenTitle, NightCard, Eyebrow, Avatar } from '../../components/primitives';
import { ScreenBody } from '../../components/MobileChrome';
import { MedsPrescriptionCard } from '../../components/MedsPrescriptionCard';
import { TEAM } from '../../data/records';
import { fmt, dur } from '../../lib/time';

/**
 * Cuidado — permisos, plan vigente y lo que está "fuera del sueño".
 *
 * La pestaña reúne temas distintos, por eso NO se llama "Equipo": debajo del plan
 * y de los factores a vigilar hay un separador FUERA DEL SUEÑO y ahí vive
 * "Medicinas indicadas". Todo lo de sueño arriba, todo lo demás abajo.
 * Aquí se ve la arquitectura del producto: mamá y papá son admin, la niñera
 * registra el día, la asesora comenta y ajusta el plan. El plan es de SOLO
 * LECTURA en la app de la familia: se edita desde Nocttua Coach.
 */
export function CareScreen({ profile, planDraft, watchlist, onLinkAdvisor, onEditMeds }) {
  const p = profile;
  const d = planDraft;

  const plan = [
    { when: fmt(d.napStart), what: 'Iniciar la siesta (ventana objetivo ' + p.windowTarget + ')' },
    { when: 'máx ' + dur(d.napMax), what: 'Despertarla si sigue dormida al llegar al máximo' },
    { when: fmt(d.night - 45), what: 'Rutina: baño, cena, cuarto oscuro. Sin carro en las 3 h previas.' },
    { when: fmt(d.night), what: 'A la cama despiertas. Máximo ' + d.latency + ' min para dormirse.' },
    { when: 'de noche', what: 'Sin tomas nocturnas salvo indicación del pediatra: acompañar hasta dormirse.' },
  ];

  return (
    <ScreenBody gap={14}>
      <ScreenTitle eyebrow="Mía & Lía" title="Cuidado" />

      <div className="overflow-hidden rounded-[16px] border border-[#E4DCD0] bg-white">
        {TEAM.map(m => (
          <div key={m.name} className="flex items-center gap-[11px] border-b border-[#F0EAE0] px-[15px] py-[13px]">
            <Avatar initial={m.initial} bg={m.bg} fg={m.fg} />
            <div className="flex-1 leading-[1.3]">
              <div className="text-[15.5px] font-medium text-[#16162B]">{m.name}</div>
              <div className="text-[13px] text-[#8A8299]">{m.role}</div>
            </div>
            <span className="rounded-[99px] border border-[#DCD4C8] bg-[#FBF7F0] px-[10px] py-[5px] text-[12.5px] text-[#4A4459]">{m.perm}</span>
          </div>
        ))}
        <div className="px-[15px] py-[13px] text-[15px] text-[#6B5DD3]">＋ Invitar cuidador</div>
      </div>

      <div onClick={onLinkAdvisor} className="flex cursor-pointer items-center gap-[11px] rounded-[16px] border border-[#C9C1D8] bg-white px-[15px] py-[13px]">
        <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[11px] bg-[#F6F1FB] text-[15px] text-[#6B5DD3]">◇</span>
        <div className="flex-1 leading-[1.35]">
          <div className="text-[15px] font-medium text-[#16162B]">Vincular otra asesora</div>
          <div className="text-[12.5px] text-[#8A8299]">Ingresá su código de invitación</div>
        </div>
        <span className="text-[15px] text-[#A9A2B5]">→</span>
      </div>

      <NightCard pad="16px" className="gap-[12px]">
        <div className="flex items-center justify-between">
          <Eyebrow tone="amber">Plan vigente · v3</Eyebrow>
          <span className="text-[13px] text-[#8E87B5]">Carolina · 26 jul</span>
        </div>
        {plan.map(r => (
          <div key={r.when + r.what} className="flex items-baseline gap-[11px]">
            <span style={{ minWidth: 62 }} className="font-mono text-[13.5px] text-[#A79FE0]">{r.when}</span>
            <span className="text-[14.5px] leading-[1.4] text-[#FBF7F0]">{r.what}</span>
          </div>
        ))}
        <div className="border-t border-[#33335F] pt-[11px] text-[14px] leading-[1.45] text-[#8E87B5]">
          Todos ven el mismo plan. El recordatorio de ventana llega al cuidador de turno.
        </div>
      </NightCard>

      <div className="flex flex-col gap-[9px] rounded-[16px] border border-[#EFDCC4] bg-[#FFF9F0] px-[15px] py-[14px]">
        <Eyebrow tone="brown">Factores a vigilar</Eyebrow>
        {watchlist.map(w => (
          <div key={w} className="flex items-baseline gap-[9px]">
            <span className="text-[#B08A55]">·</span>
            <span className="text-[14.5px] leading-[1.45] text-[#4A4459]">{w}</span>
          </div>
        ))}
      </div>

      {/* Frontera de la pestaña: arriba sueño, abajo lo demás. */}
      <div className="mt-[6px] flex items-center gap-[9px]">
        <Eyebrow>Fuera del sueño</Eyebrow>
        <div className="h-px flex-1 bg-[#DCD4C8]" />
      </div>

      <MedsPrescriptionCard onEdit={onEditMeds} />
    </ScreenBody>
  );
}
export default CareScreen;
