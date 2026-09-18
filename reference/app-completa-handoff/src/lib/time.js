/**
 * Utilidades de tiempo. Copiadas 1:1 del prototipo — NO cambiar el formato:
 * la app entera muestra horas como "6:20" y duraciones como "1h45" / "45 min".
 */

/** "6:20" → 380 */
export function toMin(s) {
  const p = String(s).split(':');
  return (+p[0]) * 60 + (+p[1]);
}

/** 380 → "6:20". Envuelve en 24 h, así que 1500 → "1:00". */
export function fmt(m) {
  m = ((m % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return h + ':' + (mm < 10 ? '0' + mm : mm);
}

/** 105 → "1h45" · 45 → "45 min" */
export function dur(m) {
  const h = Math.floor(m / 60);
  const mm = Math.round(m % 60);
  return h > 0 ? h + 'h' + (mm < 10 ? '0' + mm : mm) : mm + ' min';
}

export function avg(a) {
  return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
}

/** Un decimal con coma, como se escribe en español: 4.0 → "4,0" */
export function one(n) {
  return n.toFixed(1).replace('.', ',');
}
