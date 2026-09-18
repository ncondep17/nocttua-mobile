import { insertEvent, hasOpenNight } from '../data/family';

/**
 * Guarda una sesión de pecho ya parada (useFeedSession().stop()) — un
 * evento por tramo, para que un cambio de lado a mitad de toma quede como
 * dos registros con su propia duración real en vez de mezclarse en un solo
 * número. Compartido entre Leche (02_MilkScreen.jsx) y la franja de "toma
 * en curso" de Hoy (01_TodayScreen.jsx) para no mantener la misma lógica
 * de guardado en dos lugares.
 */
export async function savePechoSession(familyId, result) {
  if (!result || result.segments.length === 0) {
    return { ok: false, tooShort: true };
  }
  // Antes esto quedaba fijo en 'Despierta' sin importar la hora — ninguna
  // toma cargada con el cronómetro (la forma más natural de registrar una a
  // las 3am) entraba nunca en "Tomas nocturnas"/"Leche de madrugada" de
  // Analíticas ni en el aviso de Leche, porque ambos filtran exactamente por
  // este campo. Si la noche del bebé sigue abierta, la toma es nocturna por
  // definición — no hace falta preguntarlo y perder la fricción cero del
  // cronómetro.
  let feedContext = 'Despierta';
  try {
    if (result.babyId && await hasOpenNight(familyId, result.babyId)) feedContext = 'Despertar nocturno';
  } catch {
    // Si la consulta falla, se guarda igual como toma de día — no bloquea el registro por esto.
  }
  const results = await Promise.allSettled(result.segments.map((seg) => {
    const minutes = Math.max(1, Math.round(seg.ms / 60000));
    const kind = seg.side === 'Izquierdo' ? 'Pecho izq.' : seg.side === 'Derecho' ? 'Pecho der.' : 'Ambos pechos';
    return insertEvent(familyId, {
      babyId: result.babyId, type: 'feed', startedAt: new Date(seg.startedAt).toISOString(),
      kind, feedMinutes: minutes, feedContext,
    });
  }));
  const failed = results.filter((r) => r.status === 'rejected');
  const totalMin = Math.max(1, Math.round(result.totalMs / 60000));
  return {
    ok: failed.length < results.length,
    tooShort: false,
    partial: failed.length > 0 && failed.length < results.length,
    allFailed: failed.length > 0 && failed.length === results.length,
    failReason: failed[0]?.reason,
    totalSegments: results.length,
    failedCount: failed.length,
    totalMin,
    sideLabel: result.segments.length > 1 ? result.segments.length + ' tramos' : (result.segments[0]?.side ?? 'Toma'),
  };
}
