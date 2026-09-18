import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

// Entitlement único hoy: acceso a analíticas completas. Si en el futuro hay
// más de un nivel, esto pasa a ser un mapa en vez de una constante.
const ENTITLEMENT_ID = 'nocttua_app_pro';

/**
 * Deshabilitado temporalmente (2026-09-03): `Purchases.configure()` dispara
 * un crash NATIVO de Swift (`_assertionFailure` dentro del SDK de
 * RevenueCat, en un hilo en segundo plano — ver reporte de crash real de la
 * build 15/16) que un try/catch de JS no puede atajar, porque pasa en
 * trabajo asíncrono nativo después de que la llamada ya "salió bien" del
 * lado de JavaScript. Hasta identificar la causa real en el SDK nativo
 * (¿key con formato equivocado?, ¿versión del SDK?), todo este módulo queda
 * en no-op para no bloquear el resto de la app — el paywall no dependía de
 * esto para nada más que el botón de compra real. Reactivar cambiando esta
 * constante a `true` una vez resuelto.
 */
const REVENUECAT_ENABLED = false;

/** Corre una sola vez al arrancar la app, antes de cualquier otra llamada de este módulo. */
export function configurePurchases() {
  if (!REVENUECAT_ENABLED) return;
  try {
    // Nocttua mobile todavía no está en Android — evita configurar el SDK con
    // una key de iOS en esa plataforma en vez de fallar en silencio más tarde.
    if (Platform.OS !== 'ios') return;
    const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
    if (!apiKey) {
      console.warn('Falta EXPO_PUBLIC_REVENUECAT_IOS_KEY — ver apps/mobile/.env.example');
      return;
    }
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.WARN : LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey });
  } catch (err) {
    console.warn('No se pudo inicializar RevenueCat', err);
  }
}

/** Une las compras al usuario real (no al id anónimo del dispositivo) — así el acceso persiste entre reinstalos y otros dispositivos con la misma cuenta. */
export async function identifyPurchaser(userId) {
  if (!REVENUECAT_ENABLED || Platform.OS !== 'ios' || !userId) return;
  try {
    await Purchases.logIn(userId);
  } catch (err) {
    console.warn('No se pudo identificar al comprador en RevenueCat', err);
  }
}

/** Al cerrar sesión, para que el próximo usuario del mismo dispositivo no herede el entitlement. */
export async function forgetPurchaser() {
  if (!REVENUECAT_ENABLED || Platform.OS !== 'ios') return;
  try {
    await Purchases.logOut();
  } catch {
    // Puede fallar si ya estaba deslogueado (usuario anónimo) — no es un error real.
  }
}

/** Los dos packages del offering "default" que de verdad usa el Paywall — "lifetime" (si existe) queda afuera a propósito, no es parte del plan de precios. */
export async function getMonthlyAndAnnualPackages() {
  if (!REVENUECAT_ENABLED) return { monthly: null, annual: null };
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  const available = current?.availablePackages ?? [];
  return {
    monthly: available.find((p) => p.packageType === 'MONTHLY') ?? null,
    annual: available.find((p) => p.packageType === 'ANNUAL') ?? null,
  };
}

function isEntitled(customerInfo) {
  return !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
}

/** Devuelve true si la compra terminó en el entitlement activo. Lanza si el usuario canceló o hubo un error real — el caller decide cómo mostrarlo. */
export async function purchase(pkg) {
  if (!REVENUECAT_ENABLED) throw new Error('Las compras todavía no están disponibles — muy pronto.');
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return isEntitled(customerInfo);
}

export async function restorePurchases() {
  if (!REVENUECAT_ENABLED) throw new Error('Las compras todavía no están disponibles — muy pronto.');
  const customerInfo = await Purchases.restorePurchases();
  return isEntitled(customerInfo);
}

export async function hasActiveEntitlement() {
  if (!REVENUECAT_ENABLED || Platform.OS !== 'ios') return false;
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return isEntitled(customerInfo);
  } catch {
    // Sin conexión u otro fallo de red: no bloquear al usuario asumiendo que no pagó.
    return false;
  }
}
