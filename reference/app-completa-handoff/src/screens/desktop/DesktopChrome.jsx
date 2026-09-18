/** Cáscara de ventana del navegador. Solo para presentar la vista web. */
export function BrowserWindow({ url, children }) {
  return (
    <div style={{ boxShadow: '0 24px 60px -30px rgba(22,22,43,.4)' }}
      className="w-full max-w-[1320px] overflow-hidden rounded-[20px] border border-[#DCD4C8] bg-[#FBF7F0]">
      <div className="flex items-center gap-[10px] border-b border-[#E4DCD0] bg-white px-[18px] py-[12px]">
        <span className="h-[11px] w-[11px] rounded-[99px] bg-[#E4DCD0]" />
        <span className="h-[11px] w-[11px] rounded-[99px] bg-[#E4DCD0]" />
        <span className="h-[11px] w-[11px] rounded-[99px] bg-[#E4DCD0]" />
        <span className="ml-[14px] font-mono text-[12px] text-[#8A8299]">{url}</span>
      </div>
      <div className="flex flex-col gap-[22px] px-[32px] pb-[38px] pt-[28px]">{children}</div>
    </div>
  );
}

/** Tarjeta de panel: radio 18, padding 20/22. Más aire que en móvil. */
export function Panel({ children, className = '', bg = '#FFFFFF', border = '#E4DCD0', gap = 14 }) {
  return (
    <div style={{ background: bg, border: '1px solid ' + border, borderRadius: 18, padding: '20px 22px', gap }}
      className={'flex flex-col ' + className}>{children}</div>
  );
}

export function PanelTitle({ children, right }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-[12px]">
      <span className="text-[18px] font-medium text-[#16162B]">{children}</span>
      {right}
    </div>
  );
}
