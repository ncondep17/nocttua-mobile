/**
 * Piezas compartidas por las 10 pantallas del onboarding.
 * Valores tomados 1:1 del diseño aprobado (Noctua - Onboarding.dc.html, turno 2a).
 * NO redondear ni "normalizar" los tamaños: 15.5px, 13.5px y 12.5px son intencionales.
 */

/** Los cuatro fondos del flujo. Cada pantalla usa exactamente el que indica SPEC.md. */
export const BACKGROUNDS = {
  // 01 y 10 — resplandor ámbar desde abajo
  ambarAbajo: 'radial-gradient(120% 70% at 50% 108%, rgba(240,168,104,.24) 0%, rgba(240,168,104,0) 62%), linear-gradient(180deg,#16162B 0%,#22224A 56%,#332F5C 100%)',
  // 02, 03, 04, 07 — noche lisa
  noche: 'linear-gradient(180deg,#16162B 0%,#22224A 60%,#312D58 100%)',
  // 05 — resplandor ámbar desde arriba (la promesa)
  ambarArriba: 'radial-gradient(110% 60% at 50% 8%, rgba(240,168,104,.28) 0%, rgba(240,168,104,0) 58%), linear-gradient(180deg,#1A1A34 0%,#26264F 58%,#332F5C 100%)',
  // 06 — noche con corte más alto
  nocheAlta: 'linear-gradient(180deg,#16162B 0%,#23234B 58%,#332F5C 100%)',
  // 08 — resplandor violeta desde abajo
  violetaAbajo: 'radial-gradient(120% 65% at 50% 105%, rgba(167,159,224,.22) 0%, rgba(167,159,224,0) 62%), linear-gradient(180deg,#16162B 0%,#22224A 60%,#332F5C 100%)',
  // 09 — noche con corte al 62%
  nocheBaja: 'linear-gradient(180deg,#16162B 0%,#23234B 62%,#332F5C 100%)',
};

/**
 * PhoneFrame — SOLO para revisar el diseño en web.
 * En la app nativa no existe: la pantalla ocupa el dispositivo completo.
 * Marco 340×700, bisel 9px, radio exterior 44, radio interior 36.
 */
export function PhoneFrame({ children }) {
  return (
    <div className="h-[700px] w-[340px] shrink-0 rounded-[44px] bg-[#16162B] p-[9px] shadow-[0_34px_70px_-24px_rgba(22,22,43,.5)]">
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[36px]">{children}</div>
    </div>
  );
}

/** Lienzo de una pantalla: aplica el fondo y contiene la barra de estado. */
export function NightCanvas({ background = BACKGROUNDS.noche, children }) {
  return (
    <div style={{ background }} className="relative flex h-full w-full flex-col overflow-hidden rounded-[36px]">
      {children}
    </div>
  );
}

/** Barra de estado simulada. En producción la dibuja el sistema operativo. */
export function StatusBar({ color = '#B9B2C9' }) {
  return (
    <div style={{ color }} className="flex justify-between px-[22px] pt-[14px] font-mono text-[12px]">
      <span>9:41</span><span>◆ ◆</span>
    </div>
  );
}

/** Cabecera de paso: etiqueta ámbar en versalitas + "Saltar". */
export function StepHeader({ label, onSkip }) {
  return (
    <div className="flex items-center justify-between px-[24px] pt-[18px]">
      <span className="font-mono text-[11px] uppercase tracking-[.12em] text-[#F0A868]">{label}</span>
      <button type="button" onClick={onSkip} className="text-[13.5px] text-[#B9B2C9]">Saltar</button>
    </div>
  );
}

/** Paginador de 5 puntos: el activo mide 22×4, los demás 6×4. */
export function Dots({ active, total = 5 }) {
  return (
    <div className="flex gap-[6px]">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{ width: i === active ? 22 : 6 }} className={['h-[4px] rounded-[99px]', i === active ? 'bg-[#FBF7F0]' : 'bg-[#4A4A7A]'].join(' ')} />
      ))}
    </div>
  );
}

/** Pie de las pantallas paginadas: puntos a la izquierda, pastilla violeta a la derecha. */
export function StepFooter({ active, onNext, label = 'Seguir' }) {
  return (
    <div className="flex items-center justify-between">
      <Dots active={active} />
      <button type="button" onClick={onNext} className="rounded-[99px] bg-[#6B5DD3] px-[26px] py-[13px] text-[15px] font-medium text-[#FBF7F0]">{label}</button>
    </div>
  );
}

/** Titular + párrafo. El titular SIEMPRE en Instrument Serif 400. */
export function Headline({ title, body, size = 33, gap = 13, bodySize = 15 }) {
  return (
    <div style={{ gap }} className="flex flex-col">
      <h2 style={{ fontSize: size, lineHeight: 1.1 }} className="m-0 font-display-app font-normal text-[#FBF7F0] [text-wrap:pretty]">{title}</h2>
      {body ? <p style={{ fontSize: bodySize }} className="m-0 leading-[1.6] text-[#D6D0E4] [text-wrap:pretty]">{body}</p> : null}
    </div>
  );
}

/** Tarjeta de vidrio: el contenedor de demo dentro de las pantallas noche. */
export function GlassCard({ radius = 20, padding = 17, gap = 12, children, className = '' }) {
  return (
    <div style={{ borderRadius: radius, padding, gap }} className={['flex flex-col border border-[#4A4A7A] bg-[rgba(251,247,240,.07)]', className].join(' ')}>
      {children}
    </div>
  );
}

/** Botón crema de ancho completo (acción principal fuera de las pantallas paginadas). */
export function CreamButton({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} className="rounded-[14px] bg-[#FBF7F0] px-[16px] py-[16px] text-center text-[16px] font-medium text-[#16162B]">{children}</button>
  );
}

/** Estrella titilante decorativa. Posición absoluta dictada por cada pantalla. */
export function Twinkle({ top, left, right, size = 12, color = '#F0A868', duration = 4 }) {
  return (
    <div style={{ top, left, right, fontSize: size, color, animation: 'twinkle ' + duration + 's ease-in-out infinite' }} className="absolute">✦</div>
  );
}
