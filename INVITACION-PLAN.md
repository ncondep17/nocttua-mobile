# Plan · invitación por WhatsApp + permisos por área

Adaptación de `ESPEC-INVITACION-WHATSAPP.md`/`ESPEC-VINCULACION.md` al código **real** (no al
prototipo de referencia que describen). Este doc es la fuente de verdad de *qué vamos a
construir y en qué orden* — no implementa nada todavía.

## Lo que YA existe y funciona (auditado 2026-10-19)

- `family_invites` (Supabase real): código de un solo uso, por invitación (no fijo por
  asesora), se genera random en `create_invite()`, queda vinculado a `family_id` +
  `permission_level` propuesto.
- `createInvite(level)` → RPC `create_invite`, código real de 6 caracteres.
- `05_CareScreen.jsx` → "＋ Invitar cuidador o asesora" → elige nivel (`ACCESS_LEVELS`) →
  genera código → se muestra en una hoja con botón **"Compartir"** que ya usa
  `Share.share()` (el share sheet nativo de iOS/Android — WhatsApp ya aparece ahí si está
  instalado). Hoy el mensaje es solo texto con el código, sin link clicable.
- `redeemAdvisorInvite(code)` / flujo de "Tengo un código" ya canjea contra família existente.
- `permission_level`: un solo enum compartido (`full`/`reports`/`plan`/`none`) en
  `family_members` y `family_invites` — **no** hay permisos por área todavía.

## Lo que pide el spec nuevo, y qué le falta a lo real para llegar

| Pieza del spec | Estado real | Esfuerzo |
|---|---|---|
| Generar código de un solo uso | ✅ Ya existe | — |
| Compartir por WhatsApp | ✅ Ya existe (share sheet nativo) | — |
| **Link clicable** (`nocttua.com/i/{CODE}`) que abre la app sola | ❌ No existe | Medio |
| Página web para quien no tiene la app | ❌ No existe | Medio (reusa Hostinger, mismo patrón que `qa.`/`coach.`) |
| Universal Links (iOS) / App Links (Android) | ❌ No existe | **Alto** — requiere nuevo build nativo (entitlement nuevo, no sale por OTA) |
| Deferred deep link (recuperar el código tras instalar) | ❌ No existe | Alto si se hace con matching por servidor; bajo si es solo "pegar código" en iOS |
| Permisos **por área** (sueño/tomas/lactancia/medicinas/notas/bebés, cada uno edita/ve/nada) | ❌ No existe — hoy es un solo nivel para todo | **Muy alto** — toca el modelo de seguridad (RLS) de toda la app |

## Por qué no sigo el spec al pie de la letra

El spec asume `shared/store.js` con tablas `Invite`/`Link` genéricas — eso es el prototipo de
diseño (`reference/`), no la app real. La app real ya resuelve el 80% del problema (código real,
de un uso, compartible) con Supabase. Construir un store paralelo sería duplicar lo que ya
funciona y probamos esta sesión.

## Orden recomendado (3 proyectos separados, no uno solo)

**1. Link clicable + página web — el que más valor da más rápido**
   - `nocttua.com/i/{CODE}`: página estática (mismo patrón que `privacidad`/`soporte`), con
     Open Graph para la vista previa de WhatsApp, botón a App Store, y copia el código al
     portapapeles antes de redirigir.
   - Cambiar el mensaje de `Share.share()` para incluir el link en vez de (o además de) el
     código pelado.
   - **Universal Links real** (abrir la app sola si ya la tiene) necesita agregar
     `associatedDomains: ["applinks:nocttua.com"]` en `app.json` + el archivo
     `apple-app-site-association` en el dominio → esto es un **entitlement nuevo**, no se
     puede mandar por una actualización normal: necesita un build nuevo y pasar por review
     de Apple otra vez. Dado que hoy estamos justo subiendo la primera versión, sugiero
     meterlo en la **próxima** versión, no en esta.
   - Sin Universal Links, el link igual sirve: abre la página web, la persona instala o abre
     la app, y pega el código a mano (ver punto 2) — un paso más, pero funciona ya.

**2. "Pegar mi código" en vez de escribirlo — el fallback de iOS sin servidor**
   - En la pantalla de código manual (`AdvisorCodeScreen`/el "Tengo un código"), detectar si
     el portapapeles tiene algo con forma de código y ofrecer un botón "Pegar" en vez de
     tipear. Cubre el caso "instaló la app después de tocar el link" sin necesitar Branch/
     AppsFlyer ni un endpoint de matching por IP — eso lo dejaría afuera del v1 por el costo
     (nueva dependencia + hay que tocar la política de privacidad que ya armamos).

**3. Permisos por área — proyecto aparte, el más grande**
   - Migración: `family_members`/`family_invites` suman una columna (`area_permissions
     jsonb`) con los 6 valores edita/ve/nada del spec §8, con defaults por rol.
   - Reescribir las funciones de RLS (`is_family_member`, `has_full_access`, etc.) para leer
     por área en vez del enum único — esto es el corazón de la seguridad de la app, necesita
     su propio diseño y pruebas, no lo metería en el mismo sprint que el link de WhatsApp.
   - UI: picker de permisos por área al invitar (mobile), ocultar pantallas/datos de
     lactancia para cuidador/asesora en ambas apps, panel de acceso en Coach.
   - Recomendación: diseñarlo cuando el punto 1 y 2 ya estén en producción y probados —
     tocar el modelo de permisos mientras hay una versión recién subida a review es más
     riesgo del necesario.

## Pendiente de vos antes de arrancar el punto 1
- Confirmar que `nocttua.com` (no un subdominio) es donde debe vivir `/i/{CODE}` — ya tenés
  `coach.`/`qa.` ahí, así que el dominio raíz debería estar libre para esto.
- Confirmar el App Store ID real una vez que la app esté aprobada (lo necesita la página para
  el botón "Descargar").
