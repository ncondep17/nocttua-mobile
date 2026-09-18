import { useState } from 'react';
import { ScreenTitle, NightCard, Card, CardTitle, Eyebrow, SegTabs, MetricBar, Legend } from '../../components/primitives';
import { ScreenBody } from '../../components/MobileChrome';
import { NAMES, ACCENT } from '../../data/profiles';
import { REC, DAYS } from '../../data/records';
import {
  twinRows, twinGap, twinVerdict, correlations, heatRow, restRows, restFlag, howBar,
  wakeCurve, scatter, baseWakes, avgWindow, avgLatency, avgNapLen, avgNightFeeds,
} from '../../lib/derive';
import { dur, one, avg } from '../../lib/time';
import { latencyOf, perBaby } from '../../lib/derive';

/**
 * Datos — la pantalla que justifica la suscripción.
 * Regla no negociable: DESCRIBE, no califica. Sin rachas, sin puntuaciones,
 * sin "mejorá". Se comparan los datos reales contra el rango de la edad y se
 * nombra la asociación, nunca la causa.
 *
 * Orden: comparación entre las dos → logro de la semana (verde) → en qué seguir
 * trabajando (noche) → mapa semanal → curvas → mini-KPIs → descanso real →
 * factores → progreso.
 */
export function AnalyticsScreen({ profile, episode }) {
  const p = profile;
  const [baby, setBaby] = useState(0);
  const [dayIdx, setDayIdx] = useState(null);
  const base = baseWakes();
  const gap = twinGap();
  const curve = wakeCurve(baby);
  const sc = scatter(p);
  const rest = restRows(p);
  const corr = correlations().slice(0, 4);

  return (
    <ScreenBody gap={14}>
      <ScreenTitle eyebrow="22 – 28 jul · 14 registros" title="Analíticas" />

      {/* Los días de enfermedad quedan FUERA de promedios, correlaciones y cumplimiento.
          Es el valor menos obvio del modo enfermedad: una semana enferma no puede
          bajar el cumplimiento del plan ni mover las ventanas objetivo. */}
      {episode && episode.active ? (
        <div className="flex items-start gap-[10px] rounded-[14px] border border-[#EFCFC7] bg-[#FFF6F4] px-[13px] py-[11px]">
          <span className="grid h-[20px] w-[20px] shrink-0 place-items-center rounded-full bg-[#F7DED7] text-[11px] text-[#C25F45]">i</span>
          <span className="text-[12.5px] leading-[1.5] text-[#4A4459]">
            {NAMES[0]} y {NAMES[1]} están en modo enfermedad desde hace {episode.day} días. Esos días quedan fuera de los promedios y de las correlaciones: no bajan tu cumplimiento del plan.
          </span>
        </div>
      ) : null}

      <Card border="#C9C1D8" radius={18} pad="15px 16px" className="animate-riseIn gap-[13px]"
        style={{ boxShadow: '0 12px 30px -22px rgba(22,22,43,.55)' }}>
        <div className="flex items-baseline justify-between gap-[10px]">
          <div className="flex flex-col gap-[2px]">
            <Eyebrow>Mía vs. Lía</Eyebrow>
            <span className="text-[16.5px] font-medium text-[#16162B]">Cómo se comparan esta semana</span>
          </div>
          <span style={{ background: gap.bg, color: gap.fg }} className="shrink-0 rounded-[99px] px-[10px] py-[5px] text-[12px]">{gap.label}</span>
        </div>

        {twinRows().map(t => (
          <div key={t.label} className="flex flex-col gap-[5px]">
            <div className="grid grid-cols-[56px_1fr_56px] items-baseline gap-[8px]">
              <span className="font-mono text-[13.5px] text-[#6B5DD3]">{t.a}</span>
              <span className="text-center text-[12.5px] text-[#8A8299]">{t.label}</span>
              <span className="text-right font-mono text-[13.5px] text-[#C2703F]">{t.b}</span>
            </div>
            <div className="flex items-center gap-[3px]">
              <div className="flex h-[8px] flex-1 justify-end overflow-hidden rounded-[99px] bg-[#F3EEE6]">
                <div style={{ width: t.aPct + '%', background: t.aColor }} className="h-full animate-growW rounded-[99px]" />
              </div>
              <div className="h-[8px] flex-1 overflow-hidden rounded-[99px] bg-[#F3EEE6]">
                <div style={{ width: t.bPct + '%', background: t.bColor }} className="h-full animate-growW rounded-[99px]" />
              </div>
            </div>
          </div>
        ))}

        <div className="rounded-[12px] bg-[#FBF7F0] px-[12px] py-[11px] text-[13px] leading-[1.5] text-[#4A4459]">{twinVerdict()}</div>
      </Card>

      {/* Logro de la semana. El único momento celebratorio del producto:
          una vez por semana, con datos, y siempre atribuido al esfuerzo de ellos. */}
      <div style={{ background: 'linear-gradient(150deg, #2F7A5E 0%, #3F7A62 60%, #4C8B6B 100%)', borderRadius: 18, padding: '17px 18px' }}
        className="relative animate-riseIn flex-col gap-[11px] overflow-hidden flex">
        <div className="absolute -right-[20px] -top-[30px] h-[130px] w-[130px] animate-sheen rounded-[99px] bg-white/[.09]" />
        <div className="flex items-center gap-[9px]">
          <span className="grid h-[24px] w-[24px] animate-popIn place-items-center rounded-[99px] bg-white/[.22] text-[13px] text-white">✓</span>
          <Eyebrow tone="#CDEBDC">Buen trabajo esta semana</Eyebrow>
        </div>
        <span className="font-display-app text-[25px] leading-[1.2] text-white">Bajaron de 5,4 a {one(base)} despertares por noche.</span>
        <span className="text-[14px] leading-[1.5] text-[#D6EFE2]">Tres noches con la ventana más corta dieron las mejores noches de la semana. Lo que están haciendo funciona: sostenelo.</span>
        <div className="mt-[2px] flex flex-wrap gap-[7px]">
          {['2 noches de 3 despertares o menos', '6 de 14 se durmieron solas', 'Latencia bajó a ' + Math.round(avgLatency()) + ' min'].map(m => (
            <span key={m} className="rounded-[99px] bg-white/[.16] px-[10px] py-[5px] text-[12px] text-white">{m}</span>
          ))}
        </div>
      </div>

      <NightCard pad="16px" className="animate-riseIn">
        <Eyebrow tone="amber">En qué seguir trabajando</Eyebrow>
        <span className="font-display-app text-[23px] leading-[1.25] text-[#FBF7F0]">
          La ventana de la mañana promedia {dur(Math.round(avgWindow()))} y el objetivo es {p.windowTarget}. Llegan sobrecansadas a la siesta y la noche se fragmenta.
        </span>
        <div className="mt-[3px] flex flex-wrap gap-[18px] border-t border-[#33335F] pt-[11px]">
          <div><div className="font-mono text-[22px] text-[#FBF7F0]">{dur(Math.round(avgWindow()))}</div><div className="text-[12px] text-[#8E87B5]">ventana AM real</div></div>
          <div><div className="font-mono text-[22px] text-[#F0A868]">{p.windowTarget}</div><div className="text-[12px] text-[#8E87B5]">objetivo edad</div></div>
          <div><div className="font-mono text-[22px] text-[#FBF7F0]">{one(base)}</div><div className="text-[12px] text-[#8E87B5]">despertares/noche</div></div>
        </div>
      </NightCard>

      <SegTabs items={[{ id: 0, label: NAMES[0] }, { id: 1, label: NAMES[1] }]} active={baby} onSelect={(id) => { setBaby(id); setDayIdx(null); }} />

      {/* Mapa de la semana: cada fila es un día completo de 24 h desde las 6:00. */}
      <Card>
        <CardTitle right="toca un día">Mapa de la semana</CardTitle>
        <div className="grid grid-cols-[26px_1fr] items-center gap-[5px]">
          <span />
          <div className="flex justify-between font-mono text-[9.5px] text-[#A9A2B5]">
            <span>6a</span><span>10a</span><span>2p</span><span>6p</span><span>10p</span><span>2a</span><span>6a</span>
          </div>
        </div>
        {DAYS.map((d, di) => {
          const h = heatRow(di, baby);
          const sel = dayIdx === di;
          return (
            <div key={d} onClick={() => setDayIdx(sel ? null : di)}
              style={{ background: sel ? '#F6F1FB' : 'transparent' }}
              className="-mx-[3px] grid cursor-pointer grid-cols-[26px_1fr] items-center gap-[5px] rounded-[7px] px-[3px] py-[2px]">
              <span style={{ color: sel ? '#6B5DD3' : '#8A8299' }} className="font-mono text-[11.5px]">{h.day}</span>
              <div className="relative flex h-[26px] overflow-hidden rounded-[5px]">
                {h.segments.map((s, i) => <div key={i} style={{ width: s.width, background: s.bg }} />)}
                {h.ticks.map((t, i) => <div key={'t' + i} style={{ left: t }} className="absolute bottom-0 top-0 w-px bg-[rgba(251,247,240,.28)]" />)}
                {h.dots.map((dt, i) => (
                  <div key={'d' + i} style={{ left: dt, marginTop: -3, marginLeft: -3 }} className="absolute top-1/2 h-[6px] w-[6px] rounded-[99px] bg-[#F0A868]" />
                ))}
                <span style={{ left: h.napLabelLeft }} className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[9.5px] text-white">{h.napLabel}</span>
              </div>
            </div>
          );
        })}
        <div className="border-t border-[#F0EAE0] pt-[10px]">
          <Legend items={[
            { label: 'noche', color: '#2C2C52' }, { label: 'siesta', color: '#6B5DD3' },
            { label: 'despierta', color: '#F6EFE2' }, { label: 'despertar', color: '#F0A868', dot: true },
          ]} />
        </div>
      </Card>

      {/* Curva de despertares. Punto verde = noche de 3 o menos. */}
      <Card className="animate-riseIn gap-[10px]">
        <div className="flex items-baseline justify-between">
          <span className="text-[16px] font-medium text-[#16162B]">Despertares por noche</span>
          <span className="font-mono text-[12px] text-[#3F7A62]">↓ 26% vs. semana pasada</span>
        </div>
        <svg viewBox="0 0 340 128" className="h-auto w-full overflow-visible">
          <defs>
            <linearGradient id="wkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6B5DD3" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#6B5DD3" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[102, 66, 30].map(y => <line key={y} x1="0" y1={y} x2="340" y2={y} stroke="#EDE6DA" strokeWidth="1" />)}
          <polygon points={curve.area} fill="url(#wkFill)" />
          <polyline points={curve.line} fill="none" stroke="#6B5DD3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="900" className="animate-drawIn" />
          {curve.points.map(pt => (
            <circle key={pt.x} cx={pt.x} cy={pt.y} r="4.5" fill={pt.wakes <= 3 ? '#3F7A62' : '#6B5DD3'} stroke="#FFFFFF" strokeWidth="2" />
          ))}
          {curve.points.map(pt => (
            <text key={'t' + pt.x} x={pt.x} y="122" textAnchor="middle" fontFamily="DM Mono, monospace" fontSize="10" fill="#A9A2B5">{pt.day}</text>
          ))}
        </svg>
        <span className="text-[12px] leading-[1.45] text-[#8A8299]">Los puntos verdes son noches de 3 o menos despertares.</span>
      </Card>

      {/* Dispersión ventana → despertares. La hipótesis central del caso, en un gráfico. */}
      <Card className="animate-riseIn gap-[10px]">
        <span className="text-[16px] font-medium text-[#16162B]">Ventana de la mañana → despertares</span>
        <span className="text-[12.5px] leading-[1.45] text-[#8A8299]">Cada punto es una noche. Cuanto más a la derecha, más larga fue la ventana.</span>
        <svg viewBox="0 0 340 150" className="h-auto w-full overflow-visible">
          <line x1="34" y1="8" x2="34" y2="118" stroke="#EDE6DA" strokeWidth="1" />
          <line x1="34" y1="118" x2="336" y2="118" stroke="#EDE6DA" strokeWidth="1" />
          <line x1={sc.targetX} y1="4" x2={sc.targetX} y2="118" stroke="#7FB09A" strokeWidth="1.5" strokeDasharray="4 4" />
          <text x={sc.targetX} y="12" textAnchor="middle" fontFamily="DM Mono, monospace" fontSize="9.5" fill="#3F7A62">objetivo</text>
          {sc.yAxis.map(a => <text key={a.label} x="26" y={a.y} textAnchor="end" fontFamily="DM Mono, monospace" fontSize="9.5" fill="#A9A2B5">{a.label}</text>)}
          {sc.xAxis.map(a => <text key={a.label} x={a.x} y="132" textAnchor="middle" fontFamily="DM Mono, monospace" fontSize="9.5" fill="#A9A2B5">{a.label}</text>)}
          {sc.dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r="6" fill={ACCENT[d.baby]} fillOpacity="0.85" stroke="#FFFFFF" strokeWidth="1.5"
              style={{ animation: 'popIn .4s ease both', animationDelay: d.delay }} />
          ))}
          <text x="185" y="147" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="10" fill="#A9A2B5">ventana antes de la siesta</text>
        </svg>
        <Legend items={[{ label: NAMES[0], color: ACCENT[0], dot: true }, { label: NAMES[1], color: ACCENT[1], dot: true }]} size="12px" />
      </Card>

      <div className="grid grid-cols-2 gap-[11px]">
        {[
          { label: 'Latencia media', value: Math.round(avgLatency()) + ' min', sub: 'Mía ' + Math.round(avg(perBaby(0).map(latencyOf))) + ' · Lía ' + Math.round(avg(perBaby(1).map(latencyOf))), good: true },
          { label: 'Siestas por día', value: '1,0', sub: 'esperado ' + p.napsLabel, good: true },
          { label: 'Duración media de siesta', value: dur(Math.round(avgNapLen())), sub: 'rango ' + p.napLen, good: true },
          { label: 'Tomas nocturnas', value: one(avgNightFeeds()), sub: 'esperado ' + p.nightFeeds, good: avgNightFeeds() <= 1 },
        ].map(m => (
          <div key={m.label} className="flex flex-col gap-[5px] rounded-[16px] border border-[#E4DCD0] bg-white p-[13px]">
            <span className="text-[12.5px] leading-[1.3] text-[#8A8299]">{m.label}</span>
            <span className="font-mono text-[23px] text-[#16162B]">{m.value}</span>
            <span style={{ color: m.good ? '#7FB09A' : '#D9705A' }} className="text-[12px] leading-[1.35]">{m.sub}</span>
          </div>
        ))}
      </div>

      {/* Descanso real contra el rango de la edad. El punto se mueve, la banda verde es el rango. */}
      <Card className="animate-riseIn gap-[14px]">
        <div className="flex flex-col gap-[3px]">
          <span className="text-[16px] font-medium text-[#16162B]">Patrón de descanso real</span>
          <span className="text-[12.5px] leading-[1.45] text-[#8A8299]">Lo que duermen de verdad, sobre el rango esperado a los {p.short}.</span>
        </div>

        {rest.map(r => (
          <div key={r.baby} className="flex flex-col gap-[7px]">
            <div className="flex items-baseline justify-between">
              <span style={{ color: ACCENT[r.baby] }} className="text-[14.5px] font-medium">{NAMES[r.baby]}</span>
              <span className="flex items-baseline gap-[7px]">
                <span className="font-mono text-[16px] text-[#16162B]">{r.value}</span>
                <span style={{ background: r.inRange ? '#DCEDE4' : '#FFF3E3', color: r.inRange ? '#3F7A62' : '#B07A3C' }}
                  className="rounded-[99px] px-[9px] py-[3px] text-[11.5px]">{r.tag}</span>
              </span>
            </div>
            <div className="relative h-[30px]">
              <div className="absolute left-0 right-0 top-[11px] h-[8px] rounded-[99px] bg-[#F3EEE6]" />
              <div style={{ left: r.bandLeft, right: r.bandRight }} className="absolute top-[11px] h-[8px] rounded-[99px] bg-[#DCEDE4]" />
              <div style={{ left: r.dotLeft, marginLeft: -9, background: r.color, boxShadow: '0 2px 8px -2px rgba(22,22,43,.4)' }}
                className="absolute top-[6px] h-[18px] w-[18px] animate-popIn rounded-[99px] border-[3px] border-white" />
              <span style={{ left: r.dotLeft, color: r.color }} className="absolute top-[26px] -translate-x-1/2 whitespace-nowrap font-mono text-[10px]">{r.value}</span>
            </div>
            <div className="flex justify-between font-mono text-[10px] text-[#A9A2B5]">
              <span>{r.axisLow}</span>
              <span className="text-[#3F7A62]">rango esperado {r.band}</span>
              <span>{r.axisHigh}</span>
            </div>
          </div>
        ))}

        <span className="text-[12.5px] leading-[1.5] text-[#4A4459]">
          A los {p.short.replace('m', 'meses').replace('a', 'años')} se esperan entre {p.totalLow} y {p.totalHigh} horas de sueño en 24 h, contando siesta y noche. Lo que ves arriba es su promedio real de esta semana.
        </span>

        {/* Bandera suave: nunca alarmista, nunca un diagnóstico. Deriva al pediatra. */}
        {restFlag(p) ? (
          <div className="flex items-start gap-[9px] rounded-[12px] border border-[#EFDCC4] bg-[#FFF9F0] px-[12px] py-[11px]">
            <span className="grid h-[20px] w-[20px] shrink-0 place-items-center rounded-[99px] bg-[#F5E3C8] text-[11px] text-[#B08A55]">i</span>
            <span className="text-[12.5px] leading-[1.5] text-[#6E6878]">
              Llevan varios días seguidos por debajo del rango esperado. No es una urgencia y suele corregirse ajustando horarios, pero si se mantiene otra semana vale la pena mencionárselo al pediatra en el próximo control.
            </span>
          </div>
        ) : null}

        <div className="flex flex-col gap-[7px] border-t border-[#F0EAE0] pt-[12px]">
          <span className="text-[12.5px] text-[#8A8299]">Cómo se durmieron esta semana</span>
          <div className="flex h-[22px] overflow-hidden rounded-[7px]">
            {howBar().map(h => (
              <div key={h.label} style={{ width: h.width, background: h.color }} className="grid animate-growW place-items-center font-mono text-[11px] text-white">{h.count}</div>
            ))}
          </div>
          <Legend items={howBar().map(h => ({ label: h.label, color: h.color }))} />
        </div>
      </Card>

      {/* Factores. Asociación, no causa — y solo con 3+ noches. */}
      <Card className="gap-[12px]">
        <span className="text-[16px] font-medium text-[#16162B]">Qué está pesando en la noche</span>
        {corr.map(c => (
          <MetricBar key={c.label} label={c.label} value={c.value} pct={c.pct} color={c.color} caption={c.n + ' · media general ' + one(base)} />
        ))}
        <span className="text-[11.5px] leading-[1.45] text-[#A9A2B5]">Asociación, no causa. Se muestra un factor solo con 3+ noches registradas.</span>
      </Card>

      <Card bg="#F3F7F4" border="#C9DED4" className="animate-riseIn gap-[12px]">
        <span className="text-[16px] font-medium text-[#16162B]">Progreso vs. semana pasada</span>
        {[
          { label: 'Despertares por noche', before: '5,4', now: one(base), pb: 77, pn: 57 },
          { label: 'Ventana de la mañana', before: '6h35', now: dur(Math.round(avgWindow())), pb: 95, pn: 78 },
          { label: 'Se durmió sola', before: '2 de 14', now: '6 de 14', pb: 14, pn: 43 },
          { label: 'Tomas nocturnas', before: '2,9', now: one(avgNightFeeds()), pb: 72, pn: 45 },
        ].map((pr, i) => (
          <div key={pr.label} className="flex flex-col gap-[6px]">
            <div className="flex items-baseline justify-between gap-[10px]">
              <span className="text-[14px] text-[#4A4459]">{pr.label}</span>
              <span className="flex items-baseline gap-[7px]">
                <span className="font-mono text-[12.5px] text-[#A9A2B5] line-through">{pr.before}</span>
                <span className="text-[12px] text-[#A9A2B5]">→</span>
                <span className="font-mono text-[15px] text-[#3F7A62]">{pr.now}</span>
              </span>
            </div>
            <div className="relative h-[7px] overflow-hidden rounded-[99px] bg-[#E1EDE6]">
              <div style={{ width: pr.pb + '%' }} className="absolute bottom-0 left-0 top-0 bg-[#C9DED4]" />
              <div style={{ width: pr.pn + '%', animationDelay: (i * 0.08).toFixed(2) + 's' }} className="absolute bottom-0 left-0 top-0 animate-growW rounded-[99px] bg-[#3F7A62]" />
            </div>
          </div>
        ))}
        <span className="text-[12px] leading-[1.5] text-[#3F7A62]">Cuatro de cuatro indicadores mejoraron. Esta es la semana para no cambiar nada más.</span>
      </Card>
    </ScreenBody>
  );
}
export default AnalyticsScreen;
