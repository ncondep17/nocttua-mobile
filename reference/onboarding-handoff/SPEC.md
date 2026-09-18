# Onboarding de Nocttua App — especificación exacta

10 pantallas, móvil, fondo noche. Diseño aprobado: turno **2a** (“Noche que se abre”).

## Geometría base

| Qué | Valor |
|---|---|
| Marco de revisión | 340 × 700 px, bisel 9px, radio exterior 44, radio interior 36 |
| Ancho útil del contenido | 322px (340 − 2×9) |
| Padding lateral estándar | **26px** (excepción: pantalla 09 usa 24px) |
| Padding inferior de pantallas paginadas | 30px |
| Barra de estado | `9:41` / `◆ ◆` — DM Mono 12px, color `#B9B2C9`, padding `14px 22px 0` |

> Las medidas están dadas sobre el ancho de revisión de 322px. Al llevarlo a un dispositivo real (390–402px de ancho), escalá los paddings proporcionalmente pero **mantené los tamaños de tipografía tal cual**: el diseño se validó con esos cuerpos.

## Fondos (degradados compuestos, no colores planos)

| Variante | Pantallas | Valor CSS |
|---|---|---|
`ambarAbajo` | 01, 10 | `radial-gradient(120% 70% at 50% 108%, rgba(240,168,104,.24) 0%, rgba(240,168,104,0) 62%), linear-gradient(180deg,#16162B 0%,#22224A 56%,#332F5C 100%)` |
| `noche` | 02, 03, 04, 07 | `linear-gradient(180deg,#16162B 0%,#22224A 60%,#312D58 100%)` |
| `ambarArriba` | 05 | `radial-gradient(110% 60% at 50% 8%, rgba(240,168,104,.28) 0%, rgba(240,168,104,0) 58%), linear-gradient(180deg,#1A1A34 0%,#26264F 58%,#332F5C 100%)` |
| `nocheAlta` | 06 | `linear-gradient(180deg,#16162B 0%,#23234B 58%,#332F5C 100%)` |
| `violetaAbajo` | 08 | `radial-gradient(120% 65% at 50% 105%, rgba(167,159,224,.22) 0%, rgba(167,159,224,0) 62%), linear-gradient(180deg,#16162B 0%,#22224A 60%,#332F5C 100%)` |
| `nocheBaja` | 09 | `linear-gradient(180deg,#16162B 0%,#23234B 62%,#332F5C 100%)` |

## Color

| Rol | Hex | Uso |
|---|---|---|
| Noche base | `#16162B` | fondo, texto sobre crema |
| Noche media | `#22224A` · `#332F5C` | paradas del degradado |
| Borde noche | `#4A4A7A` | bordes de tarjeta sobre noche |
| Borde interior | `#6E6890` | bordes de controles dentro de una tarjeta |
| Crema | `#FBF7F0` | texto principal, botón primario |
| Texto suave | `#D6D0E4` | cuerpo sobre noche |
| Texto tenue | `#B9B2C9` | pies de tarjeta, secundario |
| Texto apagado | `#8E87B5` | terciario, "nunca", declinar |
| Violeta | `#6B5DD3` | acción secundaria "Seguir", selección |
| Violeta claro | `#A79FE0` | **Bebé A**, barras de la semana en curso |
| Terracota | `#C2703F` | **Bebé B**, barra de tomas |
| Ámbar | `#F0A868` | etiquetas de sección, horas, barra de hoy |
| Verde | `#7FB09A` | cifras positivas (reserva, mejora) |
| Relleno de vidrio | `rgba(251,247,240,.07)` | tarjeta de demo sobre noche |
| Selección | `rgba(107,93,211,.18)` | fondo de tarjeta elegida |

## Tipografía

| Uso | Familia | Tamaños que aparecen |
|---|---|---|
| Titulares | Instrument Serif 400 | 38 (01) · 34 (10) · 33 (02, 03, 04, 07, 08) · 32 (05, 06) · 31 (09) · 25 (“¿Qué pasó?”) |
| Cuerpo | DM Sans 400 | 15.5 (01) · 15 · 14.5 · 13.5 · 13 · 12.5 · 12 |
| Etiquetas y datos | DM Mono 400 | 14 · 13 · 12.5 · 12 · 11 · 10.5 |
| Peso 500 | DM Sans Medium | botones, títulos de tarjeta, nombres de opción |
| Peso 700 | DM Sans Bold | solo “Nocttua” en la notificación de la 05 |

