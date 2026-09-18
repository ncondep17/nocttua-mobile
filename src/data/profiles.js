/**
 * Las 7 franjas de edad. Tabla de referencia: cambiar de perfil recalcula el
 * plan del día, las tomas esperadas, los tips y los rangos de las gráficas.
 * Portado 1:1 del paquete de diseño aprobado.
 *
 * windowMin  = ventana de vigilia en minutos (el número con el que se calcula)
 * napMin     = duración de siesta usada en el cálculo del plan
 * totalLow/High = rango esperado de sueño en 24 h, en horas
 * winLow/winHigh = el rango de `window` en minutos. Tiene que decir LO MISMO que
 *   el string `window`: es la cota dura del día de ejemplo (lib/sampleDay.js),
 *   que nunca puede imprimir una ventana fuera de este rango.
 * napLow/napHigh = el rango de `napLen` en minutos, misma regla que winLow/winHigh:
 *   el día de ejemplo no puede imprimir una siesta fuera de este rango.
 * bed = hora de acostarse de referencia para esa edad (19:00–20:30, ±30 min al resolver).
 * nightLow/nightHigh = rango esperado de sueño NOCTURNO (sin siestas), en horas — para el
 *   componente de mayor peso del puntaje de la noche (06_MorningScreen.jsx). El README del
 *   handoff pide compararse contra "el rango esperado por edad" pero no trae la tabla de
 *   números; estos son una referencia pediátrica estándar razonable, no algo verificado
 *   contra una fuente específica del handoff — está para que se pueda ajustar a ojo.
 */
export const PROFILES = [
  { id: 'nb', napLow: 40, napHigh: 90, winLow: 45, winHigh: 60, bed: '20:00', short: '0–3 m', label: 'Recién nacida · 0–3 meses', window: '45–60 min', windowMin: 55, windowTarget: '55 min',
    naps: 5, napsLabel: '4–6', napLen: '40–90 min', napMin: 65, total: '14–17 h', totalLow: 14, totalHigh: 17, nightLow: 8, nightHigh: 9,
    feeds: 9, feedsLabel: '8–12', nightFeeds: '3–4', regression: 'Regresión de las 6 semanas posible',
    watch: 'A esta edad el sueño es irregular por definición: mira la suma de 24 h, no cada siesta.',
    note: 'Ventanas muy cortas y siestas irregulares. Aquí lo que importa es el total de horas y que ninguna ventana se pase de 60 min.', minMonths: 0, maxMonths: 3 },
  { id: '3-6', napLow: 45, napHigh: 120, winLow: 90, winHigh: 120, bed: '19:30', short: '3–6 m', label: '3–6 meses', window: '1 h 30 – 2 h', windowMin: 105, windowTarget: '1h45',
    naps: 4, napsLabel: '3–4', napLen: '45 min – 2 h', napMin: 75, total: '13–15 h', totalLow: 13, totalHigh: 15, nightLow: 9, nightHigh: 10,
    feeds: 6, feedsLabel: '6–8', nightFeeds: '2–3', regression: 'Regresión de los 4 meses posible',
    watch: 'La regresión de los 4 meses cambia el sueño de forma permanente: no la trates como una mala semana.',
    note: 'Las siestas empiezan a agruparse. Momento de revisar ambiente, horarios y rutina antes de tocar nada más.', minMonths: 3, maxMonths: 6 },
  { id: '6-9', napLow: 60, napHigh: 90, winLow: 150, winHigh: 180, bed: '19:30', short: '6–9 m', label: '6–9 meses', window: '2 h 30 – 3 h', windowMin: 165, windowTarget: '2h45',
    naps: 3, napsLabel: '3', napLen: '1 – 1 h 30', napMin: 80, total: '12–15 h', totalLow: 12, totalHigh: 15, nightLow: 10, nightHigh: 11,
    feeds: 5, feedsLabel: '4–6', nightFeeds: '1–2', regression: 'Regresión de los 6 meses posible',
    watch: 'Empieza a importar la superficie: cuna o cama Montessori, sin brazos.',
    note: 'Tres siestas estables y sólidos en marcha. Buen momento para separar «se durmió sola» de «necesitó contacto».', minMonths: 6, maxMonths: 9 },
  { id: '9-12', napLow: 60, napHigh: 90, winLow: 180, winHigh: 210, bed: '19:45', short: '9–12 m', label: '9–12 meses', window: '3 h – 3 h 30', windowMin: 195, windowTarget: '3h15',
    naps: 2, napsLabel: '2', napLen: '1 – 1 h 30', napMin: 80, total: '12–15 h', totalLow: 12, totalHigh: 15, nightLow: 10, nightHigh: 11.5,
    feeds: 4, feedsLabel: '3–5', nightFeeds: '0–1', regression: 'Regresión 8–10 m posible',
    watch: 'Vigila la tercera siesta en el carro: retrasa el inicio de la noche.',
    note: 'Transición a dos siestas. Con el pediatra se define cuántas tomas nocturnas se mantienen.', minMonths: 9, maxMonths: 12 },
  { id: '12-18', napLow: 60, napHigh: 120, winLow: 210, winHigh: 270, bed: '20:00', short: '12–18 m', label: '12–18 meses', window: '3 h 30 – 4 h 30', windowMin: 240, windowTarget: '4h',
    naps: 2, napsLabel: '1–2', napLen: '1 – 2 h', napMin: 90, total: '11–14 h', totalLow: 11, totalHigh: 14, nightLow: 11, nightHigh: 12,
    feeds: 3, feedsLabel: '2–4', nightFeeds: '0', regression: 'Regresión de los 12 meses posible',
    watch: 'Semanas mixtas de 1 y 2 siestas: no fuerces la transición, míralas en siestas/día.',
    note: 'Unos días 2 siestas, otros 1. Las tomas ya acompañan comidas, no el dormir.', minMonths: 12, maxMonths: 18 },
  { id: '18-36', napLow: 90, napHigh: 120, winLow: 300, winHigh: 330, bed: '20:00', short: '18–36 m', label: '18–36 meses', window: '5 h – 5 h 30', windowMin: 320, windowTarget: '5h00',
    naps: 1, napsLabel: '1', napLen: '1 h 30 – 2 h', napMin: 105, total: '11–14 h', totalLow: 11, totalHigh: 14, nightLow: 10.5, nightHigh: 12,
    feeds: 2, feedsLabel: '1–3', nightFeeds: '0', regression: 'Regresión 18–24 m posible',
    watch: 'Ventana de regresión 18–24 meses abierta: no cambies dos cosas a la vez.',
    note: 'Una sola siesta. La ventana de la mañana es la palanca principal: si se estira, la noche se fragmenta.', minMonths: 18, maxMonths: 36 },
  { id: '36+', napLow: 60, napHigh: 120, winLow: 330, winHigh: 360, bed: '20:15', short: '3–5 a', label: '3–5 años', window: '5 h 30 – 6 h', windowMin: 350, windowTarget: '5h30',
    naps: 1, napsLabel: '0–1', napLen: '1 – 2 h', napMin: 90, total: '10–12 h', totalLow: 10, totalHigh: 12, nightLow: 10, nightHigh: 11,
    feeds: 1, feedsLabel: '0–2', nightFeeds: '0', regression: 'Pesadillas y terrores nocturnos frecuentes',
    watch: 'Si hace siesta y se duerme pasadas las 8pm por falta de sueño, puede estar lista para dejarla.',
    note: 'Con o sin siesta. Sin siesta hay que adelantar la noche mucho: 17:30–18:00 mientras se acostumbra.', minMonths: 36, maxMonths: 999 },
];

