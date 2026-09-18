import { useState } from 'react';
import { PhoneFrame } from './components/OnboardingChrome';
import { WelcomeScreen, BabyCountScreen, LoggingScreen, FeedingScreen, NextWindowPromiseScreen, NotificationsPermissionScreen, PatternsScreen, AppleAuthScreen, AccountTypeScreen, ReadyScreen } from './screens';

/**
 * Flujo completo, en el orden aprobado.
 * El paginador de 5 puntos cubre SOLO las pantallas 02-07 (las del carrusel);
 * 01, 06, 08, 09 y 10 no lo llevan porque no son pasos, son decisiones.
 */
const ORDER = [
  WelcomeScreen, BabyCountScreen, LoggingScreen, FeedingScreen,
  NextWindowPromiseScreen, NotificationsPermissionScreen, PatternsScreen,
  AppleAuthScreen, AccountTypeScreen, ReadyScreen,
];

export function OnboardingFlow({ framed = true }) {
  const [i, setI] = useState(0);
  const [twins, setTwins] = useState('two');
  const [advisor, setAdvisor] = useState(null);

  const next = () => setI((n) => Math.min(n + 1, ORDER.length - 1));
  const Screen = ORDER[i];

  const screen = (
    <Screen
      onStart={next} onSignIn={next} onNext={next} onSkip={() => setI(7)}
      onAllow={next} onDecline={next} onApple={next}
      onContinue={next} onLogNow={() => setI(0)}
      onPaste={() => setAdvisor({ name: 'Carolina', initial: 'C' })}
      onSelect={setTwins} advisor={advisor}
    />
  );

  if (!framed) return screen;
  return (
    <div className="flex flex-col items-center gap-[14px]">
      <PhoneFrame>{screen}</PhoneFrame>
      <div className="flex items-center gap-[10px] font-mono text-[11px] text-[#8A8299]">
        <button type="button" onClick={() => setI(Math.max(0, i - 1))}>←</button>
        <span>{String(i + 1).padStart(2, '0')} / 10</span>
        <button type="button" onClick={next}>→</button>
      </div>
    </div>
  );
}
export default OnboardingFlow;
