import { Eyebrow } from './primitives';

/**
 * Marco del teléfono: 402×856, bisel 11px, radio exterior 44, interior 34.
 * Solo para revisar el diseño en web — en nativo la pantalla ocupa el dispositivo.
 */
export function PhoneFrame({ children }) {
  return (
    <div style={{ width: 402, height: 856, background: '#16162B', borderRadius: 44, padding: 11, boxShadow: '0 34px 70px -24px rgba(22,22,43,.5)' }}>
      <div style={{ borderRadius: 34, background: '#FBF7F0' }} className="relative flex h-full w-full flex-col overflow-hidden">{children}</div>
    </div>
  );
}

/** Barra de estado simulada. En producción la dibuja el sistema operativo. */
export function StatusBar({ clock }) {
  return (
    <div className="flex shrink-0 items-center justify-between px-[28px] pb-[2px] pt-[14px] font-mono text-[13px] text-[#16162B]">
      <span>{clock}</span><span>􀙨 􀋨</span>
    </div>
  );
}

/** Cuerpo scrolleable de una pantalla: padding 12/20/18, gap propio de cada una. */
export function ScreenBody({ gap = 12, children }) {
  return <div style={{ gap, padding: '12px 20px 18px' }} className="flex flex-col">{children}</div>;
}

/**
 * Barra de pestañas. 5 pestañas, ancho mínimo 56px por toque.
 * Iconos geométricos, nunca emoji.
 */
export const TABS = [
  { id: 'hoy', label: 'Sueño', icon: '◐' },
  { id: 'leche', label: 'Leche', icon: '◍' },
  { id: 'analitica', label: 'Datos', icon: '◔' },
  { id: 'guia', label: 'Tips', icon: '❏' },
  { id: 'equipo', label: 'Cuidado', icon: '◇' },
];

export function TabBar({ active, onSelect }) {
  return (
    <div className="flex shrink-0 justify-between border-t border-[#E4DCD0] bg-[#FBF7F0] px-[20px] pb-[20px] pt-[9px]">
      {TABS.map(t => {
        const on = active === t.id;
        return (
          <div key={t.id} onClick={() => onSelect(t.id)}
            style={{ minWidth: 56, color: on ? '#16162B' : '#A9A2B5', fontWeight: on ? 500 : 400 }}
            className="flex cursor-pointer flex-col items-center gap-[3px]">
            <span className="text-[19px]">{t.icon}</span>
            <span className="text-[11.5px]">{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Hoja inferior. Radio compuesto 24 24 34 34 — el de abajo sigue la curva del
 * teléfono. El velo cierra al tocar; la botonera queda pegada al fondo.
 */
export function Sheet({ open, title, onClose, children, footer, maxH = '90%' }) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end bg-[rgba(22,22,43,.35)]">
      <div onClick={onClose} className="flex-1" />
      <div style={{ borderRadius: '24px 24px 34px 34px', maxHeight: maxH, padding: '10px 20px 22px' }}
        className="no-bars flex flex-col gap-[13px] overflow-auto bg-white">
        <div className="mx-auto h-[4px] w-[40px] shrink-0 rounded-[99px] bg-[#DCD4C8]" />
        {title ? (
          <div className="flex shrink-0 items-baseline justify-between">
            <span className="text-[19px] font-medium text-[#16162B]">{title}</span>
            <span onClick={onClose} className="cursor-pointer text-[15px] text-[#8A8299]">Cerrar</span>
          </div>
        ) : null}
        {children}
        {footer ? (
          <div style={{ padding: '10px 0 22px', margin: '-10px 0 -22px', bottom: -22 }}
            className="sticky z-[2] flex shrink-0 gap-[9px] bg-white">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

/** Toast: flota sobre la TabBar, nunca la tapa. */
export function Toast({ children }) {
  if (!children) return null;
  return (
    <div style={{ boxShadow: '0 16px 34px -14px rgba(22,22,43,.6)' }}
      className="absolute bottom-[96px] left-[20px] right-[20px] z-40 rounded-[13px] bg-[#16162B] px-[15px] py-[13px] text-[14.5px] leading-[1.4] text-[#FBF7F0]">{children}</div>
  );
}

/** Pantalla completa superpuesta (código de asesora, paywall). */
export function FullScreen({ children }) {
  return <div className="absolute inset-0 z-30 flex flex-col bg-[#FBF7F0]">{children}</div>;
}

export { Eyebrow };