export const DEFAULT_PROFILE_ID = '18-36';

export function getProfile(id) {
  return PROFILES.find((p) => p.id === id) || PROFILES[5];
}

/** Perfil real según fecha de nacimiento — reemplaza el selector manual del prototipo. */
export function profileForBirthDate(birthDate) {
  if (!birthDate) return getProfile(DEFAULT_PROFILE_ID);
  const months = (Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  return PROFILES.find((p) => months >= p.minMonths && months < p.maxMonths) || PROFILES[PROFILES.length - 1];
}

/** Vocabulario de los formularios de registro. El orden es el que se ve en pantalla. */
export const PLACES = ['Su cuna', 'Cama Montessori', 'Cama de los papás', 'En brazos', 'Carro', 'Coche'];
export const CONTACTS = ['No necesitó contacto', 'Palmaditas', 'Mano encima', 'Cargada', 'Con la toma'];
/** Clave estable por etiqueta de CONTACTS — se guarda esto, nunca la etiqueta traducida (cambiar de bebé o de idioma no debe borrar la respuesta). */
export const CONTACT_KEYS = {
  'No necesitó contacto': 'alone',
  Palmaditas: 'patted',
  'Mano encima': 'touched',
  Cargada: 'held',
  'Con la toma': 'fed',
};
export const FEED_TYPES = ['Sin toma', 'Pecho izq.', 'Pecho der.', 'Ambos pechos', 'Biberón de leche materna', 'Biberón de fórmula', 'Biberón de leche de vaca'];
// icon: nombre de Ionicons (@expo/vector-icons), no un glifo de texto — los
// caracteres geométricos sueltos (◇▽◔) se veían cortados/mal renderizados en
// dispositivos reales según la fuente del sistema.
export const MOODS = [
  { label: 'Buen humor', icon: 'happy-outline' },
  { label: 'Tranquila', icon: 'ellipse-outline' },
  { label: 'Mal humor', icon: 'sad-outline' },
  { label: 'Llorando', icon: 'close-circle-outline' },
];
/** Cómo fue el proceso de dormirse — distinto de MOODS (cómo despertó). Ayuda a distinguir sobrecansancio (berrinche/costó mucho) de una ventana que todavía no le tocaba. */
export const FALL_ASLEEP_MOODS = [
  { label: 'Tranquila', icon: 'ellipse-outline' },
  { label: 'Con berrinche', icon: 'warning-outline' },
  { label: 'Costó mucho', icon: 'hourglass-outline' },
];
export const FACTORS = ['Teething', 'Comió poco', 'Cena escasa', 'Enferma', 'Cambio de rutina', 'Modo viaje', 'Posible regresión', 'No hubo nada diferente', 'No estoy segura'];

export const FEED_SOURCES = ['Pecho izq.', 'Pecho der.', 'Ambos pechos', 'Biberón de leche materna', 'Biberón de fórmula', 'Biberón de leche de vaca'];
export const FEED_CONTEXTS = ['Al despertar', 'Despierta', 'Antes de dormir', 'Despertar nocturno'];
export const PUMP_SIDES = ['Izquierdo', 'Derecho', 'Ambos'];
export const PUMP_DESTS = ['Al banco', 'A la nevera', 'Uso inmediato'];

/** Bebé A violeta, bebé B terracota — nunca al revés. tone 'a' = índice 0. */
export const ACCENT = { a: '#6B5DD3', b: '#C2703F' };
export const SOFT = { a: '#F6F1FB', b: '#FDF3EA' };
