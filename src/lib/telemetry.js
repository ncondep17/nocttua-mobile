import { supabase } from './supabase';

/**
 * CONTRATO-AVISO-VENTANA.md §5: "se mide o no existe". No lanza si falla
 * (la telemetría nunca debe romper el flujo que está midiendo) — solo avisa
 * por consola en desarrollo.
 */
export async function logTelemetry(event, payload = {}) {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    if (!userId) return;
    const { error } = await supabase.from('telemetry_events').insert({ user_id: userId, event, payload });
    if (error) throw error;
  } catch (err) {
    if (__DEV__) console.warn('[telemetry]', event, err);
  }
}
