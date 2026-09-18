/** Datos de ejemplo de Nocttua App. Reemplazar por la API real. */

export const babies = [
  { id: 'a', name: 'Emilia', initial: 'E', tone: 'a', ageWeeks: 19 },
  { id: 'b', name: 'Julieta', initial: 'J', tone: 'b', ageWeeks: 19 },
];

export const todayFeed = [
  { id: 1, time: '05:40', title: 'Toma · pecho izquierdo', meta: '18 min · Emilia', baby: 'a' },
  { id: 2, time: '05:55', title: 'Toma · fórmula 90 ml', meta: 'Julieta · se durmió tomando', baby: 'b', chip: 'Se durmió', chipTone: 'accent' },
  { id: 3, time: '07:10', title: 'Despertar', meta: 'Las dos · 6h 20m de noche', baby: 'both' },
  { id: 4, time: '08:35', title: 'Siesta 1', meta: '42 min · cuna', baby: 'a' },
  { id: 5, time: '08:40', title: 'Siesta 1', meta: '55 min · cuna', baby: 'b' },
  { id: 6, time: '10:15', title: 'Extracción', meta: '120 ml · 20 min', baby: 'both', chip: 'Reserva', chipTone: 'success' },
];

export const nextWindow = {
  baby: 'Emilia y Julieta',
  time: '11:20',
  remaining: 'en 38 min',
  note: 'Llevan 1h 45m despiertas. A las 19 semanas la ventana se les cierra cerca de las dos horas.',
};

export const dayStats = [
  { label: 'Sueño nocturno', value: '9h 10m', hint: 'Promedio de las dos' },
  { label: 'Siestas', value: '3 + 3', hint: 'Emilia / Julieta' },
  { label: 'Tomas', value: '11', hint: 'Últimas 24 h' },
  { label: 'Desfase', value: '15 min', hint: 'Entre las dos', tone: 'success' },
];

export const milkLog = [
  { id: 1, time: '06:00', title: 'Extracción doble', meta: '120 ml · 20 min', chip: 'Reserva', chipTone: 'success', baby: 'both' },
  { id: 2, time: '09:30', title: 'Pecho · Emilia', meta: '16 min · derecho', baby: 'a' },
  { id: 3, time: '09:45', title: 'Fórmula · Julieta', meta: '100 ml', baby: 'b' },
  { id: 4, time: '13:00', title: 'Extracción doble', meta: '95 ml · 18 min', baby: 'both' },
];

export const milkStats = [
  { label: 'Extraído hoy', value: '215 ml' },
  { label: 'Reserva', value: '1,4 L', tone: 'success' },
  { label: 'Tomas de pecho', value: '5' },
  { label: 'Fórmula', value: '380 ml' },
];

export const weekNights = [
  { label: 'L', value: 8.2, display: '8,2' },
  { label: 'M', value: 7.4, display: '7,4' },
  { label: 'M', value: 9.1, display: '9,1' },
  { label: 'J', value: 8.8, display: '8,8' },
  { label: 'V', value: 6.9, display: '6,9' },
  { label: 'S', value: 9.4, display: '9,4' },
  { label: 'D', value: 9.1, display: '9,1' },
];

export const patterns = [
  { label: 'Noches con un solo despertar', value: '4 de 7', pct: 57, tone: 'success' },
  { label: 'Siestas en cuna (no en brazos)', value: '68%', pct: 68, tone: 'accent' },
  { label: 'Ventanas respetadas', value: '82%', pct: 82, tone: 'accent' },
  { label: 'Noches con desfase mayor a 30 min', value: '2 de 7', pct: 28, tone: 'warning' },
];

export const guideCategories = [
  { id: 'ventanas', label: 'Ventanas de sueño', count: 6 },
  { id: 'noche', label: 'Noches y despertares', count: 8 },
  { id: 'lactancia', label: 'Lactancia y extracción', count: 7 },
  { id: 'sincronia', label: 'Sincronizar a dos bebés', count: 5 },
  { id: 'equipo', label: 'Repartir turnos', count: 4 },
];

export const guideTips = [
  {
    id: 't1', category: 'ventanas', title: '¿Cuánto puede estar despierta a las 19 semanas?',
    body: 'Entre 1h 45m y 2h 15m. Pasado ese punto cuesta el doble dormirla y la siesta sale más corta.',
    how: ['Anotá la hora del despertar en cuanto abre los ojos.', 'Empezá la rutina de dormir 15 minutos antes del final de la ventana.'],
    data: 'En tus registros, las siestas de más de 40 min empezaron con 1h 50m de vigilia.',
  },
  {
    id: 't2', category: 'sincronia', title: 'Despertar al segundo bebé para alinear la toma',
    body: 'Cuando el desfase pasa de 30 minutos, la noche se parte en dos. Alinear la toma nocturna suele devolver un bloque entero de sueño a quien esté de turno.',
    how: ['Cuando el primero pida, ofrecé al segundo en los 15 minutos siguientes.', 'No fuerces si el segundo lleva menos de 2 h dormido.'],
  },
  {
    id: 't3', category: 'noche', title: 'Un despertar no significa hambre',
    body: 'Registrá qué pasó antes de ofrecer comida: ruido, pañal, calor, final de ciclo. El patrón aparece a los pocos días.',
  },
  {
    id: 't4', category: 'lactancia', title: 'Extracción doble antes de la noche larga',
    body: 'La extracción de la tarde suele dar el volumen que cubre la toma de madrugada sin despertar a quien duerme.',
    how: ['Bloque de 15-20 min con doble extractor.', 'Etiquetá con hora y volumen antes de guardar.'],
  },
];

export const team = [
  { id: 1, name: 'Vos', role: 'Cuenta principal', initial: 'V', tone: 'a', badge: 'Acceso total', badgeTone: 'accent' },
  { id: 2, name: 'Diego', role: 'Registra y ve todo', initial: 'D', tone: 'neutral', badge: 'Cuidador', badgeTone: 'neutral' },
  { id: 3, name: 'Marta', role: 'Solo registra tomas y siestas', initial: 'M', tone: 'neutral', badge: 'Limitado', badgeTone: 'neutral' },
  { id: 4, name: 'Carolina S.', role: 'Asesora de sueño · ve reportes', initial: 'C', tone: 'good', badge: 'Asesora', badgeTone: 'success' },
];

export const plan = {
  version: 'v3 · 12 ago',
  author: 'Carolina S.',
  fields: [
    { label: 'Objetivo de estas dos semanas', value: 'Llevar las dos siestas largas a la cuna y sostener el bloque nocturno de 9 h.' },
    { label: 'Ventanas por edad', value: '1h 45m — 2h 15m' },
    { label: 'Rutina de noche', value: 'Baño 18:40 · toma 19:00 · luz baja y cuna 19:25' },
    { label: 'Toma nocturna', value: 'Una sola, alineando a las dos, entre 02:00 y 03:30' },
    { label: 'Qué no hacer', value: 'No estirar la vigilia para “cansarlas”: sale al revés.' },
  ],
};

export const paywallPlans = [
  { id: 'mensual', name: 'Mensual', price: '$6,99', meta: 'Se renueva cada mes' },
  { id: 'anual', name: 'Anual', price: '$49', meta: 'Equivale a $4,08 por mes', badge: '2 meses gratis', badgeTone: 'success' },
];
