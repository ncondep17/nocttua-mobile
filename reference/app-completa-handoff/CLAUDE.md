# Instrucciones para Claude Code

Estás implementando **Nocttua — App completa**: la app móvil de los cuidadores (5 pestañas) y las dos vistas web de la asesora. El diseño está aprobado y el código de `src/` ya lo reproduce. Tu trabajo es conectarlo a datos reales, no reinterpretarlo.

## Orden de lectura

0. `CAMBIOS-2026-08.md` — **las dos features nuevas de la última sesión** (medicinas / modo enfermedad, y las tablas de referencia de Tips). Empezá por ahí: cambia nombres de pestañas y agrega archivos.
1. `SPEC.md` — especificación exacta: geometría, color, tipografía, pantalla por pantalla, y las reglas de producto.
2. `src/lib/derive.js` — **el motor de cálculo. Leelo antes que ningún JSX.** Todo lo que la app afirma sale de ahí.
3. `src/data/` — el contrato de datos que esperan las pantallas.
4. `src/screens/` — las pantallas, ya escritas en React + Tailwind con los valores del diseño.

Arrancá con `npm install && npm run dev`.

## Reglas que no se negocian

- **No cambies valores.** `14.5px`, `12.5px`, `15.5px`, `13.5px`, `10.5px`, `11.5px` son intencionales. No los redondees a la escala de Tailwind.
- **Bebé A (Mía) = violeta `#6B5DD3`. Bebé B (Lía) = terracota `#C2703F`.** Nunca al revés, en ninguna pantalla ni gráfico.
- **El ámbar `#F0A868` es señal**: etiquetas de sección sobre noche, horas, despertares, "hoy". Nunca cuerpo de texto.
- **La analítica describe, no califica.** Sin rachas, sin puntuaciones, sin "mejorá". Se compara el dato real contra el rango de la edad y se nombra la **asociación**, nunca la causa.
- **Un factor solo se muestra con 3+ noches registradas** (ya está implementado en `correlations()`). No bajes ese umbral.
- **El plan lo escribe SOLO la asesora.** En la app de la familia (`TeamScreen`) es de solo lectura. Tips ≠ plan: los tips recuerdan, el plan prescribe.
- **«Le tocaba esta toma»** es el campo que separa hambre real de asociación de sueño. Si lo quitás, la analítica de tomas nocturnas deja de significar algo.
- **Ningún control por debajo de 44px de alto.** Se usa a las tres de la mañana, con una mano y a oscuras.
- **Nada de emoji.** Los iconos son glifos geométricos (◐ ◍ ◔ ❏ ◇ ☾ ✦ ⬆ ◑).
- **Las pestañas son `Sueño · Leche · Datos · Tips · Cuidado`.** Los ids de ruta siguen siendo `hoy` y `equipo`: cambió la etiqueta, no la ruta.
- **Medicinas: Noctua repite, no calcula.** Se guarda la indicación del médico con su nombre y fecha; nunca se calcula dosis por peso ni se sugiere medicación. El aviso de intervalo o de máximo informa, **no bloquea**.
- **Toda dosis se imprime con `ML()`** (coma decimal: "1,2 ml"), y siempre por niña — Mía y Lía tienen dosis distintas.
- **Los días de enfermedad quedan fuera de la analítica de sueño**: promedios, correlaciones y cumplimiento. Una semana enferma no puede bajar el cumplimiento del plan.
- **Las tablas de referencia de Tips se derivan del perfil de edad**, nunca son imágenes ni tablas fijas. El día de ejemplo **jamás** imprime una ventana fuera de `winLow..winHigh` del perfil: el sobrante lo absorben la siesta y ±20 min en la hora de acostar.
- **Cero librerías de gráficos.** Las barras son `<div>` con altura en %, las curvas son SVG a mano. Ya está todo escrito.

## El motor de cálculo (`src/lib/derive.js`)

Ninguna cifra de la UI está escrita a mano. Si un número no coincide con el diseño, el bug está en esta capa:

| Función | Qué produce |
|---|---|
| `planBlocks(p)` | El plan del día por edad: despertar → N siestas → noche |
| `nowMinutes(p)` | El reloj simulado (38 min antes de la primera siesta) |
| `correlations()` | Factores asociados a más despertares, ordenados |
| `compliance(planDraft)` | Cumplimiento del plan, umbral por umbral |
| `heatRow(día, bebé)` | Una fila del mapa semanal (24 h desde las 6:00) |
| `dayDetail(día, bebé)` | La hoja de detalle de una jornada |
| `twinRows()` / `twinVerdict()` | Comparación entre las dos |
| `restRows(p)` / `restFlag(p)` | Sueño real contra el rango de la edad |
| `wakesByHour()`, `wakeCurve()`, `scatter(p)` | Las tres gráficas |

Dos motores nuevos, misma regla: la UI no calcula nada.

| Función | Qué produce |
|---|---|
| `lib/meds.js` → `medPlan`, `nextDose` | qué medicina toca, a quién y a qué hora |
| `lib/meds.js` → `doseWarning`, `doseHistory`, `medStripCopy` | el aviso, el log del día, el copy del recuadro |
| `lib/sampleDay.js` → `solveSampleDay(p)` | el día de ejemplo de esa edad, con la ventana acotada al rango |

**El selector de edad es la prueba de fuego.** Cambiá el perfil en la barra superior: si el plan del día, las tomas esperadas, las regresiones, los rangos de las gráficas y los tips no se recalculan todos, el motor está mal conectado.

## Lo que falta y tenés que resolver

- Persistencia real y sincronización entre cuidadores (varios dispositivos, una sola cuenta).
- **Offline primero**: se registra de madrugada, sin conexión fiable. El registro nunca puede fallar por red.
- Cálculo de la ventana con datos reales del bebé, no con la tabla fija de `profiles.js` (la tabla es el punto de partida, no el destino).
- Permisos por miembro del equipo — `TeamScreen` y el acceso de la asesora son dos caras del mismo modelo.
- Publicación de versiones del plan: la asesora escribe v4, la familia lo lee.
- Notificación de próxima ventana (local, no push) y notas de relevo entre turnos.
- Suscripción real y el vínculo por código de asesora (familia con código = analíticas incluidas).
- **Medicinas**: editar la receta (solo admin; la asesora la ve, no la cambia), temperatura por registro, el episodio reflejado en el panel de la asesora (días atípicos marcados y fuera de sus promedios) y notificación local de próxima dosis.
- **Tips**: tabla de señales de sueño por etapa, y marcar la regresión probable en Datos según edad + patrón real de despertares — sin afirmar causa.

## Lo que NO tenés que hacer

- No agregues pantallas, no reordenes las pestañas, no reescribas el copy: está aprobado palabra por palabra.
- No conviertas los tips en un plan ni les agregues acciones prescriptivas.
- No agregues gamificación. El bloque verde de "Buen trabajo esta semana" es el ÚNICO momento celebratorio, es semanal y siempre está atribuido al esfuerzo de ellos con datos reales.
- No muestres la vista del prototipo (`src/App.jsx`) en producción: es la herramienta de revisión, no un producto.
