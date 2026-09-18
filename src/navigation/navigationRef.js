import { createNavigationContainerRef } from '@react-navigation/native';

/**
 * Ref imperativo del NavigationContainer — para navegar desde fuera de un
 * componente de pantalla (FamilyShell renderiza el Tab.Navigator de
 * MainTabs por dentro, así que no tiene su propio `navigation` de React
 * Navigation; esto le da un `.navigate()` sin depender de esa jerarquía).
 */
export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) navigationRef.navigate(name, params);
}
