/**
 * Datos de la semana de ejemplo (22–28 jul). Es el contrato de datos que
 * esperan las pantallas: al conectar la API real, mantené estas formas.
 *
 * b: 0 = Mía · 1 = Lía
 * feeds: tomas totales del día · nf: tomas nocturnas · nfDue: cuántas «le tocaban»
 */
export const REC = [
  { d: '22 jul', b: 0, wake: '6:25', start: '12:20', asleep: '12:38', end: '14:05', night: '19:30', nightMin: 640, wakes: 5, place: 'Su cuna', contact: 'Palmaditas', mood: 'Mal humor', feedType: 'Ambos pechos', feeds: 4, nf: 2, nfDue: 0, factors: ['Teething'] },
  { d: '22 jul', b: 1, wake: '6:20', start: '12:25', asleep: '12:50', end: '13:55', night: '19:40', nightMin: 625, wakes: 5, place: 'En brazos', contact: 'Cargada', mood: 'Mal humor', feedType: 'Ambos pechos', feeds: 5, nf: 3, nfDue: 0, factors: ['Cena escasa'] },
  { d: '23 jul', b: 0, wake: '6:15', start: '12:30', asleep: '12:52', end: '13:55', night: '19:45', nightMin: 630, wakes: 5, place: 'En brazos', contact: 'Cargada', mood: 'Llorando', feedType: 'Ambos pechos', feeds: 5, nf: 3, nfDue: 0, factors: ['Teething', 'Cena escasa'] },
  { d: '23 jul', b: 1, wake: '6:10', start: '12:35', asleep: '12:58', end: '14:00', night: '19:50', nightMin: 615, wakes: 6, place: 'Cama de los papás', contact: 'Cargada', mood: 'Llorando', feedType: 'Ambos pechos', feeds: 5, nf: 3, nfDue: 0, factors: ['Cena escasa'] },
  { d: '24 jul', b: 0, wake: '6:20', start: '12:15', asleep: '12:30', end: '14:10', night: '19:15', nightMin: 655, wakes: 4, place: 'Su cuna', contact: 'Palmaditas', mood: 'Buen humor', feedType: 'Pecho der.', feeds: 3, nf: 1, nfDue: 0, factors: [] },
  { d: '24 jul', b: 1, wake: '6:15', start: '12:20', asleep: '12:40', end: '14:00', night: '19:20', nightMin: 645, wakes: 4, place: 'Cama Montessori', contact: 'Mano encima', mood: 'Tranquila', feedType: 'Sin toma', feeds: 3, nf: 1, nfDue: 0, factors: [] },
  { d: '25 jul', b: 0, wake: '6:10', start: '11:50', asleep: '12:05', end: '13:50', night: '19:10', nightMin: 660, wakes: 3, place: 'Cama Montessori', contact: 'Mano encima', mood: 'Tranquila', feedType: 'Sin toma', feeds: 2, nf: 0, nfDue: 0, factors: [] },
  { d: '25 jul', b: 1, wake: '6:05', start: '11:55', asleep: '12:15', end: '13:45', night: '19:15', nightMin: 650, wakes: 3, place: 'Cama Montessori', contact: 'Palmaditas', mood: 'Buen humor', feedType: 'Sin toma', feeds: 2, nf: 1, nfDue: 0, factors: [] },
  { d: '26 jul', b: 0, wake: '6:30', start: '12:40', asleep: '13:05', end: '14:15', night: '20:15', nightMin: 615, wakes: 6, place: 'En brazos', contact: 'Cargada', mood: 'Mal humor', feedType: 'Ambos pechos', feeds: 5, nf: 3, nfDue: 0, factors: ['Teething', 'Cambio de rutina'] },
  { d: '26 jul', b: 1, wake: '6:25', start: '12:45', asleep: '13:10', end: '14:05', night: '20:20', nightMin: 605, wakes: 5, place: 'Carro', contact: 'Con la toma', mood: 'Mal humor', feedType: 'Biberón', feeds: 5, nf: 3, nfDue: 0, factors: ['Cambio de rutina'] },
  { d: '27 jul', b: 0, wake: '6:10', start: '11:20', asleep: '11:35', end: '13:25', night: '19:20', nightMin: 650, wakes: 2, place: 'Su cuna', contact: 'Palmaditas', mood: 'Buen humor', feedType: 'Sin toma', feeds: 2, nf: 0, nfDue: 0, factors: [] },
  { d: '27 jul', b: 1, wake: '6:05', start: '11:25', asleep: '11:45', end: '13:20', night: '19:25', nightMin: 640, wakes: 3, place: 'Cama Montessori', contact: 'Palmaditas', mood: 'Tranquila', feedType: 'Pecho izq.', feeds: 3, nf: 1, nfDue: 0, factors: [] },
  { d: '28 jul', b: 0, wake: '6:20', start: '12:30', asleep: '12:47', end: '14:20', night: '19:35', nightMin: 635, wakes: 4, place: 'Su cuna', contact: 'Palmaditas', mood: 'Tranquila', feedType: 'Pecho der.', feeds: 3, nf: 2, nfDue: 0, factors: ['Teething'] },
  { d: '28 jul', b: 1, wake: '6:15', start: '12:35', asleep: '12:52', end: '14:05', night: '19:50', nightMin: 610, wakes: 5, place: 'En brazos', contact: 'Cargada', mood: 'Mal humor', feedType: 'Ambos pechos', feeds: 4, nf: 3, nfDue: 0, factors: ['Cena escasa'] },
];