Etiquetas de sección: DM Mono 11px, `text-transform: uppercase`, `letter-spacing: .12em`, color ámbar.
Interlineado: titulares 1.06–1.12 · cuerpo 1.6 · texto pequeño en tarjeta 1.45–1.55.

## Componentes recurrentes

- **Tarjeta de vidrio**: `rgba(251,247,240,.07)` + borde 1px `#4A4A7A`, radio 18–20, padding 15–17, gap 12–13.
- **Botón crema** (acción principal): fondo `#FBF7F0`, texto `#16162B`, radio 14, padding 16, 16px/500, ancho completo.
- **Pastilla violeta** (“Seguir”): fondo `#6B5DD3`, texto crema, radio 99, padding `13px 26px`, 15px/500.
- **Paginador**: 5 puntos de 4px de alto; el activo mide 22px y es crema; los inactivos 6px y `#4A4A7A`; gap 6px.
- **Check de selección**: círculo `#6B5DD3`, 17px en 02 y 18px en 09, glifo ✓ crema.
- **Estrella titilante**: glifo ✦ en posición absoluta, `animation: twinkle 4–5.5s ease-in-out infinite` (opacidad .35 ↔ 1).

## Animaciones

```css
@keyframes riseIn  { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
@keyframes twinkle { 0%, 100% { opacity: .35 } 50% { opacity: 1 } }
```

`riseIn .6s ease both` en el bloque de contenido de la 01. Transición entre pantallas: fundido, no deslizamiento lateral.

---

# Pantalla por pantalla

## 01 · Bienvenida
**Archivo:** `src/screens/01_WelcomeScreen.jsx` · **Fondo:** ambarAbajo · **Sin paginador**

Contenido anclado **abajo** (`justify-end`), padding `0 26px 34px`, gap 22.

- Logotipo Nocttua crema, **120px de ancho, opacidad .92** (`/assets/wordmark-tight-crema.svg`). No lo agrandes: el titular es de la misma familia serif y a más tamaño compiten.
- H1 · 38px/1.06: **“Un bebé o dos. Todo en el mismo lugar.”**
- Cuerpo · 15.5px/1.6 `#D6D0E4`: “Sueño, tomas, lactancia y extracción. Nocttua guarda lo que pasó y te dice qué sigue.”
- Botón crema: **Empezar**
- Enlace centrado 14px `#B9B2C9`: **Ya tengo cuenta**
- Dos estrellas: ámbar 12px en `top 118 / left 50` (4s); `#C9C1D8` 9px en `top 186 / right 62` (5.5s).

## 02 · Uno o dos bebés
**Archivo:** `02_BabyCountScreen.jsx` · **Fondo:** noche · **Paginador: punto 1 de 5** · Etiqueta: `Tu casa`

Esta elección condiciona toda la app: con dos bebés cada registro pide a quién corresponde y aparecen el desfase y el registro doble.

- H1 · 33px/1.1: “¿Cuántos bebés estás siguiendo?”
- Cuerpo: “Con uno, Nocttua te quita el cuaderno de encima. Con dos, te quita el caos: nadie más los sigue en paralelo de verdad.”
- Dos tarjetas en fila (gap 10, radio 16, padding 14):
  - *Un bebé* — “Una sola línea de tiempo, sin ruido.”
  - *Dos bebés* — “Cada uno con su ritmo, en una pantalla.” **(seleccionada por defecto)**
- Tarjeta de vidrio (radio 18, padding 15) con dos columnas:
  - punto `#A79FE0` · **Bebé A** · mono “durmió 4h · 3 tomas”
  - punto `#C2703F` · **Bebé B** · mono “durmió 5h · 4 tomas”
  - pie 12.5px: “Registras a uno y te ofrecemos copiar al otro. Si van desfasados, cada uno mantiene su horario.”

## 03 · Registro de sueño y tomas
**Archivo:** `03_LoggingScreen.jsx` · **Fondo:** noche · **Paginador: 2 de 5** · Etiqueta: `Registro`

