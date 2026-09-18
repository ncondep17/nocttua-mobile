import { useState } from 'react';
import { ScreenTitle, NightCard, Card, CardTitle, Eyebrow, SegTabs, Legend } from '../../components/primitives';
import { ScreenBody } from '../../components/MobileChrome';
import { NAMES, ACCENT } from '../../data/profiles';
import { PUMP_WEEK } from '../../data/records';
import { feedsDone, feedAt, nowMinutes, pumpStock, pumpBalance } from '../../lib/derive';
import { dur, avg } from '../../lib/time';

/**
 * Leche — tomas, extracción y banco.
 * Es la pantalla que ninguna app de sueño hace bien, y la razón por la que una
 * mamá que extrae elige Nocttua. Cuatro bloques:
 *   1. totales del día en noche
 *   2. dos botones de registro (toma / extracción)
 *   3. registro cronológico filtrable por bebé
 *   4. extracción y banco, con balance semanal
 *   5. día vs. noche: la métrica que predice la noche
 */
export function MilkScreen({ profile, onNewFeed, onNewPump, onOpenEvent }) {
  const p = profile;
  const [scope, setScope] = useState('ambas');
  const now = nowMinutes(p);
  const done = feedsDone(p);
  const feeds = done.filter(e => e.kind !== 'pump');
  const pumps = done.filter(e => e.kind === 'pump');
  const last = feeds.slice().sort((a, b) => feedAt(b) - feedAt(a))[0];
  const nightCount = feeds.filter(e => e.night).length;

  const totals = [
    { value: String(feeds.length), label: 'tomas' },
    { value: feeds.filter(e => e.kind === 'pecho').reduce((a, e) => a + e.qty, 0) + ' min', label: 'al pecho' },
    { value: feeds.filter(e => e.kind === 'biberon').reduce((a, e) => a + e.qty, 0) + ' ml', label: 'en biberón' },
    { value: pumps.reduce((a, e) => a + e.ml, 0) + ' ml', label: 'extraídos' },
  ];

  const dayNote = nightCount > 0
    ? nightCount + (nightCount === 1 ? ' toma fue' : ' tomas fueron') + ' de la noche anterior y ninguna estaba en la tabla de su edad. Corrite esos ml al día para que la noche no dependa de comer.'
    : 'Todo lo de hoy pasó de día y la noche anterior no hubo tomas. Eso es exactamente lo que buscamos.';

  const visible = done
    .filter(e => scope === 'ambas' || e.b === null || String(e.b) === scope)
    .slice().sort((a, b) => feedAt(b) - feedAt(a));

  const bal = pumpBalance();
  const max = Math.max.apply(null, PUMP_WEEK.map(d => Math.max(d.out, d.used))) || 1;

  return (
    <ScreenBody gap={13}>
      <ScreenTitle eyebrow="Martes 28 jul" title="Alimentación" />

      <NightCard pad="14px 16px" className="gap-[11px]">
        <div className="flex items-center justify-between">
          <Eyebrow tone="amber">Hoy hasta ahora</Eyebrow>
          <span className="text-[12.5px] text-[#8E87B5]">
            {last ? 'última toma hace ' + dur(now - feedAt(last)) : 'sin tomas registradas hoy'}
          </span>
        </div>
        <div className="flex flex-wrap gap-[16px]">
          {totals.map(t => (
            <div key={t.label}>
              <div className="font-mono text-[20px] text-[#FBF7F0]">{t.value}</div>
              <div className="text-[11.5px] text-[#8E87B5]">{t.label}</div>
            </div>
          ))}
        </div>
        <div className="border-t border-[#33335F] pt-[10px] text-[13px] leading-[1.45] text-[#B9B2C9]">{dayNote}</div>
      </NightCard>

      <div className="flex gap-[9px]">
        <div onClick={onNewFeed} className="grid min-h-[48px] flex-1 cursor-pointer place-items-center rounded-[13px] bg-[#16162B] text-[15.5px] font-medium text-[#FBF7F0]">＋ Toma</div>
        <div onClick={onNewPump} className="grid min-h-[48px] flex-1 cursor-pointer place-items-center rounded-[13px] border-[1.5px] border-[#6B5DD3] bg-white text-[15.5px] font-medium text-[#6B5DD3]">＋ Extracción</div>
      </div>

      <SegTabs items={[{ id: 'ambas', label: 'Las dos' }, { id: '0', label: 'Mía' }, { id: '1', label: 'Lía' }]} active={scope} onSelect={setScope} />

      <Card>
        <CardTitle right={visible.length + ' registros'}>Registro del día</CardTitle>
        {visible.map((e, i) => {
          const pump = e.kind === 'pump';
          const col = pump ? '#6B5DD3' : ACCENT[e.b];
          return (
            <div key={i} onClick={() => onOpenEvent && onOpenEvent(pump ? 'pump' : 'feed')}
              className="flex cursor-pointer items-center gap-[9px] border-b border-[#F0EAE0] py-[9px] last:border-0">
              <span style={{ minWidth: 38, color: e.night ? '#B07A3C' : '#8A8299' }} className="font-mono text-[13px]">{e.t}</span>
              <span style={{ background: pump ? '#F6F1FB' : (e.b === 0 ? '#F6F1FB' : '#FDF3EA'), color: col }}
                className="grid h-[28px] w-[28px] shrink-0 place-items-center rounded-[9px] text-[12px]">
                {pump ? '⬆' : (e.kind === 'pecho' ? '◍' : '◑')}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                <div className="flex flex-wrap items-baseline gap-[7px]">
                  <span className="text-[14.5px] font-medium text-[#16162B]">
                    {pump ? 'Extracción · ' + e.side.toLowerCase() : NAMES[e.b] + ' · ' + e.src.toLowerCase()}
                  </span>
                  {e.night ? <span className="rounded-[99px] bg-[#FFF3E3] px-[8px] py-[2px] text-[10.5px] text-[#B07A3C]">de noche</span> : null}
                </div>
                <span className="text-[12.5px] leading-[1.35] text-[#8A8299]">
                  {pump ? e.min + ' min · ' + e.dest.toLowerCase() + ' · ' + e.who : e.ctx + ' · ' + e.who}
                </span>
              </div>
              <span style={{ color: pump ? '#6B5DD3' : '#16162B' }} className="whitespace-nowrap text-right font-mono text-[14px]">
                {pump ? e.ml + ' ml' : (e.kind === 'pecho' ? e.qty + ' min' : e.qty + ' ml')}
              </span>
            </div>
          );
        })}
      </Card>

      <Card border="#C9C1D8" className="gap-[13px]">
        <div className="flex items-start justify-between gap-[10px]">
          <div className="flex flex-col gap-[2px]">
            <span className="text-[16px] font-medium text-[#16162B]">Extracción y banco de leche</span>
            <span className="text-[12.5px] text-[#8A8299]">Lo que sacás y lo que queda guardado</span>
          </div>
          <span className="font-mono text-[20px] text-[#6B5DD3]">{pumpStock()} ml</span>
        </div>

        <div className="flex gap-[9px]">
          {[
            { value: pumps.length + '/día', label: 'extracciones hoy' },
            { value: Math.round(avg(PUMP_WEEK.map(d => d.out))) + ' ml', label: 'extraído por día' },
            { value: Math.round(avg(PUMP_WEEK.map(d => d.used))) + ' ml', label: 'consumido del banco' },
          ].map(s => (
            <div key={s.label} className="flex flex-1 flex-col gap-[3px] rounded-[12px] bg-[#FBF7F0] px-[11px] py-[10px]">
              <span className="font-mono text-[16px] text-[#16162B]">{s.value}</span>
              <span className="text-[11.5px] leading-[1.3] text-[#8A8299]">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-[7px]">
          <Eyebrow size={10.5} tracking=".08em">Balance de la semana</Eyebrow>
          <div className="flex h-[76px] items-end gap-[5px]">
            {PUMP_WEEK.map(d => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-[4px]">
                <div className="flex h-[58px] items-end gap-[2px]">
                  <div style={{ width: 8, height: Math.max(4, Math.round((d.out / max) * 100)) + '%', background: '#6B5DD3' }} className="animate-riseIn rounded-t-[3px]" />
                  <div style={{ width: 8, height: Math.max(4, Math.round((d.used / max) * 100)) + '%', background: '#E8B694' }} className="animate-riseIn rounded-t-[3px]" />
                </div>
                <span className="font-mono text-[9.5px] text-[#A9A2B5]">{d.day}</span>
              </div>
            ))}
          </div>
          <Legend items={[{ label: 'extraído', color: '#6B5DD3' }, { label: 'consumido del banco', color: '#E8B694' }]} />
        </div>

        <span className="rounded-[11px] bg-[#FBF7F0] px-[12px] py-[11px] text-[12.5px] leading-[1.5] text-[#4A4459]">
          {bal >= 0
            ? 'Esta semana extrajiste ' + bal + ' ml más de lo que se consumió del banco. Con ese margen podés dejar los turnos de noche cubiertos sin despertarte.'
            : 'Se consumieron ' + Math.abs(bal) + ' ml más de lo extraído. Si querés sostener los turnos de papá, hace falta una extracción más al día.'}
        </span>
      </Card>

      <Card className="gap-[12px]">
        <span className="text-[16px] font-medium text-[#16162B]">Día vs. noche</span>
        <span className="text-[12.5px] leading-[1.45] text-[#8A8299]">Qué parte de la alimentación está pasando de noche. Cuanto más se corre al día, mejor duerme.</span>
        {[0, 1].map(b => {
          const own = feeds.filter(e => e.b === b);
          const night = own.filter(e => e.night).length;
          const day = own.length - night;
          const total = own.length || 1;
          return (
            <div key={b} className="flex flex-col gap-[6px]">
              <div className="flex items-baseline justify-between">
                <span style={{ color: ACCENT[b] }} className="text-[14.5px] font-medium">{NAMES[b]}</span>
                <span className="font-mono text-[12.5px] text-[#8A8299]">{day} de día · {night} de noche</span>
              </div>
              <div className="flex h-[20px] overflow-hidden rounded-[7px]">
                <div style={{ width: ((day / total) * 100).toFixed(1) + '%', background: '#6B5DD3' }} className="grid animate-growW place-items-center font-mono text-[11px] text-white">{day > 0 ? day : ''}</div>
                <div style={{ width: ((night / total) * 100).toFixed(1) + '%', background: '#2C2C52' }} className="grid animate-growW place-items-center font-mono text-[11px] text-[#F0A868]">{night > 0 ? night : ''}</div>
              </div>
            </div>
          );
        })}
        <span className="text-[12px] leading-[1.45] text-[#A9A2B5]">
          A los {p.short} se esperan {p.feedsLabel} tomas en 24 h y {p.nightFeeds === '0' ? 'ninguna' : p.nightFeeds} de noche.
        </span>
      </Card>
    </ScreenBody>
  );
}
export default MilkScreen;
