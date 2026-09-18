/** Aritmética de días para poder registrar el sueño/tomas de un día anterior sin perder el seguimiento. */
export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, delta) {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}

/** Días entre dos fechas (a - b), ignorando la hora. */
export function daysBetween(a, b) {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000);
}

/**
 * Reubica `time` (del que solo importa la hora: TimeField nunca cambia el
 * día) en el día de `anchor`, y si con eso queda antes que `anchor`, lo pasa
 * al día siguiente. Así "Se despertó" a las 11pm se queda la misma noche si
 * es después de "Se durmió", y sigue cruzando la medianoche si la hora
 * elegida es lógicamente la de la mañana siguiente — sin que el usuario
 * tenga que tocar la fecha a mano.
 */
export function snapAfter(time, anchor) {
  const t = new Date(time);
  t.setFullYear(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  return t < anchor ? addDays(t, 1) : t;
}
