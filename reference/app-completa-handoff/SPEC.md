# Nocttua — App completa · especificación

Tres vistas sobre un mismo sistema:

| Vista | Quién | Forma | Archivo |
|---|---|---|---|
| Móvil · cuidadores | mamá, papá, niñera | 402×856 | `src/screens/mobile/` |
| Escritorio · caso | la asesora, sobre UNA familia | ancho máx 1320 | `src/screens/desktop/CaseDashboard.jsx` |
| Escritorio · suscripción | la asesora, su cuenta | ancho máx 1320 | `src/screens/desktop/BillingDashboard.jsx` |

## Geometría

| Qué | Valor |
|---|---|
| Marco del teléfono | 402×856, bisel 11px, radio exterior 44, interior 34 |
| Padding de pantalla móvil | `12px 20px 18px` |
| Gap entre bloques | 12 (Hoy) · 13 (Leche, Tips) · 14 (Datos, Equipo) |
| Tarjeta móvil | radio 16, padding `14px 15px`, borde 1px `#E4DCD0` |
| Tarjeta noche | radio 16, padding `14px 16px`, fondo `#16162B` |
| Hoja inferior | radio `24px 24px 34px 34px`, padding `10px 20px 22px`, máx 90% |
| Barra de pestañas | `9px 20px 20px`, borde superior `#E4DCD0`, toque mín. 56px |
| Panel de escritorio | radio 18, padding `20px 22px` |
| Ventana web | radio 20, ancho máx 1320, sombra `0 24px 60px -30px rgba(22,22,43,.4)` |

## Color

| Rol | Hex |
|---|---|
| Noche · fondo de tarjeta clave, texto fuerte | `#16162B` |
| Noche media · timeline nocturno | `#2C2C52` · `#22224A` · `#33335F` |
| Crema papel · fondo de pantalla móvil | `#FBF7F0` |
| Crema base · fondo del navegador | `#E7E1D6` |
| Hueco hundido (pestañas segmentadas) | `#EFE9DF` |
| Bordes | `#E4DCD0` (tarjeta) · `#DCD4C8` (control) · `#F0EAE0` (filete interno) · `#C9C1D8` (violeta suave) |
| Violeta · Bebé A, siesta, acento | `#6B5DD3` |
| Violeta claro · sobre noche | `#A79FE0` · `#B9AFEA` |
| Violeta fondo | `#F6F1FB` · `#E8DFF6` |
| Terracota · Bebé B | `#C2703F` · fondo `#FDF3EA` · `#FDE8D7` |
| Ámbar · señal | `#F0A868` · texto sobre crema `#B08A55` / `#B07A3C` · fondo `#FFF9F0` / `#FFF3E3` |
| Verde · va bien | `#3F7A62` · `#7FB09A` · fondo `#DCEDE4` / `#F3F7F4` |
| Coral · a vigilar | `#D9705A` · `#C0533C` · fondo `#FBE4DF` |
| Tinta | `#16162B` fuerte · `#4A4459` cuerpo · `#6E6878` · `#8A8299` · `#A9A2B5` |
| Sobre noche | `#FBF7F0` · `#B9B2C9` · `#8E87B5` |

## Tipografía

| Uso | Familia | Tamaños |
|---|---|---|
| Titulares de pantalla | Instrument Serif 400 | 31 (móvil) · 34 (escritorio) · 30 (onboarding) · 29 (paywall) · 25 · 24 · 23 · 22 |
| Cuerpo | DM Sans | 16 (título de tarjeta, 500) · 15.5 · 14.5 · 14 · 13.5 · 13 · 12.5 · 12 · 11.5 |
| Datos, horas, etiquetas | DM Mono | 22 · 21 · 20 · 19 · 17 · 16 · 15 · 14 · 13.5 · 13 · 12.5 · 11.5 · 11 · 10.5 · 9.5 |

Etiqueta de sección: DM Mono 11px, mayúsculas, `letter-spacing: .1em`.
Interlineado: titulares 1.1–1.25 · cuerpo 1.45–1.55 · texto de tarjeta 1.3–1.35.

## Animaciones

```css
riseIn  .45s ease both   /* opacidad 0→1 + translateY 10px→0 */
growW   .9s  ease both   /* barras: crecen de 0 al valor */
drawIn  1.1s .15s ease   /* la curva de despertares se dibuja */
popIn   .5s  ease both   /* puntos del scatter y del rango */
sheen   4s   infinite    /* brillo del bloque verde semanal */
```

---

