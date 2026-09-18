import { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { useAppFonts } from './src/theme/useAppFonts';
import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { observeDeliveredWindowAlerts } from './src/lib/windowAlerts';
import { registerDoseNotificationCategory, observeDoseNotificationResponses } from './src/lib/doseAlerts';
import { configurePurchases } from './src/lib/purchases';

SplashScreen.preventAutoHideAsync();
// A nivel de módulo a propósito: RootNavigator identifica al comprador
// (identifyPurchaser) apenas hay sesión, y los efectos de un hijo corren
// antes que los del padre — si esto se moviera a un useEffect de App, podría
// dispararse después de que RootNavigator ya intentó identificar al
// comprador. Ahora está protegido con try/catch adentro (ver purchases.js),
// así que un fallo acá nunca vuelve a tumbar la app entera.
configurePurchases();

// El aviso de ventana (CONTRATO-AVISO-VENTANA.md) tiene que verse aunque la
// app esté abierta, no solo cuando está en segundo plano.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
  }),
});

export default function App() {
  const [fontsLoaded, fontError] = useAppFonts();

  const onLayout = useCallback(async () => {
    if (fontsLoaded || fontError) await SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    onLayout();
  }, [onLayout]);

  useEffect(() => {
    const sub = observeDeliveredWindowAlerts();
    return () => sub.remove();
  }, []);

  useEffect(() => {
    registerDoseNotificationCategory().catch(() => {});
    const sub = observeDoseNotificationResponses();
    return () => sub.remove();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1 }} onLayout={onLayout}>
          <NavigationContainer ref={navigationRef}>
            <RootNavigator />
          </NavigationContainer>
          <StatusBar style="auto" />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
