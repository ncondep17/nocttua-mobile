import { useState } from 'react';
import { Eyebrow, MetricBar, Legend, Avatar } from '../../components/primitives';
import { BrowserWindow, Panel, PanelTitle } from './DesktopChrome';
import { NAMES, ACCENT } from '../../data/profiles';
import { REC, TODAY_FEEDS, LADDER, LADDER_CURRENT_STEP, LADDER_TOTAL_NIGHTS, LADDER_NIGHTS_DONE, THREAD } from '../../data/records';
import {
  intervals, correlations, compliance, wakesByHour, baseWakes, avgWindow, avgLatency,
  avgNapLen, avgNightFeeds, avgFeeds, windowOf, napLenOf,
} from '../../lib/derive';
import { toMin, fmt, dur, one, avg } from '../../lib/time';

/**
 * Escritorio · Caso — la vista de la asesora sobre UNA familia.
 * Es la contraparte profesional de la app: mismos datos, densidad de trabajo.
 * Columna izquierda = evidencia (timeline, bitácora, gráficas, correlaciones).
 * Columna derecha = intervención (cumplimiento, plan editable, escalera, hilo).
 *
 * El plan es el único lugar del sistema donde se ESCRIBE: la asesora publica v4
 * y la familia lo ve en su pestaña Cuidado.
 */
