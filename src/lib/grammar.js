/**
 * Ningún bebé tenía dato de género hasta la columna `gender` de esta sesión
 * — hasta que la usuaria lo completa en Ajustes, se sigue leyendo como
 * femenino, que es el comportamiento que ya tenía la app antes de existir
 * esta columna (no queremos que agregar el dato cambie de golpe el texto de
 * alguien que todavía no lo cargó).
 */
const DEFAULT_GENDER = 'niña';

export function genderOf(baby) {
  return baby?.gender === 'niño' ? 'niño' : DEFAULT_GENDER;
}

/**
 * Concuerda un adjetivo/participio (dormido/dormida, tranquilo/tranquila...)
 * con el género y número de uno o varios bebés. Acepta un bebé solo o un
 * arreglo. Con géneros mixtos usa masculino plural — regla general del
 * español para grupos mixtos.
 */
export function agree(babies, masc, fem) {
  const list = Array.isArray(babies) ? babies : [babies];
  const isMasc = list.some((b) => genderOf(b) === 'niño');
  const base = isMasc ? masc : fem;
  if (list.length <= 1) return base;
  return /[oa]$/.test(base) ? base + 's' : base + 'es';
}

/**
 * Algunas etiquetas ya se guardan tal cual en `events` (wake_mood,
 * fall_asleep_mood, feed_context) y sirven de valor Y de texto a la vez —
 * cambiar el string guardado rompería comparaciones con datos viejos y
 * analíticas que agrupan por ese texto exacto. Esta función solo cambia lo
 * que se MUESTRA en el chip/picker; lo que se guarda sigue siendo la
 * etiqueta canónica (femenina) de siempre.
 */
const GENDERED_LABEL = {
  Tranquila: { niño: 'Tranquilo', niña: 'Tranquila' },
  Despierta: { niño: 'Despierto', niña: 'Despierta' },
  Cargada: { niño: 'Cargado', niña: 'Cargada' },
};

/**
 * Acepta un bebé solo o una lista (p. ej. "Las dos" en el selector de una
 * hoja) — mismo criterio que `agree`: géneros mixtos usa masculino. Antes
 * solo tomaba un bebé; con "Las dos" seleccionado, `baby` llegaba
 * `undefined`/`null` y esto caía siempre al default femenino, aunque
 * alguno de los dos fuera niño.
 */
export function genderLabel(label, babyOrBabies) {
  const list = Array.isArray(babyOrBabies) ? babyOrBabies : [babyOrBabies];
  const isMasc = list.some((b) => genderOf(b) === 'niño');
  return GENDERED_LABEL[label]?.[isMasc ? 'niño' : 'niña'] ?? label;
}

/**
 * Concuerda un verbo solo en número (durmió/durmieron, tardó/tardaron) —
 * el español no conjuga verbos por género, así que a diferencia de `agree`
 * esto no necesita saber género, solo si es uno o varios bebés.
 */
export function plural(babies, singular, pluralForm) {
  const list = Array.isArray(babies) ? babies : [babies];
  return list.length > 1 ? pluralForm : singular;
}
