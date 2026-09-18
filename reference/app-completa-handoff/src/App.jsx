import { useState } from 'react';
import { PROFILES, DEFAULT_PROFILE_ID, getProfile, NAMES } from './data/profiles';
import { WEEKDAYS } from './data/records';
import { PhoneFrame, StatusBar, TabBar, Toast } from './components/MobileChrome';
import { Eyebrow } from './components/primitives';
import { TodayScreen, MilkScreen, AnalyticsScreen, TipsScreen, CareScreen } from './screens/mobile';
import { MedsSheet } from './overlays/MedsSheet';
import { GiveDoseSheet } from './overlays/GiveDoseSheet';
import { SEED_DOSES, SEED_EPISODE, getMed, ML } from './data/meds';
import { SleepLogSheet, FeedLogSheet, DayDetailSheet, AdvisorCodeScreen, PaywallScreen } from './screens/overlays';
import { CaseDashboard } from './screens/desktop/CaseDashboard';
import { BillingDashboard } from './screens/desktop/BillingDashboard';
import { nowMinutes, dayDetail } from './lib/derive';
import { fmt, dur } from './lib/time';

/**
 * Cáscara del prototipo: conmutador de vista + selector de edad + barra de perfil.
 * En producción NO existe: la app móvil y el panel web son entrypoints separados,
 * y la edad viene del perfil del bebé, no de un selector.
 *
 * Se conserva porque es la herramienta de revisión del diseño: cambiar la edad
 * recalcula el plan del día, las tomas esperadas, las regresiones y los tips,
 * y es la forma de comprobar que el motor de cálculo está bien implementado.
 */