export function CaseDashboard({ profile, planDraft, setPlanField, watchlist, onPublish, advisorCanEdit = true }) {
  const p = profile;
  const [editing, setEditing] = useState(false);
  const comp = compliance(planDraft);
  const corr = correlations();
  const base = baseWakes();
  const nfAvg = avgNightFeeds();

  const kpis = [
    { value: one(base), label: 'despertares/noche', good: false },
    { value: dur(Math.round(avgWindow())), label: 'ventana AM', good: false },
    { value: Math.round(avgLatency()) + ' min', label: 'latencia', good: false },
    { value: dur(Math.round(avgNapLen())), label: 'siesta media', good: true },
    { value: one(avgFeeds()), label: 'tomas / día', good: true },
  ];

  const tags = [
    { label: 'Mellizas no idénticas', warn: false },
    { label: p.napsLabel + ' siesta(s) esperadas', warn: false },
    { label: p.regression, warn: true },
    { label: 'Cumplimiento del plan ' + comp.pct + '%', warn: comp.pct < 70 },
    { label: one(nfAvg) + ' tomas nocturnas', warn: nfAvg > 1 },
  ];

  const planFields = [
    { k: 'napStart', label: 'Hora objetivo de inicio de siesta', step: 10, fmt: v => fmt(v),
      hint: 'Ventana de ' + dur(planDraft.napStart - toMin('6:20')) + ' desde que despiertan',
      ok: Math.abs((planDraft.napStart - toMin('6:20')) - p.windowMin) <= 30 },
    { k: 'napMax', label: 'Duración máxima de siesta', step: 15, fmt: v => dur(v), hint: 'Rango de su edad: ' + p.napLen, ok: true },
    { k: 'night', label: 'Hora objetivo de sueño nocturno', step: 15, fmt: v => fmt(v),
      hint: 'Son ' + dur(planDraft.night - (planDraft.napStart + planDraft.napMax)) + ' después de la siesta',
      ok: Math.abs((planDraft.night - (planDraft.napStart + planDraft.napMax)) - 255) <= 45 },
    { k: 'wakes', label: 'Despertares nocturnos esperados', step: 1,
      fmt: v => v === 0 ? 'ninguno' : v + (v === 1 ? ' despertar' : ' despertares'),
      hint: 'Ahora promedian ' + one(base), ok: base <= planDraft.wakes + 1 },
    { k: 'latency', label: 'Latencia máxima aceptable', step: 5, fmt: v => v + ' min',
      hint: 'Ahora promedian ' + Math.round(avgLatency()) + ' min', ok: avgLatency() <= planDraft.latency + 5 },
  ];

  return (
    <BrowserWindow url="noctua.app/c/mia-lia · acceso asesora">
      <div className="flex flex-wrap items-start justify-between gap-[26px]">
        <div className="flex flex-col gap-[7px]">
          <Eyebrow size={12} tracking=".12em">Caso · semana 2 de acompañamiento</Eyebrow>
          <h3 className="m-0 font-display-app text-[34px] font-normal text-[#16162B]">Mía &amp; Lía · {p.label}</h3>
          <div className="mt-[3px] flex flex-wrap gap-[7px]">
            {tags.map(t => (
              <span key={t.label}
                style={{
                  background: t.warn ? '#FFF3E3' : '#FFFFFF',
                  border: '1px solid ' + (t.warn ? '#EFCFA4' : '#DCD4C8'),
                  color: t.warn ? '#B07A3C' : '#4A4459',
                }}
                className="rounded-[99px] px-[11px] py-[6px] text-[13px]">{t.label}</span>
            ))}
          </div>
        </div>
        <div className="flex gap-[20px] rounded-[16px] border border-[#E4DCD0] bg-white px-[20px] py-[15px]">
          {kpis.map(k => (
            <div key={k.label}>
              <div style={{ color: k.good ? '#7FB09A' : '#16162B' }} className="font-mono text-[22px]">{k.value}</div>
              <div className="text-[12px] text-[#8A8299]">{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline de ayer: 24 h desde las 6:00, con marcas de despertar y puntos de toma. */}
      <Panel gap={16}>
        <PanelTitle right={
          <Legend size="13px" items={[
            { label: 'siesta', color: '#6B5DD3' }, { label: 'noche', color: '#2C2C52' },
            { label: 'despierta', color: '#FDE9CF' }, { label: 'despertar nocturno', color: '#D9705A' },
            { label: 'toma de leche', color: '#7FB09A', dot: true },
          ]} />
        }>Día de ayer · sueño, vigilia y tomas</PanelTitle>

        {[0, 1].map(b => {
          const r = REC.filter(x => x.b === b && x.d === '28 jul')[0];
          const iv = intervals(r);
          const segs = [
            { m: iv.wake, bg: '#2C2C52', label: '' },
            { m: iv.asleep - iv.wake, bg: '#FDE9CF', label: dur(iv.asleep - iv.wake), color: '#B07A3C' },
            { m: iv.end - iv.asleep, bg: '#6B5DD3', label: dur(iv.end - iv.asleep), color: '#FFFFFF' },
            { m: iv.night - iv.end, bg: '#FDE9CF', label: dur(iv.night - iv.end), color: '#B07A3C' },
            { m: 1440 - iv.night, bg: '#2C2C52', label: '' },
          ];
          const marks = [];
          for (let i = 0; i < r.wakes; i++) {
            const at = iv.night + Math.round(((i + 1) / (r.wakes + 1)) * (1440 - iv.night));
            marks.push(((at / 1440) * 100).toFixed(1) + '%');
          }
          return (
            <div key={b} className="flex items-center gap-[14px]">
              <span style={{ width: 44, color: ACCENT[b] }} className="text-[15px] font-medium">{NAMES[b]}</span>
              <div className="relative flex h-[46px] flex-1 overflow-hidden rounded-[10px]">
                {segs.map((s, i) => (
                  <div key={i} style={{ width: ((s.m / 1440) * 100).toFixed(1) + '%', background: s.bg }} className="grid place-items-center overflow-hidden">
                    <span style={{ color: s.color || 'transparent' }} className="font-mono text-[12px]">{s.label}</span>
                  </div>
                ))}
                {marks.map((m, i) => <div key={'m' + i} style={{ left: m }} className="absolute bottom-0 top-0 w-[3px] bg-[#D9705A]" />)}
                {TODAY_FEEDS[b].map((f, i) => (
                  <div key={'f' + i}
                    style={{ left: (((toMin(f.t) - 360 + 1440) % 1440 / 1440) * 100).toFixed(1) + '%', marginLeft: -4 }}
                    className="absolute bottom-[4px] h-[8px] w-[8px] rounded-[99px] border-[1.5px] border-white bg-[#7FB09A]" />
                ))}
              </div>
            </div>
          );
        })}
        <div className="flex justify-between pl-[58px] font-mono text-[11px] text-[#A9A2B5]">
          {['6a', '9a', '12p', '3p', '6p', '9p', '12a', '3a', '6a'].map((h, i) => <span key={i}>{h}</span>)}
        </div>
      </Panel>

      <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-start gap-[20px]">
        <div className="flex flex-col gap-[20px]">
          {/* Bitácora: la tabla que la asesora exporta y lleva a la sesión. */}
          <Panel>
            <PanelTitle right={<span className="text-[13px] text-[#8A8299]">exportar CSV · PDF semanal</span>}>Bitácora · 7 días</PanelTitle>
            <div className="grid grid-cols-[54px_38px_58px_62px_58px_1fr_72px_64px_56px] gap-[8px] border-b border-[#E4DCD0] pb-[8px] font-mono text-[10px] uppercase tracking-[.05em] text-[#8A8299]">
              <span>Fecha</span><span>Bebé</span><span>Desp.</span><span>Ventana</span><span>Siesta</span>
              <span>Lugar · contacto · factores</span><span>Noche</span><span>Desp. noc.</span><span>Tomas</span>
            </div>
            {REC.slice().reverse().slice(0, 8).map((r, i) => {
              const win = windowOf(r);
              return (
                <div key={i} className="grid grid-cols-[54px_38px_58px_62px_58px_1fr_72px_64px_56px] items-center gap-[8px] border-b border-[#F0EAE0] py-[9px] text-[13px] text-[#4A4459]">
                  <span className="font-mono">{r.d}</span>
                  <span style={{ color: ACCENT[r.b] }} className="text-[13px] font-medium">{NAMES[r.b]}</span>
                  <span className="font-mono">{r.wake}</span>
                  <span style={{ color: win > 360 ? '#D9705A' : '#7FB09A' }} className="font-mono">{dur(win)}</span>
                  <span className="font-mono">{dur(napLenOf(r))}</span>
                  <span className="text-[12.5px] leading-[1.35]">
                    {r.place} · {r.contact} · {r.feedType.toLowerCase()}{r.factors.length ? ' · ' + r.factors.join(', ').toLowerCase() : ''}
                  </span>
                  <span className="font-mono">{r.night}</span>
                  <span style={{ color: r.wakes >= 4 ? '#D9705A' : '#7FB09A' }} className="font-mono">{r.wakes}</span>
                  <span style={{ color: r.nf >= 2 ? '#D9705A' : '#7FB09A' }} className="font-mono text-[12.5px]">{r.feeds} · {r.nf} noc</span>
                </div>
              );
            })}
          </Panel>

          <div className="grid grid-cols-2 gap-[20px]">
            <Panel>
              <span className="text-[17px] font-medium text-[#16162B]">Despertares por hora</span>
              <span className="text-[13px] leading-[1.45] text-[#8A8299]">
                Dónde se concentran los despertares en la noche. Antes de medianoche apunta a sobrecansancio; en la segunda mitad, a asociación de sueño o hambre.
              </span>
              <div className="flex h-[118px] items-end gap-[5px]">
                {wakesByHour().map(h => (
                  <div key={h.label} className="flex flex-1 flex-col items-center gap-[6px]">
                    <div style={{ height: h.pct + '%', background: h.color }} className="w-full rounded-t-[5px]" />
                    <span className="font-mono text-[10px] text-[#A9A2B5]">{h.label}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <span className="text-[17px] font-medium text-[#16162B]">Tomas de leche</span>
              <div className="flex flex-col gap-[12px]">
                <MetricBar label="Tomas por día" value={one(avgFeeds())} pct={Math.round((avgFeeds() / 12) * 100)} color="#7FB09A" />
                <MetricBar label="Tomas nocturnas" value={one(nfAvg)} pct={Math.round((nfAvg / 4) * 100)} color={nfAvg > 1 ? '#D9705A' : '#7FB09A'} />
                <MetricBar label="Toma antes de dormir"
                  value={REC.filter(r => r.contact === 'Con la toma' || r.feedType !== 'Sin toma').length + ' de 14'}
                  pct={Math.round((REC.filter(r => r.contact === 'Con la toma' || r.feedType !== 'Sin toma').length / 14) * 100)} color="#F0A868" />
                <MetricBar label="Tomas nocturnas que «le tocaban»" value={'0 de ' + REC.reduce((a, r) => a + r.nf, 0)} pct={0} color="#D9705A" />
              </div>
              <span className="text-[12.5px] leading-[1.45] text-[#8A8299]">
                Promedio de {one(avgFeeds())} tomas al día y {one(nfAvg)} de noche, cuando a los {p.label.toLowerCase()} se esperan {p.feedsLabel} en 24 h y {p.nightFeeds} nocturnas. Ninguna de las tomas nocturnas registradas «le tocaba» según su tabla: se están usando para volver a dormir.
              </span>
            </Panel>
          </div>

          <Panel gap={16}>
            <span className="text-[18px] font-medium text-[#16162B]">Qué se asocia con más despertares</span>
            {corr.map(c => (
              <div key={c.label} className="grid grid-cols-[250px_1fr_80px_90px] items-center gap-[14px]">
                <span className="text-[14.5px] leading-[1.3] text-[#16162B]">{c.label}</span>
                <div className="h-[11px] rounded-[99px] bg-[#F3EEE6]">
                  <div style={{ width: c.pct + '%', background: c.color }} className="h-full rounded-[99px]" />
                </div>
                <span className="font-mono text-[13px] text-[#8A8299]">{c.n}</span>
                <span style={{ color: c.color }} className="text-right font-mono text-[15px]">{c.value}</span>
              </div>
            ))}
          </Panel>
        </div>

        <div className="flex flex-col gap-[20px]">
          <Panel gap={15}>
            <div className="flex items-start justify-between gap-[14px]">
              <div className="flex flex-col gap-[3px]">
                <span className="text-[17px] font-medium text-[#16162B]">Cumplimiento del plan</span>
                <span className="text-[12.5px] text-[#8A8299]">{comp.ok} de {comp.total} bloques dentro del umbral · 7 días</span>
              </div>
              <div className="flex items-baseline gap-[4px]">
                <span style={{ color: comp.pct >= 75 ? '#3F7A62' : comp.pct >= 50 ? '#B07A3C' : '#D9705A' }} className="font-mono text-[31px]">{comp.pct}</span>
                <span className="text-[13px] text-[#8A8299]">%</span>
              </div>
            </div>
            <div className="flex h-[10px] overflow-hidden rounded-[99px] bg-[#F3EEE6]">
              {comp.bar.map((b, i) => <div key={i} style={{ width: b.width, background: b.color }} className="animate-growW" />)}
            </div>
            <div className="flex flex-col gap-[2px]">
              {comp.rows.map(r => (
                <div key={r.label} className="grid grid-cols-[20px_1fr_auto_auto] items-center gap-[10px] border-b border-[#F0EAE0] py-[9px]">
                  <span style={{ background: r.iconBg, color: r.iconFg }} className="grid h-[20px] w-[20px] place-items-center rounded-[99px] text-[11px]">{r.icon}</span>
                  <div className="flex flex-col gap-[1px]">
                    <span className="text-[14px] text-[#16162B]">{r.label}</span>
                    <span className="text-[12px] text-[#A9A2B5]">umbral {r.threshold}</span>
                  </div>
                  <span className="text-right font-mono text-[13.5px] text-[#4A4459]">{r.real}</span>
                  <span style={{ color: r.tone, minWidth: 44 }} className="text-right font-mono text-[13px]">{r.pct}%</span>
                </div>
              ))}
            </div>
            <span className="text-[12.5px] leading-[1.5] text-[#4A4459]">{comp.note}</span>
          </Panel>

          {/* Plan: leer o editar. Publicar sube la v4 a la app de la familia. */}
          <div style={{ background: '#16162B', borderRadius: 18, padding: '20px 22px' }} className="flex flex-col gap-[14px]">
            <div className="flex items-center justify-between">
              <Eyebrow tone="amber" size={11} tracking=".12em">{editing ? 'Editando plan · v4' : 'Plan vigente'}</Eyebrow>
              <span className="text-[13px] text-[#8E87B5]">{editing ? 'sin publicar' : 'v3 · 26 jul'}</span>
            </div>

            {!editing ? (
              <>
                <div className="flex flex-col gap-[11px]">
                  {planFields.map(f => (
                    <div key={f.k} className="flex items-baseline justify-between gap-[12px]">
                      <span className="text-[14.5px] leading-[1.35] text-[#B9B2C9]">{f.label}</span>
                      <span className="whitespace-nowrap font-mono text-[15px] text-[#FBF7F0]">{f.fmt(planDraft[f.k])}</span>
                    </div>
                  ))}
                  <div className="flex flex-col gap-[8px] border-t border-[#33335F] pt-[12px]">
                    {[
                      { when: 'noche 5', what: 'Silla a mitad del cuarto, entre las dos camas. Contacto intermitente.' },
                      { when: 'de noche', what: 'Sin tomas nocturnas salvo indicación del pediatra: acompañar hasta dormirse.' },
                    ].map(n => (
                      <div key={n.when} className="flex items-baseline gap-[10px]">
                        <span style={{ minWidth: 58 }} className="font-mono text-[12.5px] text-[#A79FE0]">{n.when}</span>
                        <span className="text-[14px] leading-[1.4] text-[#FBF7F0]">{n.what}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {advisorCanEdit ? (
                  <div className="flex gap-[9px]">
                    <div onClick={() => setEditing(true)} className="flex-1 cursor-pointer rounded-[12px] bg-[#F0A868] p-[11px] text-center text-[15px] font-medium text-[#16162B]">Ajustar plan → v4</div>
                    <div className="cursor-pointer rounded-[12px] border border-[#4A4A7A] px-[15px] py-[11px] text-[15px] text-[#FBF7F0]">Historial</div>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <div className="flex animate-riseIn flex-col gap-[12px]">
                  {planFields.map(f => (
                    <div key={f.k} className="flex flex-col gap-[6px]">
                      <span className="text-[13px] leading-[1.35] text-[#8E87B5]">{f.label}</span>
                      <div className="flex items-center gap-[9px] rounded-[11px] border border-[#33335F] bg-[#22224A] px-[9px] py-[7px]">
                        <span onClick={() => setPlanField(f.k, Math.max(0, planDraft[f.k] - f.step))}
                          className="grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-[8px] bg-[#2C2C52] text-[15px] text-[#FBF7F0]">−</span>
                        <span className="flex-1 text-center font-mono text-[17px] text-[#FBF7F0]">{f.fmt(planDraft[f.k])}</span>
                        <span onClick={() => setPlanField(f.k, planDraft[f.k] + f.step)}
                          className="grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-[8px] bg-[#2C2C52] text-[15px] text-[#FBF7F0]">＋</span>
                      </div>
                      {/* La pista se pone ámbar cuando el umbral se sale de lo esperado para la edad. */}
                      <span style={{ color: f.ok ? '#8E87B5' : '#F0A868' }} className="text-[12px] leading-[1.4]">{f.hint}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-[9px] border-t border-[#33335F] pt-[13px]">
                  <div onClick={() => { setEditing(false); onPublish && onPublish(); }}
                    className="flex-1 cursor-pointer rounded-[12px] bg-[#F0A868] p-[11px] text-center text-[15px] font-medium text-[#16162B]">Publicar v4</div>
                  <div onClick={() => setEditing(false)} className="cursor-pointer rounded-[12px] border border-[#4A4A7A] px-[15px] py-[11px] text-[15px] text-[#FBF7F0]">Cancelar</div>
                </div>
              </>
            )}
          </div>

          <Panel>
            <PanelTitle right={<span className="font-mono text-[12px] text-[#6B5DD3]">noche {LADDER_NIGHTS_DONE} de {LADDER_TOTAL_NIGHTS}</span>}>Acompañamiento</PanelTitle>
            <div className="flex gap-[4px]">
              {Array.from({ length: LADDER_TOTAL_NIGHTS }).map((_, n) => (
                <div key={n} style={{ background: n < LADDER_NIGHTS_DONE ? '#F0A868' : '#33335F' }} className="h-[6px] flex-1 rounded-[99px]" />
              ))}
            </div>
            {LADDER.map((s, i) => (
              <div key={s.nights} style={{ background: i === LADDER_CURRENT_STEP ? '#F6F1FB' : 'transparent' }}
                className="-mx-[10px] flex items-baseline gap-[12px] rounded-[10px] px-[10px] py-[8px]">
                <span style={{ minWidth: 72 }} className="font-mono text-[12.5px] text-[#8A8299]">{s.nights}</span>
                <span style={{ color: i === LADDER_CURRENT_STEP ? '#16162B' : '#8A8299' }} className="text-[13.5px] leading-[1.5]">{s.text}</span>
              </div>
            ))}
            <div className="border-t border-[#F0EAE0] pt-[12px] text-[13px] leading-[1.5] text-[#8A8299]">
              Con mellizas la silla va entre las dos camas y se aleja hacia la puerta cada tres noches. El ruido blanco evita que una despierte a la otra.
            </div>
          </Panel>

          <Panel>
            <span className="text-[17px] font-medium text-[#16162B]">Hilo del caso</span>
            {THREAD.map((t, i) => (
              <div key={i} className="flex gap-[11px]">
                <Avatar initial={t.initial} size={30} fontSize="12px" bg={t.mine ? '#E8DFF6' : '#DCEDE4'} fg={t.mine ? '#6B5DD3' : '#3F7A62'} />
                <div className="flex flex-col gap-[4px]">
                  <div className="flex items-baseline gap-[8px]">
                    <span className="text-[14px] font-medium text-[#16162B]">{t.who}</span>
                    <span className="text-[12px] text-[#A9A2B5]">{t.when}</span>
                  </div>
                  <div style={{ background: t.mine ? '#F7F4EF' : '#F3F7F4' }} className="rounded-[12px] px-[12px] py-[10px] text-[14.5px] leading-[1.5] text-[#4A4459]">{t.text}</div>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-[12px] border border-[#DCD4C8] px-[13px] py-[11px]">
              <span className="text-[15px] text-[#A9A2B5]">Escribe un comentario…</span>
              <span className="rounded-[9px] bg-[#16162B] px-[13px] py-[7px] text-[14px] text-[#FBF7F0]">Enviar</span>
            </div>
          </Panel>

          <Panel bg="#FFF9F0" border="#EFDCC4" gap={9}>
            <Eyebrow tone="brown">Contexto a vigilar</Eyebrow>
            {watchlist.map(w => (
              <div key={w} className="flex items-baseline gap-[9px]">
                <span className="text-[#B08A55]">·</span>
                <span className="text-[14.5px] leading-[1.45] text-[#4A4459]">{w}</span>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </BrowserWindow>
  );
}
export default CaseDashboard;
