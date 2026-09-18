/**
 * Regresiones — material de referencia para papás primerizos.
 * `ages` son los ids de perfil donde la regresión se resalta como "a su edad".
 * Es contenido educativo, NO prescripción: nunca genera una acción en el plan.
 */
export const REGRESSIONS = [
  { age: '4 meses', when: '3 – 5 meses', dur: 'no se va: es permanente', ages: ['nb', '3-6'],
    what: 'La única que no es una fase. Su sueño madura y empieza a tener ciclos como el de un adulto: se despierta al terminar cada ciclo y necesita volver a dormirse sola.',
    sign: 'Despertares cada 2 h y siestas que se cortan a los 30–40 min.' },
  { age: '6 meses', when: '5 – 7 meses', dur: '1 – 2 semanas', ages: ['3-6', '6-9'],
    what: 'Aprende a sentarse y a girar, y practica de noche. Suele coincidir con el paso a tres siestas y con el arranque de sólidos.',
    sign: 'Se despierta sentada o boca abajo y no sabe volver a la posición.' },
  { age: '8 – 10 meses', when: '8 – 10 meses', dur: '2 – 6 semanas', ages: ['6-9', '9-12'],
    what: 'La más larga. Gatea, se pone de pie y aparece la ansiedad de separación: entiende que te vas aunque no te vea. Casi siempre cae junto con dejar la tercera siesta.',
    sign: 'Llora al dejarla en la cuna, se para y no se sabe bajar.' },
  { age: '12 meses', when: '11 – 13 meses', dur: '1 – 2 semanas', ages: ['9-12', '12-18'],
    what: 'Camina y quiere seguir practicando. Muchas familias creen que ya no necesita dos siestas y la quitan demasiado pronto.',
    sign: 'Pelea la siesta de la tarde pero llega deshecha a la noche.' },
  { age: '18 meses', when: '17 – 20 meses', dur: '2 – 4 semanas', ages: ['12-18', '18-36'],
    what: 'Autonomía, lenguaje y molares a la vez. Ya puede decir «no» y probar cuánto aguanta el límite a la hora de dormir.',
    sign: 'Se levanta, pide agua, alarga la rutina, llanto en la puerta.' },
  { age: '2 años', when: '23 – 26 meses', dur: '1 – 3 semanas', ages: ['18-36', '36+'],
    what: 'Imaginación y primeros miedos, control de esfínteres y a veces el paso a cama. La siesta se acorta o empieza a desaparecer.',
    sign: 'Tarda una hora en dormirse o se despierta llorando por sueños.' },
];

export const REGRESSION_INTRO =
  'Una regresión no es que «desaprendió» a dormir. Es un salto de desarrollo — motor, cerebral o emocional — que la despierta más y le cuesta volver a dormirse. Duran días o pocas semanas, aparecen en edades bastante predecibles y se pasan solas si no cambiás lo que ya funcionaba.';

export const REGRESSION_DO = [
  'Sostené la ventana y la hora de acostarse: es lo que la ancla.',
  'Ofrecé más sueño temprano, no más tarde: adelantá la noche 20–30 min si la siesta salió corta.',
  'No estrenes hábitos que después haya que quitar (dormirla en brazos, toma para volver a dormir).',
  'No cambies dos cosas a la vez, y no quites una siesta en plena regresión.',
  'Si pasa de 4 semanas o hay fiebre, no es la regresión: consultá.',
];

export const REGRESSION_TWINS =
  'Con mellizas rara vez caen el mismo día: una puede entrar en la regresión una o dos semanas antes que la otra. Mirá cada una por separado en Datos antes de cambiar el plan de las dos.';

export const regressionsForAge = profileId => REGRESSIONS.filter(r => r.ages.indexOf(profileId) >= 0);
