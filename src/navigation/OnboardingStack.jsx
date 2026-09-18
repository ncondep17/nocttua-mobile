import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../screens/onboarding/01_WelcomeScreen';
import { BabyCountScreen } from '../screens/onboarding/02_BabyCountScreen';
import { LoggingScreen } from '../screens/onboarding/03_LoggingScreen';
import { FeedingScreen } from '../screens/onboarding/04_FeedingScreen';
import { NextWindowPromiseScreen } from '../screens/onboarding/05_NextWindowPromiseScreen';
import { NotificationsPermissionScreen } from '../screens/onboarding/06_NotificationsPermissionScreen';
import { PatternsScreen } from '../screens/onboarding/07_PatternsScreen';
import { AppleAuthScreen } from '../screens/onboarding/08_AppleAuthScreen';

const Stack = createNativeStackNavigator();

/**
 * Onboarding aprobado, pantallas 01-08 (09 y 10 corren después de la sesión,
 * en RootNavigator). "Saltar" en 02/03/04/05/07 salta directo a 08, igual
 * que el flujo de referencia (OnboardingFlow.jsx: onSkip -> índice de Apple).
 */
export function OnboardingStack({ onSelectTwins }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Welcome">
        {({ navigation }) => <WelcomeScreen onNext={() => navigation.navigate('BabyCount')} />}
      </Stack.Screen>
      <Stack.Screen name="BabyCount">
        {({ navigation }) => (
          <BabyCountScreen
            onSelect={onSelectTwins}
            onNext={() => navigation.navigate('Logging')}
            onSkip={() => navigation.navigate('AppleAuth')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Logging">
        {({ navigation }) => (
          <LoggingScreen onNext={() => navigation.navigate('Feeding')} onSkip={() => navigation.navigate('AppleAuth')} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Feeding">
        {({ navigation }) => (
          <FeedingScreen onNext={() => navigation.navigate('NextWindowPromise')} onSkip={() => navigation.navigate('AppleAuth')} />
        )}
      </Stack.Screen>
      <Stack.Screen name="NextWindowPromise">
        {({ navigation }) => (
          <NextWindowPromiseScreen onNext={() => navigation.navigate('NotificationsPermission')} onSkip={() => navigation.navigate('AppleAuth')} />
        )}
      </Stack.Screen>
      <Stack.Screen name="NotificationsPermission">
        {({ navigation }) => (
          <NotificationsPermissionScreen
            onAllow={() => navigation.navigate('Patterns')}
            onDecline={() => navigation.navigate('Patterns')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Patterns">
        {({ navigation }) => (
          <PatternsScreen onNext={() => navigation.navigate('AppleAuth')} onSkip={() => navigation.navigate('AppleAuth')} />
        )}
      </Stack.Screen>
      <Stack.Screen name="AppleAuth" component={AppleAuthScreen} />
    </Stack.Navigator>
  );
}
export default OnboardingStack;
