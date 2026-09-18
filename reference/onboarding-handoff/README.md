# Nocttua — onboarding · paquete de implementación

Las 10 pantallas del onboarding de **Nocttua App**, tal como están aprobadas en el diseño (turno *2a · Noche que se abre*).

```
CLAUDE.md                    ← empezá acá si sos Claude Code
SPEC.md                      ← especificación exacta, pantalla por pantalla
CONTRATO-AVISO-VENTANA.md    ← requisito de severidad 1 (pantallas 05 y 06)
screenshots/                 ← el diseño aprobado, una imagen por pantalla
src/
  components/OnboardingChrome.jsx   ← fondos, marco, barra de estado, paginador, tarjetas
  screens/01…10_*.jsx               ← las 10 pantallas, en orden de flujo
  OnboardingFlow.jsx                ← el flujo completo navegable
theme/tokens.js              ← tokens de diseño (también sirven para React Native)
public/assets/               ← logotipo e isotipo en SVG
```

## El flujo

| # | Archivo | Pantalla | Paginador |
|---|---|---|---|
| 01 | `01_WelcomeScreen.jsx` | Bienvenida | — |
| 02 | `02_BabyCountScreen.jsx` | Uno o dos bebés | 1 de 5 |
| 03 | `03_LoggingScreen.jsx` | Registro de sueño y tomas | 2 de 5 |
| 04 | `04_FeedingScreen.jsx` | Lactancia y extracción | 3 de 5 |
| 05 | `05_NextWindowPromiseScreen.jsx` | Próxima ventana · **crítica** | 4 de 5 |
| 06 | `06_NotificationsPermissionScreen.jsx` | Permiso de notificaciones | — |
| 07 | `07_PatternsScreen.jsx` | Patrones y reportes | 5 de 5 |
| 08 | `08_AppleAuthScreen.jsx` | Acceso con Apple | — |
| 09 | `09_AccountTypeScreen.jsx` | Individual o invitada | — |
| 10 | `10_ReadyScreen.jsx` | Listo | — |

La pantalla **02** es la bisagra: elegir dos bebés cambia el resto de la app (cada registro pide a quién corresponde, aparecen el desfase y el registro doble).

## Usar el código

Los archivos son React + Tailwind con valores literales (`text-[15.5px]`, `bg-[#16162B]`), así que **no necesitan configuración de Tailwind** para verse bien: funcionan con Tailwind por defecto. Si preferís utilidades semánticas, `theme/tokens.js` tiene todos los valores con nombre.

Requieren dos fuentes de Google — **Instrument Serif** (titulares) y **DM Sans** (cuerpo) — más **DM Mono** para horas y datos, y la clase `font-display-app` mapeada a Instrument Serif:

```js
// tailwind.config.js
fontFamily: {
  'display-app': ['Instrument Serif', 'Georgia', 'serif'],
  sans: ['DM Sans', 'system-ui', 'sans-serif'],
  mono: ['DM Mono', 'ui-monospace', 'monospace'],
}
```

Y los dos `@keyframes` de `SPEC.md` (`riseIn`, `twinkle`) en el CSS global.