export function App() {
  const [view, setView] = useState('mobile');
  const [profileId, setProfileId] = useState(DEFAULT_PROFILE_ID);
  const [tab, setTab] = useState('hoy');
  const [sheet, setSheet] = useState(null);        // 'sleep' | 'feed' | 'pump' | 'day'
  const [sheetTitle, setSheetTitle] = useState('');
  const [sheetBaby, setSheetBaby] = useState(0);
  const [dayIdx, setDayIdx] = useState(null);
  const [weekBaby] = useState(0);
  // Modo enfermedad: episodio + dosis dadas. En producción esto vive en la cuenta
  // de la familia y se sincroniza entre cuidadores (ver "Lo que falta" en CLAUDE.md).
  const [episode, setEpisode] = useState(SEED_EPISODE);
  const [doses, setDoses] = useState(SEED_DOSES);
  const [medsOpen, setMedsOpen] = useState(false);
  const [dose, setDose] = useState(null);          // { medId, baby } | null
  const [full, setFull] = useState(null);          // 'code' | 'paywall'
  const [toast, setToast] = useState(null);
  const [planDraft, setPlanDraft] = useState({ napMax: 105, napStart: 700, night: 1175, wakes: 2, latency: 20 });

  const p = getProfile(profileId);
  const setPlanField = (k, v) => setPlanDraft(d => ({ ...d, [k]: v }));
  const flash = (t) => { setToast(t); setSheet(null); setTimeout(() => setToast(null), 2800); };

  const watchlist = [
    'Mía: molar superior izquierdo, 4 noches con teething marcado.',
    'Lía: cena por debajo de lo habitual 5 de 7 noches.',
    p.watch,
  ];

  const viewTab = (id, label) => (
    <div key={id} onClick={() => setView(id)}
      style={{ background: view === id ? '#16162B' : 'transparent', color: view === id ? '#FBF7F0' : '#4A4459' }}
      className="cursor-pointer rounded-[9px] px-[14px] py-[8px] text-[14.5px]">{label}</div>
  );

  return (
    <div className="flex min-h-screen flex-col items-center gap-[22px] px-[24px] pb-[60px] pt-[28px]">
      <div className="flex w-full max-w-[1320px] flex-wrap items-center justify-between gap-[24px]">
        <div className="flex items-baseline gap-[14px]">
          <img src="/assets/wordmark-tight-noche.svg" alt="Nocttua" className="w-[116px] self-center" />
          <span className="text-[14px] text-[#8A8299]">prototipo navegable · toca todo</span>
        </div>
        <div className="flex flex-wrap items-center gap-[10px]">
          <div className="flex gap-[4px] rounded-[12px] border border-[#DCD4C8] bg-[#FBF7F0] p-[4px]">
            {viewTab('mobile', 'Móvil · cuidadores')}
            {viewTab('desktop', 'Escritorio · caso')}
            {viewTab('billing', 'Escritorio · suscripción')}
          </div>
          <div className="flex items-center gap-[8px] rounded-[12px] border border-[#DCD4C8] bg-[#FBF7F0] px-[12px] py-[7px]">
            <Eyebrow tracking=".08em">Edad</Eyebrow>
            {PROFILES.map(pr => (
              <span key={pr.id} onClick={() => setProfileId(pr.id)}
                style={{ background: pr.id === p.id ? '#16162B' : '#EFE9DF', color: pr.id === p.id ? '#FBF7F0' : '#4A4459' }}
                className="cursor-pointer rounded-[8px] px-[9px] py-[6px] font-mono text-[11.5px]">{pr.short}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Barra de perfil activo: la tabla de referencia de la edad, siempre visible. */}
      <div className="flex w-full max-w-[1320px] flex-wrap items-center gap-[26px] rounded-[16px] bg-[#16162B] px-[20px] py-[16px]">
        <div className="flex flex-col gap-[3px]">
          <Eyebrow tone="amber">Perfil activo</Eyebrow>
          <span className="text-[17px] font-medium text-[#FBF7F0]">{p.label}</span>
        </div>
        <div className="w-px self-stretch bg-[#33335F]" />
        <div className="flex flex-wrap gap-[22px]">
          {[
            [p.window, 'ventana de vigilia'], [p.napsLabel, 'siestas esperadas'], [p.napLen, 'duración de siesta'],
            [p.total, 'sueño en 24 h'], [p.feedsLabel, 'tomas de leche / 24 h'],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="font-mono text-[19px] text-[#FBF7F0]">{v}</div>
              <div className="text-[12px] text-[#8E87B5]">{l}</div>
            </div>
          ))}
        </div>
        <div className="min-w-[220px] flex-1 text-[14px] leading-[1.5] text-[#B9B2C9]">{p.note}</div>
      </div>

      {view === 'mobile' ? (
        <div className="flex flex-wrap items-start justify-center gap-[40px]">
          <PhoneFrame>
            <StatusBar clock={fmt(nowMinutes(p))} />
            <div className="no-bars flex min-h-0 flex-1 flex-col overflow-auto">
              {tab === 'hoy' ? (
                <TodayScreen profile={p} episode={episode} doses={doses}
                  onOpenLog={(title, baby) => { setSheetTitle(title); setSheetBaby(baby); setSheet('sleep'); }}
                  onGoMilk={() => setTab('leche')}
                  onOpenMeds={() => setMedsOpen(true)} />
              ) : null}
              {tab === 'leche' ? (
                <MilkScreen profile={p} onNewFeed={() => setSheet('feed')} onNewPump={() => setSheet('pump')}
                  onOpenEvent={(kind) => setSheet(kind)} />
              ) : null}
              {tab === 'analitica' ? <AnalyticsScreen profile={p} episode={episode} /> : null}
              {tab === 'guia' ? (
                <TipsScreen profile={p} onGoTeam={() => setTab('equipo')} onSelectProfile={setProfileId} />
              ) : null}
              {tab === 'equipo' ? (
                <CareScreen profile={p} planDraft={planDraft} watchlist={watchlist}
                  onLinkAdvisor={() => setFull('code')}
                  onEditMeds={() => flash('Editable por quien tenga permiso de admin. La asesora ve la indicación, no la cambia.')} />
              ) : null}
            </div>

            <TabBar active={tab} onSelect={(id) => { setTab(id); setDayIdx(null); }} />

            {medsOpen && !dose ? (
              <MedsSheet episode={episode} doses={doses} now={nowMinutes(p)}
                onGive={(medId, baby) => setDose({ medId, baby })}
                onToggleEpisode={() => {
                  const on = !episode.active;
                  setEpisode({ ...episode, active: on });
                  setMedsOpen(false);
                  flash(on
                    ? 'Modo enfermedad activo. Las dosis del doctor están en Cuidado → Medicinas.'
                    : 'Modo enfermedad cerrado. Los ' + episode.day + ' días quedan guardados como episodio.');
                }}
                onGoCare={() => { setMedsOpen(false); setTab('equipo'); }}
                onClose={() => setMedsOpen(false)} />
            ) : null}

            {dose ? (
              <GiveDoseSheet med={getMed(dose.medId)} doses={doses} now={nowMinutes(p)} baby={dose.baby}
                onSave={(medId, baby, at) => {
                  const m = getMed(medId);
                  setDoses(d => d.concat([{ med: medId, b: baby, t: at, by: 'Mamá' }]));
                  setDose(null); setMedsOpen(false);
                  flash(m.name + ' ' + ML(m.ml[baby]) + ' a ' + NAMES[baby] + ' · ' + fmt(at) + '. La próxima ' + fmt(at + m.everyH * 60) + '.');
                }}
                onSaveBoth={(medId, at) => {
                  const m = getMed(medId);
                  setDoses(d => d.concat([0, 1].map(b => ({ med: medId, b, t: at, by: 'Mamá' }))));
                  setDose(null); setMedsOpen(false);
                  flash(m.name + ' a Mía y Lía · ' + fmt(at) + '. Todo el equipo lo ve, nadie repite la dosis.');
                }}
                onClose={() => setDose(null)} />
            ) : null}

            <SleepLogSheet open={sheet === 'sleep'} title={sheetTitle} baby={sheetBaby}
              onClose={() => setSheet(null)}
              onSave={(b, form, d) => flash('Guardado para ' + NAMES[b] + ' · ventana ' + dur(d.window_) + ', latencia ' + dur(d.latency) + (form.feedType === 'Sin toma' ? ', sin toma.' : ', ' + form.feedType.toLowerCase() + '.'))}
              onSaveBoth={() => flash('Guardado en Mía y Lía. La asesora lo verá en el reporte compartido.')}
              onBoth={() => flash('Registro aplicado a Mía y Lía. Podés editar cada una por separado.')} />

            <FeedLogSheet open={sheet === 'feed' || sheet === 'pump'} mode={sheet === 'pump' ? 'pump' : 'feed'}
              onClose={() => setSheet(null)}
              onSave={(mode, v) => flash(mode === 'pump'
                ? 'Extracción de ' + v.ml + ' ml guardada · ' + v.dest.toLowerCase() + '.'
                : 'Toma de ' + NAMES[v.who] + ' guardada · ' + v.source.toLowerCase() + ', ' + (v.source.indexOf('Biberón') === 0 ? v.qty * 10 + ' ml' : v.qty + ' min') + '.')}
              onSaveBoth={() => flash('Toma guardada para Mía y Lía. Podés editar los minutos de cada una.')} />

            <DayDetailSheet open={dayIdx !== null} detail={dayIdx !== null ? dayDetail(dayIdx, weekBaby, WEEKDAYS) : null} onClose={() => setDayIdx(null)} />

            {full === 'code' ? <AdvisorCodeScreen onClose={() => setFull(null)} onLink={() => { setFull(null); flash('Asesora vinculada. Carolina ya ve tus registros.'); }} /> : null}
            {full === 'paywall' ? <PaywallScreen profile={p} onClose={() => setFull(null)} onSubscribe={() => { setFull(null); flash('Suscripción activa. Todas las analíticas desbloqueadas.'); }} /> : null}

            <Toast>{toast}</Toast>
          </PhoneFrame>

          <div className="flex w-[336px] flex-col gap-[14px] pt-[6px]">
            <Eyebrow tracking=".12em">Cómo probarlo</Eyebrow>
            <div className="flex flex-col gap-[11px] rounded-[16px] border border-[#DCD4C8] bg-[#FBF7F0] px-[18px] py-[16px] text-[14.5px] leading-[1.5] text-[#4A4459]">
              <div>1 · Cambia la <strong>edad</strong> arriba: el plan del día, las tomas esperadas, las regresiones y los tips se recalculan.</div>
              <div>2 · En <strong>Hoy</strong>, toca una celda para registrar sueño (horas, lugar incl. cama Montessori, contacto, toma de pecho o biberón, humor, factores).</div>
              <div>3 · En <strong>Analíticas</strong>, toca cualquier día del mapa para ver los tiempos exactos de esa jornada.</div>
              <div>4 · <strong>Tips</strong> son recordatorios de una línea; el plan y sus ajustes los da la asesora en Cuidado.</div>
            </div>

            <Eyebrow tracking=".12em">Pantallas de flujo</Eyebrow>
            <div onClick={() => setFull('paywall')} className="flex cursor-pointer items-center gap-[10px] rounded-[13px] border border-[#DCD4C8] bg-white px-[14px] py-[12px]">
              <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[10px] bg-[#16162B] text-[13px] text-[#F0A868]">✦</span>
              <div className="flex-1 leading-[1.3]">
                <div className="text-[14.5px] font-medium text-[#16162B]">Paywall de insights</div>
                <div className="text-[12.5px] text-[#8A8299]">Aparece tras el 7º registro</div>
              </div>
              <span className="text-[14px] text-[#A9A2B5]">→</span>
            </div>
            <div onClick={() => setFull('code')} className="flex cursor-pointer items-center gap-[10px] rounded-[13px] border border-[#DCD4C8] bg-white px-[14px] py-[12px]">
              <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[10px] bg-[#DCEDE4] text-[13px] text-[#3F7A62]">◇</span>
              <div className="flex-1 leading-[1.3]">
                <div className="text-[14.5px] font-medium text-[#16162B]">Código de la asesora</div>
                <div className="text-[12.5px] text-[#8A8299]">Paso 4 del onboarding · también en Cuidado</div>
              </div>
              <span className="text-[14px] text-[#A9A2B5]">→</span>
            </div>

            <div className="flex flex-col gap-[8px] rounded-[16px] bg-[#16162B] px-[18px] py-[16px]">
              <Eyebrow tone="amber">Tomas de leche</Eyebrow>
              <span className="text-[14.5px] leading-[1.5] text-[#B9B2C9]">
                Pecho (izq / der / ambos, en minutos) o biberón (en ml), en todas las edades. Cada toma nocturna se marca como «le tocaba» o «no le tocaba» según la tabla de su edad — eso es lo que distingue hambre real de asociación de sueño.
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {view === 'desktop' ? (
        <CaseDashboard profile={p} planDraft={planDraft} setPlanField={setPlanField} watchlist={watchlist}
          onPublish={() => flash('Plan v4 publicado. Los papás y la niñera ya lo ven en su app.')} />
      ) : null}

      {view === 'billing' ? <BillingDashboard /> : null}
    </div>
  );
}
export default App;
