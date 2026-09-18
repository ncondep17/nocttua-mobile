# Nocttua — App completa · paquete de implementación

El prototipo aprobado, en React + Tailwind, listo para abrir en VS Code.

```bash
npm install
npm run dev
```

```
CLAUDE.md              ← empezá acá si sos Claude Code
SPEC.md                ← la especificación: geometría, color, tipografía, pantalla por pantalla
src/
  lib/
    time.js            toMin · fmt · dur · avg · one
    derive.js          EL MOTOR: todo número de la UI sale de acá
  data/
    profiles.js        las 7 franjas de edad + vocabulario de los formularios
    records.js         la semana de ejemplo (contrato de datos)
    insights.js        los 21 tips
  components/
    primitives.jsx     Chip · Stepper · Toggle · SegTabs · Card · NightCard · MetricBar…
    MobileChrome.jsx   PhoneFrame · StatusBar · TabBar · Sheet · Toast · FullScreen
  screens/
    mobile/            01 Hoy · 02 Leche · 03 Datos · 04 Tips · 05 Equipo
    overlays/          SleepLog · FeedLog · DayDetail · AdvisorCode · Paywall
    desktop/           CaseDashboard · BillingDashboard
  App.jsx              cáscara del prototipo (NO va a producción)
```

## Las tres vistas

| Vista | Quién la usa |
|---|---|
| **Móvil · cuidadores** | mamá, papá y niñera. Registro, patrones, tips y equipo. |
| **Escritorio · caso** | la asesora sobre una familia: evidencia a la izquierda, intervención a la derecha. |
| **Escritorio · suscripción** | la cuenta profesional de la asesora: plan, cupos, link de invitación y familias. |

## La idea que sostiene el producto

Una familia registra en dos toques a las tres de la mañana. Con siete días de datos, la app separa lo que es casualidad de lo que es patrón — y lo dice **describiendo, nunca calificando**. La asesora ve los mismos datos con densidad de trabajo y es la única que escribe el plan. La app no prescribe: recuerda.

## Antes de tocar el código

Leé `src/lib/derive.js`. Ninguna cifra está escrita a mano: el plan del día, el cumplimiento, las correlaciones, el mapa semanal y las tres gráficas se calculan ahí a partir de la tabla de edad y de los registros. Cambiar el perfil de edad en la barra superior es la prueba de que está bien conectado.

## Estilos

Los archivos usan Tailwind con valores literales (`text-[14.5px]`, `bg-[#16162B]`), así que no dependen de una configuración de tokens: solo hace falta `tailwind.config.js` (incluido) para las fuentes y los cinco `@keyframes`.

Fuentes: **Instrument Serif** (titulares), **DM Sans** (cuerpo), **DM Mono** (horas y datos). Ya están enlazadas en `index.html`.