# Móvil · las 5 pestañas

Iconos: Hoy `◐` · Leche `◍` · Datos `◔` · Tips `❏` · Equipo `◇`.

## 1 · Hoy — `01_TodayScreen.jsx`

La pantalla de las 3 de la mañana. Orden de lectura deliberado:

1. **Encabezado** — "Martes 28 jul" mono + "Hoy" serif 31px + avatares apilados (M violeta, L terracota, `margin-left: -13px`) con "niñera de turno".
2. **Próxima ventana** (tarjeta noche) — etiqueta lila `Próxima ventana` + "en 38 min" en mono ámbar; "Empezar a dormirlas **12:30**" 17px con la hora en mono; nota del plan en `#B9B2C9`.
3. **Bloques del plan** — uno por bloque de `planBlocks(p)`: despertar, N siestas, noche. Cada uno con dos celdas (Mía / Lía).
   - **Registrado**: borde `1px #E4DCD0`, celdas con fondo del bebé, hora en tinta, estado verde.
   - **Sugerido**: borde `1.5px #6B5DD3` + sombra violeta, celdas crema con borde punteado, hora en `#8A8299`.
   - El punto de color dice qué es: ámbar despertar, violeta siesta, `#2C2C52` noche.
4. **Tira de alimentación** — resumen del día, atajo a Leche.
5. **Notas de relevo** (ámbar) — lo que un cuidador le deja al siguiente. Es lo que hace que la app funcione en una casa con niñera.

## 2 · Leche — `02_MilkScreen.jsx`

La pantalla que ninguna app de sueño hace bien.

1. **Totales del día** (noche) — tomas, min al pecho, ml en biberón, ml extraídos + "última toma hace 2h10".
2. **Dos botones** — `＋ Toma` (noche) y `＋ Extracción` (borde violeta 1.5px). Alto mín. 48px.
3. **Filtro** — Las dos / Mía / Lía.
4. **Registro del día** — cronológico inverso. Icono por tipo (◍ pecho, ◑ biberón, ⬆ extracción), chip "de noche" en ámbar, cantidad a la derecha en mono.
5. **Extracción y banco** (borde violeta) — stock total, 3 cifras, barras pareadas de la semana (violeta = extraído, `#E8B694` = consumido) y el balance en prosa.
6. **Día vs. noche** — barra por bebé: violeta el día, `#2C2C52` la noche con la cifra en ámbar. Es la métrica que predice la noche.

## 3 · Datos — `03_AnalyticsScreen.jsx`

**Describe, no califica.** En orden:

1. **Mía vs. Lía** — 5 métricas con barras espejadas desde el centro; la que va mejor va en color pleno, la otra en el tono claro. Chip "Van parejas" (verde) o "Se están separando" (ámbar) según diferencia < 0,6. Cierra con el veredicto en prosa.
2. **Bloque verde semanal** — el ÚNICO momento celebratorio del producto. Degradado `150deg #2F7A5E → #3F7A62 → #4C8B6B`, círculo con brillo `sheen`, tres medallas. Siempre con datos y siempre atribuido a ellos.
3. **En qué seguir trabajando** (noche) — el hallazgo + ventana real vs. objetivo vs. despertares.
4. **Selector Mía / Lía.**
5. **Mapa de la semana** — 7 filas de 24 h desde las 6:00: noche `#2C2C52`, despierta `#F6EFE2`, siesta `#6B5DD3` con su duración encima, puntos ámbar de despertar. Tocar una fila abre el detalle del día.
6. **Despertares por noche** — área + curva violeta que se dibuja; punto **verde** = noche de 3 o menos.
7. **Ventana → despertares** — dispersión con línea de objetivo verde punteada; cada punto es una noche, con el color de su bebé.
8. **4 mini-KPIs** — latencia, siestas/día, duración media, tomas nocturnas, cada uno contra lo esperado a su edad.
9. **Patrón de descanso real** — punto sobre el rango esperado; verde dentro, ámbar fuera. Si llevan 5+ días por debajo aparece la bandera ámbar: **no alarmista, no diagnóstico, deriva al pediatra.** Abajo, cómo se durmieron las 14 noches.
10. **Qué está pesando en la noche** — los 4 factores principales. "Asociación, no causa. Se muestra un factor solo con 3+ noches registradas."
11. **Progreso vs. semana pasada** — barra fantasma + barra actual, valor anterior tachado.

## 4 · Tips — `04_TipsScreen.jsx`

