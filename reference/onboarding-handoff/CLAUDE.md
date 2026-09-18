# Instrucciones para Claude Code

Estás implementando el **onboarding de Nocttua App** (10 pantallas, móvil). El diseño ya está decidido y aprobado: tu trabajo es reproducirlo, no reinterpretarlo.

## Orden de lectura

1. `SPEC.md` — la especificación exacta, pantalla por pantalla. Es la fuente de verdad.
2. `screenshots/` — cómo se ve cada pantalla. Compará tu resultado contra esto.
3. `CONTRATO-AVISO-VENTANA.md` — **obligatorio antes de tocar la pantalla 05 o 06.** Es un requisito de severidad 1, no una nota de diseño.
4. `src/` — las 10 pantallas ya escritas en React + Tailwind, con los valores exactos.

## Reglas que no se negocian

- **No cambies valores.** `15.5px`, `13.5px`, `12.5px`, `10.5px` son intencionales. No los redondeés a la escala de Tailwind.
- **Los fondos son degradados compuestos**, no colores planos. Están en `BACKGROUNDS` (`src/components/OnboardingChrome.jsx`). Cinco variantes distintas, una por grupo de pantallas.
- **Bebé A = violeta `#A79FE0`. Bebé B = terracota `#C2703F`.** Nunca al revés, en ninguna pantalla.
- **El ámbar `#F0A868` es señal**: etiquetas de sección, horas, "hoy". Nunca cuerpo de texto.
- **Titulares en Instrument Serif 400.** Cuerpo en DM Sans. Datos y horas en DM Mono. Sin excepciones.
- **Toque mínimo 44px de alto** en todo control. Se usa a las tres de la mañana con una mano.
- El paginador de 5 puntos aparece **solo en 02, 03, 04, 05 y 07**. Las pantallas 01, 06, 08, 09 y 10 no son pasos del carrusel: son decisiones o cierres.
- El logotipo no se recolorea por CSS: se usa el SVG de la variante correcta (`/assets/wordmark-tight-crema.svg` en fondo noche).

## Lo que falta y tenés que resolver

- Navegación real (React Navigation si es nativo).
- Persistencia de la elección de 02 (un bebé / dos): condiciona el resto de la app.
- Petición real del permiso de notificaciones en 06, con el estado denegado degradando según el contrato.
- Pegado real del código de asesora en 09 (portapapeles + deep link `nocttua.app/c/…`).
- Sign in with Apple en 08.

## Lo que NO tenés que hacer

- No añadas pantallas, no reordenes el flujo, no "mejorés" el copy. El texto está aprobado palabra por palabra en `SPEC.md`.
- No agregues Google ni correo en la 08: el flujo aprobado es solo Apple.
- No metas librerías de gráficos: las barras de la 07 son `<span>` con altura en porcentaje.
