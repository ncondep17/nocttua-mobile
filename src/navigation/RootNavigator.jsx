import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { theme } from '@nocttua/theme/native';
import { supabase } from '../lib/supabase';
import { getMyFamilyId } from '../data/family';
import { OnboardingStack } from './OnboardingStack';
import { FamilyShell } from './FamilyShell';
import { AccountTypeScreen } from '../screens/onboarding/09_AccountTypeScreen';
import { ReadyScreen } from '../screens/onboarding/10_ReadyScreen';
import { RoleScreen } from '../screens/onboarding/RoleScreen';
import { AssessmentFlow } from '../screens/onboarding/assessment/AssessmentFlow';

/**
 * Sin sesión -> OnboardingStack (01-08, termina en Apple).
 * Sesión recién creada en esta corrida ->
 *   09_AccountType -> 10_Ready -> (si iba sola) BabySurvey -> FamilyShell
 *                              -> (si se vinculó con código) RoleScreen -> FamilyShell
 * Sesión ya existente al abrir la app (relanzamiento) -> se verifica que la
 * cuenta ya tenga família creada; si no (quedó a mitad del onboarding la
 * vez anterior), retoma en 09 en vez de romper contra FamilyShell.
 */
export function RootNavigator() {
  const [session, setSession] = useState(undefined);
  const [postAuthStep, setPostAuthStep] = useState(null); // 'accountType' | 'ready' | 'babySurvey' | 'role' | null
  const [twins, setTwins] = useState(true);
  const [linked, setLinked] = useState(false);
  const [familyChecked, setFamilyChecked] = useState(false);

  useEffect(() => {
    // getSession() resuelve una sesión ya persistida (relanzamiento de la
    // app): eso NO debe disparar el flujo post-registro. onAuthStateChange
    // también emite un evento inicial con esa misma sesión restaurada — el
    // tipo de evento 'SIGNED_IN' es lo único que distingue un login real
    // ocurrido en esta corrida de una sesión que ya existía; comparar por
    // referencia previa es una carrera (el evento inicial puede llegar antes
    // de que getSession() resuelva) y fue la causa de saltarse el onboarding.
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'SIGNED_IN') setPostAuthStep('accountType');
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || postAuthStep !== null) return;
    let cancelled = false;
    getMyFamilyId()
      .then(() => { if (!cancelled) setFamilyChecked(true); })
      .catch((err) => {
        if (cancelled) return;
        // PGRST116 = .single() sin filas: la cuenta existe pero nunca terminó
        // de crear su família (se cerró la app a mitad del onboarding).
        if (err.code === 'PGRST116') setPostAuthStep('accountType');
        setFamilyChecked(true);
      });
    return () => { cancelled = true; };
  }, [session, postAuthStep]);

  if (session === undefined || (session && postAuthStep === null && !familyChecked)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.color.noche900 }}>
        <ActivityIndicator color={theme.color.cremaPaper} />
      </View>
    );
  }

  if (!session) {
    return <OnboardingStack onSelectTwins={(v) => setTwins(v === 'two')} />;
  }

  if (postAuthStep === 'accountType') {
    return (
      <AccountTypeScreen
        onNext={({ linked: didLink }) => {
          setLinked(didLink);
          setPostAuthStep('ready');
        }}
      />
    );
  }
  if (postAuthStep === 'ready') {
    return (
      <ReadyScreen
        linked={linked}
        onFinish={() => setPostAuthStep(linked ? 'role' : 'babySurvey')}
      />
    );
  }
  if (postAuthStep === 'role') {
    return <RoleScreen onDone={() => setPostAuthStep(null)} />;
  }
  if (postAuthStep === 'babySurvey') {
    return <AssessmentFlow twins={twins} onDone={() => setPostAuthStep(null)} />;
  }

  return <FamilyShell twins={twins} />;
}
export default RootNavigator;
