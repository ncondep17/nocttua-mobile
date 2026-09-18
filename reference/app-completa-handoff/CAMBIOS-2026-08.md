# Cambios de esta sesión — agosto 2026

Dos features nuevas sobre la app ya aprobada. **Nada de lo anterior cambia de diseño**;
lo que sigue son archivos nuevos + parches puntuales en archivos existentes.

---

## 1. Medicinas / modo enfermedad

**El problema:** el bebé se enferma, el doctor dice la dosis una vez por chat, y a las
3am nadie recuerda cuánto era ni quién dio la última. Se vuelve al chat o se pregunta de nuevo.

**La decisión de producto:** Noctua es tracking de **sueño**. Esto es un feature
secundario y se comporta como tal: **un recuadro**, no una pestaña, no una tarjeta
siempre abierta. Noctua **repite** la indicación del médico con su nombre y fecha;
**no calcula** dosis por peso ni sugiere medicación.

### Archivos nuevos
| Archivo | Qué es |
|---|---|
| `src/data/meds.js` | `MEDS` (indicaciones), `SEED_DOSES`, `SEED_EPISODE`, helper `ML()` |
| `src/lib/meds.js` | motor: `medPlan`, `nextDose`, `doseWarning`, `doseHistory`, `medStripCopy` |
| `src/components/MedStrip.jsx` | el recuadro de la pantalla Sueño |
| `src/overlays/MedsSheet.jsx` | hoja de Medicinas (episodio + filas por medicina y niña) |
| `src/overlays/GiveDoseSheet.jsx` | overlay "Dar medicina" (dosis en 44px) |
| `src/components/MedsPrescriptionCard.jsx` | "Medicinas indicadas" en la pestaña Cuidado |

### Parches en archivos existentes
1. **`src/screens/mobile/01_TodayScreen.jsx`** — montar `<MedStrip>` **después** del
   atajo de Alimentación y **antes** de las notas de relevo. Mismo peso visual que Alimentación.
2. **`src/screens/mobile/05_TeamScreen.jsx`** → renombrar a **`05_CareScreen.jsx`**:
   - Título de pantalla: `Equipo` → **`Cuidado`**.
   - Orden: equipo → vincular asesora → plan vigente → factores a vigilar →
     **separador `FUERA DEL SUEÑO`** → `<MedsPrescriptionCard>`.
3. **`src/components/MobileChrome.jsx`** (tab bar) — etiquetas:
   `Hoy` → **`Sueño`**, `Equipo` → **`Cuidado`**. Los ids de ruta no cambian.
4. **`src/screens/mobile/03_AnalyticsScreen.jsx`** — con episodio activo, banner al
   inicio: los días de enfermedad quedan **fuera** de promedios, correlaciones y cumplimiento.
5. Cualquier copy que dijera "en Equipo" ahora dice **"en Cuidado"** (había 3 casos).

### Reglas nuevas que no se negocian
- **Toda dosis se imprime con `ML()`**: coma decimal ("1,2 ml"), nunca punto.
  El resto de la app ya usa coma ("38,5 °C", "4,1 despertares").
- **Dosis por niña.** Mía y Lía tienen dosis distintas; jamás una sola cifra para las dos.
- **Nunca se bloquea la acción.** El aviso de intervalo o de máximo informa; decide el cuidador.
- **Atribución siempre visible**: médico + fecha en la receta, y quién dio cada dosis en el log.
- **Los días de enfermedad no contaminan la analítica del sueño.** Es el valor menos obvio
  del feature: una semana enferma no puede bajar el cumplimiento del plan.
- El contador del recuadro cuenta **esa medicina para esa niña** ("1 de 4 hoy"), nunca el total.

### Pendiente
- Editar la receta (solo admin) — la asesora la **ve**, no la cambia.
- Temperatura por registro y su vínculo con el episodio.
- El episodio en el dashboard de la asesora: los días atípicos también deben quedar
  fuera de sus promedios y aparecer marcados en el mapa semanal.
- Notificación local de próxima dosis (misma capa que la de próxima ventana).

---

## 2. Tablas de referencia en Tips

**El problema:** los papás primerizos no saben cuánta vigilia toca, cómo cae un día
ni qué es una "regresión". Hoy eso se busca en capturas de Instagram.

**La decisión:** tres acordeones **derivados del perfil de edad activo**, arriba de
"Por tema". Cero imágenes, cero tablas fijas: cambiar de edad recalcula las tres.
Siguen siendo **tips, no plan**: no generan acciones.

### Archivos nuevos
| Archivo | Qué es |
|---|---|
| `src/lib/sampleDay.js` | resuelve el día de ejemplo + los dos disclaimers |
| `src/data/regressions.js` | `REGRESSIONS`, intro, "mientras dura", nota de mellizas |
| `src/components/ReferenceCards.jsx` | los tres acordeones |

### Parches en archivos existentes
1. **`src/data/profiles.js`** — cada perfil suma tres campos:

```js
// nb      napLow: 40,  napHigh: 90,  winLow: 45,  winHigh: 60,  bed: '20:00'
// 3-6     winLow: 90,  winHigh: 120, bed: '19:30'
// 6-9     winLow: 150, winHigh: 180, bed: '19:30'
// 9-12    winLow: 180, winHigh: 210, bed: '19:45'
// 12-18   winLow: 210, winHigh: 270, bed: '20:00'
// 18-36   winLow: 300, winHigh: 330, bed: '20:00'
// 36+     winLow: 330, winHigh: 360, bed: '20:15'
```

Cada perfil suma además `napLow`/`napHigh` (40/90, 45/120, 60/90, 60/90, 60/120, 90/120, 60/120).

`winLow`/`winHigh` y `napLow`/`napHigh` son la versión numérica de los strings
`window` y `napLen` que ya se mostraban: **tienen que decir lo mismo**. Si editás
uno, editá el otro — son las dos cotas duras del día de ejemplo.

2. **`src/screens/mobile/04_TipsScreen.jsx`** — montar `<ReferenceCards>` justo antes
   del bloque "Por tema", solo en la home de Tips (no dentro de una categoría).
   `onSelectProfile` es el mismo setter del selector de edad de la barra superior.

### La regla crítica del día de ejemplo
El solver **nunca** puede imprimir una ventana mayor que `winHigh` ni menor que `winLow`:
un papá primerizo lo lee como recomendación, y una ventana más larga que la que el propio
producto aconseja es el error grave. El sobrante lo absorben la duración de la siesta y un
margen de ±30 min en la hora de acostar — **jamás la ventana, y tampoco la siesta**:
las dos están acotadas al rango que declara la tabla.

Verificación rápida: recorré las 7 edades y comprobá que
(a) la ventana Y la siesta del ejemplo caen dentro de los rangos que muestra la tabla de arriba,
(b) la hora de acostar queda entre 19:00 y 20:30,
(c) el número de siestas coincide con `napsLabel`.

### Contenido de regresiones
Es material educativo general (4 m, 6 m, 8–10 m, 12 m, 18 m, 2 a), escrito para
alguien que nunca oyó la palabra. Dos anclas de honestidad:
la de 4 meses **no es una fase** (es permanente), y con mellizas **no caen el mismo día**.
No se atribuye a ninguna autora ni se copia material de terceros.

### Pendiente
- Tabla de señales de sueño por etapa (la pidió el usuario como siguiente paso natural).
- Marcar en Datos la regresión probable según edad + patrón real de despertares,
  sin afirmar causa (la analítica describe, no califica).
