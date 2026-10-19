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
 * Sin sesión -> OnboardingStack (01-08, termina en Apple o correo).
 * Sesión autenticada, sin família todavía (alta nueva, o se cerró la app a
 * mitad del onboarding la vez anterior) ->
 *   09_AccountType -> 10_Ready -> (si iba sola) BabySurvey -> FamilyShell
 *                              -> (si se vinculó con código) RoleScreen -> FamilyShell
 * Sesión autenticada con família ya creada (relanzamiento normal, o un
 * "Ya tengo cuenta"/Apple Sign In de una cuenta existente después de
 * reinstalar) -> FamilyShell directo, sin pasar por el onboarding de nuevo.
 *
 * Quién tiene família ya o no es lo único que decide esto — no el tipo de
 * evento de auth: antes `onAuthStateChange`'SIGNED_IN' mandaba siempre a
 * 09_AccountType, lo cual estaba bien para un alta nueva pero mandaba a
 * cualquiera que iniciara sesión en una cuenta YA EXISTENTE (reinstalar y
 * tocar "Ya tengo cuenta") a repetir el onboarding entero.
 */
export function RootNavigator() {
  const [session, setSession] = useState(undefined);
  const [postAuthStep, setPostAuthStep] = useState(null); // 'accountType' | 'ready' | 'babySurvey' | 'role' | null
  const [twins, setTwins] = useState(true);
  const [linked, setLinked] = useState(false);
  const [familyChecked, setFamilyChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
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
