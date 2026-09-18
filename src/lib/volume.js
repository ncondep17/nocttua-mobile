/**
 * Conversión ml/oz para los campos de cantidad (biberón, extracción). El
 * dato siempre se guarda en ml (columna `volume_ml`) — la unidad es solo
 * de entrada/visualización, elegida en el momento porque la mayoría mide
 * en onzas, no en ml.
 */
export const ML_PER_OZ = 29.5735;

export const mlToOz = (ml) => ml / ML_PER_OZ;
export const ozToMl = (oz) => oz * ML_PER_OZ;

/** Paso de stepper: 10 ml o media onza, redondeado al ml. Ver `stepVolume` — este valor ya no se usa para sumar directo en onzas. */
export const stepFor = (unit) => (unit === 'oz' ? Math.round(ML_PER_OZ / 2) : 10);

/** "180 ml" o "6,1 oz", según la unidad activa. */
export function fmtVolume(ml, unit) {
  return unit === 'oz' ? mlToOz(ml).toFixed(1).replace('.', ',') + ' oz' : ml + ' ml';
}

/**
 * Sube/baja el volumen un paso, en la unidad que se está mirando. En oz no
 * alcanza con sumar `stepFor('oz')` (≈15 ml) al valor en ml: 15 ml no es
 * exactamente media onza (14,7867 ml), así que tras varios toques el
 * redondeo a 1 decimal saltaba a números como 4,1 / 4,6 / 5,2 en vez de
 * 4 / 4,5 / 5 — "los brincos" que no dejaban elegir 1, 2, 2,5, 3 oz limpio.
 * Acá se redondea primero a la media onza más cercana y recién ahí se suma
 * el paso, así el resultado siempre cae en un múltiplo de 0,5 oz exacto.
 */
export function stepVolume(ml, unit, direction) {
  if (unit === 'oz') {
    const currentOz = Math.round(mlToOz(ml) * 2) / 2;
    const nextOz = Math.max(0.5, currentOz + direction * 0.5);
    return Math.round(ozToMl(nextOz));
  }
  return Math.max(10, ml + direction * 10);
}