**Recordatorios, NO un plan.** El plan siempre viene de la asesora — el pie lo dice y la tarjeta noche enlaza a Equipo.

- **Para hoy** (noche) — cambia según si la ventana ya se pasó del objetivo.
- **Portada**: rejilla de 5 temas + 3 destacados elegidos por los datos de la semana.
- **Detalle de tema**: acordeón. Abierto muestra el cuerpo, la caja crema "Cómo se hace" y —cuando aplica— **tu dato** en violeta mono ("Tu latencia media: 20 min").
- Un tip específico de su edad lleva borde y número violeta; los generales, gris.

## 5 · Equipo — `05_TeamScreen.jsx`

- **Lista de permisos** — Mamá/Papá Admin, Niñera Cuidadora, Carolina Asesora.
- **Vincular otra asesora** — abre el código.
- **Plan vigente v3** (noche) — **solo lectura**. Se edita desde el panel de la asesora.
- **Factores a vigilar** (ámbar) — dos propios del caso + el de la edad activa.

---

# Superposiciones

| Archivo | Qué es |
|---|---|
| `SleepLogSheet.jsx` | Registro de sueño. Horas, lugar, contacto, toma, humor, factores. **La tira violeta de latencia/durmió/ventana se recalcula en vivo** mientras mueve las horas: es lo que le enseña a leer sus propios datos. |
| `FeedLogSheet.jsx` | Toma o extracción, un componente con dos modos. La extracción muestra ml/min en vivo y explica qué significa cada destino. |
| `DayDetailSheet.jsx` | Los 12 tiempos exactos de una jornada, con veredicto verde o ámbar arriba. |
| `AdvisorCodeScreen.jsx` | Código de asesora (paso 4 de 5). CTA deshabilitado hasta validar. |
| `PaywallScreen.jsx` | Tras el 7º registro. Regala el primer insight real, desenfoca el resto (blur 4.5px + degradado), precios sin presión, y aclara que los registros siguen siendo gratis. |

---

# Escritorio · Caso — `CaseDashboard.jsx`

Izquierda = evidencia. Derecha = intervención.

- **Cabecera** — nombre + edad, chips de contexto (los de advertencia en ámbar) y 5 KPIs.
- **Día de ayer** — timeline de 24 h por bebé, con marcas coral de despertar y puntos verdes de toma.
- **Bitácora de 7 días** — 9 columnas; ventana y despertares se pintan coral cuando se salen.
- **Despertares por hora** — ámbar antes de medianoche (sobrecansancio), violeta después.
- **Tomas de leche** — 4 barras, cerrando con "tomas nocturnas que «le tocaban»".
- **Qué se asocia con más despertares** — la tabla completa de correlaciones.
- **Cumplimiento del plan** — % grande, barra de tres tramos, fila por umbral con ✓ / ~ / ✕, y la nota que distingue **problema de ejecución** de **problema de umbral**.
- **Plan** (noche) — el ÚNICO lugar donde se escribe. En edición, la pista de cada campo se pone **ámbar** si el umbral se sale de lo esperado para la edad. "Publicar v4" lo manda a la app de la familia.
- **Acompañamiento** — escalera de 5 escalones, 12 puntos de progreso, noche 5 de 12.
- **Hilo del caso** y **Contexto a vigilar**.

# Escritorio · Suscripción — `BillingDashboard.jsx`

- **Suscripción** (noche) — $49/mes Plan Consultorio, cupos 12 de 15 con barra ámbar, próximo cobro y método.
- **Link de invitación** (borde violeta) — el activo comercial: familia que entra por ahí usa la app gratis. Botón Copiar que confirma en verde.
- **Familias vinculadas** — filtro, 5 columnas, progreso de semana, despertares con semáforo. Las marcadas llevan degradado ámbar de izquierda a derecha.

---

## Checklist de aceptación

- [ ] Cambiar la edad recalcula plan del día, tomas esperadas, regresiones, rangos y tips.
- [ ] Bebé A violeta y Bebé B terracota en las 5 pestañas y en las 3 gráficas.
- [ ] Los bloques sugeridos tienen borde violeta 1.5px + sombra; los registrados, borde crema.
- [ ] La tira de derivados de la hoja de sueño cambia al mover las horas.
- [ ] Ningún factor aparece con menos de 3 noches.
- [ ] El plan es de solo lectura en la app de la familia.
- [ ] El paywall regala un insight real antes de pedir dinero.
- [ ] Ningún control mide menos de 44px de alto.
- [ ] No hay emoji en ninguna pantalla.