/** Registro de alimentación de hoy. b: 0=Mía 1=Lía · null = extracción (mamá) */
export const FEED_EVENTS = [
  { t: '6:35', b: 0, kind: 'pecho', src: 'Ambos pechos', qty: 14, ctx: 'Al despertar', night: false, who: 'Mamá' },
  { t: '6:30', b: 1, kind: 'pecho', src: 'Pecho der.', qty: 11, ctx: 'Al despertar', night: false, who: 'Mamá' },
  { t: '8:15', b: null, kind: 'pump', side: 'Ambos', ml: 140, min: 18, dest: 'Al banco', who: 'Mamá' },
  { t: '9:50', b: 1, kind: 'pecho', src: 'Ambos pechos', qty: 16, ctx: 'Despierta', night: false, who: 'Mamá' },
  { t: '10:10', b: 0, kind: 'pecho', src: 'Pecho izq.', qty: 9, ctx: 'Despierta', night: false, who: 'Mamá' },
  { t: '12:20', b: null, kind: 'pump', side: 'Izquierdo', ml: 75, min: 12, dest: 'Al banco', who: 'Mamá' },
  { t: '15:35', b: 1, kind: 'biberon', src: 'Biberón', qty: 120, ctx: 'Despierta', night: false, who: 'Niñera' },
  { t: '15:40', b: 0, kind: 'biberon', src: 'Biberón', qty: 150, ctx: 'Despierta', night: false, who: 'Niñera' },
  { t: '18:40', b: 1, kind: 'pecho', src: 'Ambos pechos', qty: 12, ctx: 'Antes de dormir', night: false, who: 'Mamá' },
  { t: '21:10', b: 0, kind: 'pecho', src: 'Pecho der.', qty: 7, ctx: 'Despertar nocturno', night: true, who: 'Papá' },
  { t: '2:40', b: 1, kind: 'biberon', src: 'Biberón', qty: 60, ctx: 'Despertar nocturno', night: true, who: 'Papá' },
];

/** Extracción vs. consumo del banco, por día de la semana. */
export const PUMP_WEEK = [
  { day: '22', out: 180, used: 120 }, { day: '23', out: 150, used: 160 }, { day: '24', out: 220, used: 120 },
  { day: '25', out: 240, used: 90 }, { day: '26', out: 130, used: 180 }, { day: '27', out: 210, used: 60 },
  { day: '28', out: 215, used: 180 },
];
/** Banco congelado antes de esta semana, en ml. */
export const PUMP_BASE_STOCK = 620;

/** Tomas de hoy por bebé, tal como se dibujan en el timeline de escritorio. */
export const TODAY_FEEDS = [
  [{ t: '6:35', k: 'Pecho amb.', m: '14 min' }, { t: '10:10', k: 'Pecho izq.', m: '9 min' }, { t: '15:40', k: 'Biberón', m: '150 ml' }],
  [{ t: '6:30', k: 'Pecho der.', m: '11 min' }, { t: '9:50', k: 'Pecho amb.', m: '16 min' }, { t: '15:35', k: 'Biberón', m: '120 ml' }, { t: '18:40', k: 'Pecho amb.', m: '12 min' }],
];

export const DAYS = ['22 jul', '23 jul', '24 jul', '25 jul', '26 jul', '27 jul', '28 jul'];
export const WEEKDAYS = ['Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo', 'Lunes', 'Martes'];