- H1 · 33px: “Sueño y tomas, con un toque cada uno.”
- Cuerpo: “Se durmió, despertó, tomó o no tomó. No hace falta anotar cada microsiesta: lo importante es lo que arma la rutina.”
- Tarjeta de vidrio, radio 20, padding 17:
  - fila superior: “¿Qué pasó?” en Instrument Serif 25px + `20:12` en mono ámbar 14px
  - rejilla 2×2, gap 8, radio 12, padding 12, 14.5px: **Se durmió** (activa: crema/noche) · Tomó leche · Pañal · Nota
  - tres pastillas (radio 99, padding 9, 13px): **Bebé A** activa con `rgba(107,93,211,.2)` · Bebé B · Los dos
  - pie: “Lo corriges a la mañana, cuando estés despierta.”

## 04 · Lactancia y extracción
**Archivo:** `04_FeedingScreen.jsx` · **Fondo:** noche · **Paginador: 3 de 5** · Etiqueta: `Lactancia`

- H1 · 33px: “Pecho, fórmula y extracción en el mismo registro.”
- Cuerpo: “Qué lado tocaba, cuántos minutos, cuántos ml y qué te queda en reserva. Sin cuadernos ni notas del teléfono.”
- Tarjeta de vidrio, gap 13:
  - “Última toma” 14px/500 + mono ámbar 12.5px “hace 2h 10”
  - tres cajas (borde `#6E6890`, radio 14, padding 11): *Pecho izq.* `12 min` · *Pecho der.* `9 min` · *Fórmula* `60 ml` — etiqueta 12px `#B9B2C9`, cifra mono 17px crema
  - fila separada por borde superior `#4A4A7A`, pt 11: “Extracción de hoy” + mono verde `120 ml · reserva 640 ml`
  - pie: “Te avisamos de qué lado toca la próxima, para no adivinar.”

## 05 · Próxima ventana — PROMESA CRÍTICA
**Archivo:** `05_NextWindowPromiseScreen.jsx` · **Fondo:** ambarArriba · **Paginador: 4 de 5** · Etiqueta: `La promesa`

> Esta pantalla vende un servicio de severidad 1. Leé `CONTRATO-AVISO-VENTANA.md` antes de implementarla.

- H1 · 32px/1.1: “Te avisamos cuál es la próxima ventana.”
- Cuerpo 14.5px: “Con lo que registras — siestas del día, última toma, despertares — calculamos el horario que le conviene hoy. No tienes que abrir la app ni hacer cuentas.”
- **Notificación crema simulada**: fondo `#FBF7F0`, radio 18, padding `14px 15px`, gap 12, sombra `0 16px 34px -14px rgba(22,22,43,.6)`.
  - isotipo noche 26px, `margin-top: 2px`
  - “Nocttua” 13.5px/700 `#16162B` + “ahora” mono 11px `#8A8299`
  - cuerpo 13.5px/1.45: “Bebé A: ventana 12:30. Última toma 10:20, conviene ofrecer antes de dormir.”
- Caja con borde `#4A4A7A` (sin relleno), radio 18, padding 15:
  - etiqueta mono ámbar 10.5px: **Compromiso del sistema**
  - 12.5px/1.55: “El aviso se programa en tu teléfono, no en un servidor. Llega con o sin internet.”

## 06 · Permiso de notificaciones
**Archivo:** `06_NotificationsPermissionScreen.jsx` · **Fondo:** nocheAlta · **Sin paginador y sin “Saltar”**

Es una decisión, no un paso. Contenido **centrado**, gap 20.

- Etiqueta mono ámbar 10.5px: “Un solo permiso”
- H1 · 32px: “Activa el aviso. Es lo único que te vamos a pedir.”
- Cuerpo 14.5px: “Sin este permiso podemos calcular la ventana y la próxima toma, pero no avisarte: tendrías que abrir la app para saberlo.”
- Caja con borde, radio 16, padding 14, gap 9 — tres filas de 13.5px con valor en mono 11px:
  - Ventana de sueño → **imprescindible** (ámbar)
  - Próxima toma o extracción → **recomendado** (ámbar)
  - Novedades de Nocttua → **nunca** (`#8E87B5`)
- Botón crema: **Activar avisos**
- Declinar, centrado 13.5px `#8E87B5`: **Prefiero mirar la app yo**

## 07 · Patrones y reportes
**Archivo:** `07_PatternsScreen.jsx` · **Fondo:** noche · **Paginador: 5 de 5** · Etiqueta: `Patrones`

