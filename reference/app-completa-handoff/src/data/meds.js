/**
 * Medicinas indicadas por el doctor — "fuera del sueño".
 *
 * Noctua NO calcula dosis. Guarda la indicación tal como la dio el médico,
 * con su nombre y la fecha, para que a las 3am nadie tenga que buscar el
 * chat con el pediatra. Cualquier cálculo por peso queda FUERA de producto.
 *
 * ml: [dosis bebé A, dosis bebé B] — cada niña tiene su propia dosis.
 * everyH: intervalo mínimo indicado. maxDay: máximo de dosis en 24 h.
 */
export const MEDS = [
  {
    id: 'para',
    name: 'Paracetamol',
    conc: 'Gotas 100 mg/ml',
    ml: [1.2, 1.1],
    everyH: 6,
    maxDay: 4,
    doctor: 'Dra. Pérez (pediatra)',
    when: '12 ago',
    note: 'Solo si pasa de 38,5 °C. No más de 4 dosis en 24 h.',
  },
  {
    id: 'ibu',
    name: 'Ibuprofeno',
    conc: 'Suspensión 100 mg/5 ml',
    ml: [3.5, 3.2],
    everyH: 8,
    maxDay: 3,
    doctor: 'Dr. Ramírez (guardia)',
    when: '16 ago',
    note: 'Con algo de comida. Alternar con paracetamol si la fiebre no baja.',
    altNote: 'Indicación: dar con algo de comida y alternar con paracetamol si la fiebre no baja.',
  },
];

export const getMed = id => MEDS.find(m => m.id === id);

/** Dosis del día, en minutos desde medianoche. `by` = quién la dio (aparece en la UI). */
export const SEED_DOSES = [
  { med: 'para', b: 0, t: 300, by: 'Papá' },
  { med: 'para', b: 1, t: 305, by: 'Papá' },
  { med: 'ibu', b: 0, t: 630, by: 'Niñera' },
  { med: 'ibu', b: 1, t: 635, by: 'Niñera' },
];

/** Episodio de enfermedad activo. Mientras exista, los días quedan marcados como atípicos. */
export const SEED_EPISODE = { active: true, day: 2, since: '17 ago', label: 'Fiebre / resfriado' };

/** Decimales en español: 1.2 -> "1,2 ml". Toda dosis se imprime con esto. */
export const ML = v => String(v).replace('.', ',') + ' ml';
