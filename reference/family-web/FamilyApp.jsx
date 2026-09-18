import { useState } from 'react';
import { TabBar } from '../../components/navigation/TabBar';
import { Toast } from '../../components/feedback/Toast';
import { FAMILY_TABS } from './navigation/tabs';
import { TodayScreen, MilkScreen, AnalyticsScreen, GuideScreen, GuideCategoryScreen, TeamScreen } from './screens/main';
import { SleepLogSheet, FeedLogSheet, EventDetailSheet, JoinWithCodeScreen, PaywallScreen } from './screens/overlays';
import { WelcomeScreen, BabyCountScreen, SleepFeedIntroScreen, PumpingIntroScreen, NextWindowScreen, NotificationsPermissionScreen, PatternsIntroScreen, AppleAuthScreen, AccountTypeScreen, ReadyScreen } from './screens/onboarding';

const ONBOARDING = [WelcomeScreen, BabyCountScreen, SleepFeedIntroScreen, PumpingIntroScreen, NextWindowScreen, NotificationsPermissionScreen, PatternsIntroScreen, AppleAuthScreen, AccountTypeScreen, ReadyScreen];

/**
 * Nocttua App (cuidadores).
 * Router de ejemplo con useState — reemplazar por React Navigation (nativo)
 * o React Router (web) sin tocar las pantallas: todas reciben callbacks.
 */
export function FamilyApp({ startInOnboarding = false }) {
  const [step, setStep] = useState(startInOnboarding ? 0 : null);
  const [tab, setTab] = useState('hoy');
  const [twins, setTwins] = useState(true);
  const [guideCat, setGuideCat] = useState(null);
  const [sheet, setSheet] = useState(null);   // 'sleep' | 'feed' | 'pump' | 'event'
  const [event, setEvent] = useState(null);
  const [full, setFull] = useState(null);     // 'paywall' | 'code'
  const [toast, setToast] = useState(null);

  const say = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  if (step != null) {
    const Screen = ONBOARDING[step];
    const next = () => (step + 1 < ONBOARDING.length ? setStep(step + 1) : setStep(null));
    return (
      <Screen
        onNext={next} onAllow={next} onSkip={next} onAuth={next} onFinish={() => setStep(null)}
        onSelect={(v) => setTwins(v === 'two')}
      />
    );
  }

  return (
    <>
      {tab === 'hoy' ? (
        <TodayScreen
          onLogSleep={() => setSheet('sleep')} onLogFeed={() => setSheet('feed')}
          onOpenEvent={(e) => { setEvent(e); setSheet('event'); }} onOpenDay={() => setTab('patrones')}
        />
      ) : null}
      {tab === 'leche' ? <MilkScreen onLogPump={() => setSheet('pump')} onOpenEvent={(e) => { setEvent(e); setSheet('event'); }} /> : null}
      {tab === 'patrones' ? <AnalyticsScreen onExport={() => say('Reporte enviado a tu correo')} /> : null}
      {tab === 'guia' ? (
        guideCat ? <GuideCategoryScreen categoryId={guideCat} onBack={() => setGuideCat(null)} /> : <GuideScreen onOpenCategory={setGuideCat} />
      ) : null}
      {tab === 'equipo' ? <TeamScreen onInvite={() => setFull('code')} onOpenMember={() => say('Gestión de acceso')} /> : null}

      <TabBar items={FAMILY_TABS} active={tab} onSelect={(id) => { setTab(id); setGuideCat(null); }} />

      <SleepLogSheet open={sheet === 'sleep'} twins={twins} onClose={() => setSheet(null)} onSave={() => { setSheet(null); say('Sueño anotado'); }} />
      <FeedLogSheet open={sheet === 'feed' || sheet === 'pump'} mode={sheet === 'pump' ? 'pump' : 'feed'} twins={twins} onClose={() => setSheet(null)} onSave={() => { setSheet(null); say('Registro guardado'); }} />
      <EventDetailSheet open={sheet === 'event'} event={event} onClose={() => setSheet(null)} onEdit={() => { setSheet(null); say('Editar registro'); }} onDelete={() => { setSheet(null); say('Registro borrado'); }} />

      {full === 'code' ? <JoinWithCodeScreen onClose={() => setFull(null)} onLink={() => { setFull(null); say('Asesora vinculada'); }} /> : null}
      {full === 'paywall' ? <PaywallScreen onClose={() => setFull(null)} onSubscribe={() => { setFull(null); say('Prueba activada'); }} /> : null}

      <Toast open={!!toast}>{toast}</Toast>
    </>
  );
}
export default FamilyApp;