/** Escalera de acompañamiento. currentStep = 1 → van por noches 4–6. */
export const LADDER = [
  { nights: 'Noches 1–3', text: 'Silla junto a la cuna. Se puede usar voz, contacto y cargarla 1–2 min sin que se duerma en brazos.' },
  { nights: 'Noches 4–6', text: 'Silla a mitad del cuarto. El contacto físico pasa a ser intermitente; la voz sigue disponible.' },
  { nights: 'Noches 7–9', text: 'Silla junto a la puerta, dentro del cuarto. Ya no se la toca; solo voz si la necesita.' },
  { nights: 'Noches 10–12', text: 'Silla fuera del cuarto, a la vista. La voz basta para que sepa que estás ahí.' },
  { nights: 'Noche 13+', text: 'Si aún hace falta, esperar 3–5 min de llanto continuo antes de ir a sentarse.' },
];
export const LADDER_CURRENT_STEP = 1;
export const LADDER_TOTAL_NIGHTS = 12;
export const LADDER_NIGHTS_DONE = 5;

export const TEAM = [
  { name: 'Mamá', role: 'Registra · edita el plan', perm: 'Admin', initial: 'M', bg: '#E8DFF6', fg: '#6B5DD3' },
  { name: 'Papá', role: 'Registra · turnos de noche', perm: 'Admin', initial: 'P', bg: '#E8DFF6', fg: '#6B5DD3' },
  { name: 'Niñera', role: 'Registra día · ve el plan', perm: 'Cuidadora', initial: 'N', bg: '#FDE8D7', fg: '#C2703F' },
  { name: 'Carolina', role: 'Asesora · comenta y ajusta el plan', perm: 'Asesora', initial: 'C', bg: '#DCEDE4', fg: '#3F7A62' },
];

export const RELEVO_NOTES = [
  { who: 'Niñera · 8:05', text: 'Lía dejó la mitad del biberón de la mañana.' },
  { who: 'Papá · 7:20', text: 'Mía con la encía de arriba inflamada, marqué teething.' },
];

export const THREAD = [
  { who: 'Carolina', when: 'ayer', initial: 'C', mine: false, text: 'El 27 con ventana de 5 h 25 dio 2 y 3 despertares. Confirma la hipótesis: sostengamos el inicio de siesta 7 días antes de tocar la noche.' },
  { who: 'Papá', when: 'hoy 7:40', initial: 'P', mine: true, text: 'Difícil con la niñera: a esa hora vamos volviendo del parque. ¿Movemos el paseo antes?' },
  { who: 'Carolina', when: 'hoy 8:05', initial: 'C', mine: false, text: 'Sí: parque 8:45–10:45. Y de las tomas nocturnas, ninguna le tocaba: acompañamos desde la silla en vez de ofrecer pecho.' },
];

export const FAMILIES = [
  { name: 'Mía & Lía', parents: 'Ana y Diego · mellizas', age: '21 m', week: 2, wakes: 4.0, state: 'En plan', flag: true },
  { name: 'Familia Uribe', parents: 'Laura y Tomás', age: '7 m', week: 6, wakes: 1.1, state: 'En plan', flag: false },
  { name: 'Familia Bernal', parents: 'Carolina S.', age: '4 m', week: 1, wakes: 3.4, state: 'Arrancando', flag: false },
  { name: 'Familia Ocampo', parents: 'Juliana y Pablo', age: '15 m', week: 4, wakes: 2.6, state: 'En plan', flag: true },
  { name: 'Familia Duque', parents: 'Sara M.', age: '2 a', week: 8, wakes: 0.4, state: 'Cerrado', flag: false },
  { name: 'Familia Mejía', parents: 'Andrés y Nina', age: '9 m', week: 3, wakes: 2.2, state: 'En plan', flag: false },
  { name: 'Familia Salazar', parents: 'Valeria R.', age: '3 a', week: 5, wakes: 1.8, state: 'En plan', flag: true },
];

export const ADVISOR = { name: 'Carolina Restrepo', role: 'Asesora de sueño certificada · Medellín', code: 'CRS482' };

export const PLANS = [
  { id: 'mensual', name: 'Mensual', detail: 'Cancelá cuando quieras', price: '$7,99', badge: '' },
  { id: 'anual', name: 'Anual', detail: '$59,88 al año · 2 meses gratis', price: '$4,99', badge: 'Ahorrás 37%' },
];

export const BILLING = {
  planPrice: '$49', planName: 'Plan Consultorio', seats: '12 de 15', seatPct: 80,
  seatNote: 'Te quedan 3 cupos. El plan Sin límite son $99 al mes.',
  cta: 'Cambiar a Sin límite', nextCharge: '12 ago 2026', method: '•••• 4429',
  kpis: [
    { value: '12', label: 'casos activos' },
    { value: '3', label: 'necesitan revisión' },
    { value: '41', label: 'familias históricas' },
    { value: '$588', label: 'facturado 2026' },
  ],
};