- H1 · 33px: “Ves qué mueve la aguja, no solo la noche de ayer.”
- Cuerpo: “Cuánto durmió, cuánto tomó y cómo se relacionan. Una mala noche no dice nada; la semana sí.”
- Tarjeta de vidrio, gap 13:
  - “Últimos 7 días” + mono verde 12px “+42 min de noche”
  - **7 barras**, caja de 84px, gap 9, radio 6. Alturas y colores exactos:
    `48% #4A4A7A` · `62% #4A4A7A` · `44% #4A4A7A` · `70% #A79FE0` · `78% #A79FE0` · `66% #A79FE0` · `88% #F0A868`
    (el degradado de color cuenta la historia: pasado apagado, semana en curso violeta, hoy ámbar)
  - dos barras horizontales de 7px sobre `#33335F`, etiqueta de 56px a 11.5px: **Tomas 72%** `#C2703F` · **Extracción 45%** `#7FB09A`
  - pie: “Si el pediatra lo pide, lo exportas en un toque.”

## 08 · Acceso con Apple
**Archivo:** `08_AppleAuthScreen.jsx` · **Fondo:** violetaAbajo · **Sin paginador**

Un solo camino: Apple. **No hay Google ni correo en este flujo.** Centrado, gap 26.

- Isotipo crema 38px
- H1 · 33px: “Entra en dos toques.”
- Cuerpo 15px: “Sin contraseñas nuevas que recordar a las tres de la mañana.”
- Botón crema con glifo  a 18px + “Continuar con Apple”
- Nota centrada 12.5px/1.55: “Puedes ocultar tu correo. Guardamos solo lo necesario para tus registros.”
- Legal centrado 12px `#8E87B5` con enlaces en `#C9C1D8`: “Al continuar aceptas los **Términos** y la **Privacidad**.”

## 09 · Individual o invitada
**Archivo:** `09_AccountTypeScreen.jsx` · **Fondo:** nocheBaja · **Sin paginador** · **Padding lateral 24px**

- H1 · 31px/1.12: “¿Vas sola o te acompaña una asesora?”
- Cuerpo 14.5px: “Puedes cambiarlo cuando quieras.”
- Dos tarjetas (radio 18, padding 16, gap 11):
  - **Por mi cuenta** (seleccionada por defecto) 16px/500 + check 18px — “La app completa, con las guías incluidas.”
  - **Me invitó una asesora** + círculo vacío borde `#6E6890` — “Pega el link o escribe el código que te envió.”
    - campo: fondo `rgba(22,22,43,.6)`, borde `#6E6890`, radio 12, padding 13, mono 14px, `letter-spacing .08em`, texto `nocttua.app/c/…`
    - botón crema **Pegar**, padding `13px 14px`, radio 12, 14px/500
- CTA violeta de ancho completo, radio 14, padding 16, 16px/500: **Continuar**

## 10 · Listo
**Archivo:** `10_ReadyScreen.jsx` · **Fondo:** ambarAbajo · **Sin paginador**

Cierra con la misma luz de la 01. Centrado, gap 22.

- Etiqueta mono ámbar 10.5px: “Listo”
- H1 · 34px/1.08: “Ya está. Empieza por lo último que pasó.”
- Cuerpo 15px: “Registra la última toma o el último sueño. El resto lo vamos completando solos.”
- **Solo si se vinculó una asesora en la 09** — tarjeta de vidrio radio 18, padding 15, gap 12:
  - avatar 38px circular `#4A4A7A` con inicial en Instrument Serif 17px
  - “Carolina, tu asesora” 14.5px/500 + “Ve tus registros y te deja notas.” 12.5px `#B9B2C9`
- Botón crema: **Registrar ahora**
- Estrella ámbar 11px en `top 148 / left 44` (4.5s)

---

## Checklist de aceptación

- [ ] Los cinco fondos son los degradados compuestos, no colores planos.
- [ ] Bebé A violeta y Bebé B terracota en 02 y 03.
- [ ] Las 7 barras de la 07 tienen las alturas y los tres colores exactos.
- [ ] El paginador aparece solo en 02, 03, 04, 05 y 07, con el punto activo a 22px.
- [ ] La notificación de la 05 es crema con sombra, no una tarjeta de vidrio.
- [ ] La 06 no tiene “Saltar”.
- [ ] La 08 ofrece únicamente Apple.
- [ ] La tarjeta de asesora de la 10 no aparece si no hubo vinculación.
- [ ] Ningún control mide menos de 44px de alto.
- [ ] El aviso de la ventana cumple `CONTRATO-AVISO-VENTANA.md`.
