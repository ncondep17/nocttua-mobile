/**
 * Primitivas del sistema, con los valores EXACTOS del prototipo.
 * Los tamaños raros (14.5px, 12.5px, 15.5px, 10.5px) son intencionales:
 * no los redondees a la escala de Tailwind.
 */

/** Etiqueta mono en versalitas. El recurso tipográfico de la marca. */
export function Eyebrow({ tone = 'muted', size = 11, tracking = '.1em', children, className = '' }) {
  const tones = { muted: '#8A8299', amber: '#F0A868', lilac: '#A79FE0', brown: '#B08A55', faint: '#A9A2B5', violet: '#6B5DD3' };
  return (
    <span style={{ fontSize: size, letterSpacing: tracking, color: tones[tone] || tone }}
      className={'font-mono uppercase ' + className}>{children}</span>
  );
}

/** Encabezado de pantalla móvil: fecha mono + titular Instrument Serif 31px. */
export function ScreenTitle({ eyebrow, title, action }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <div className="font-display-app text-[31px] leading-[1.1] text-[#16162B]">{title}</div>
      </div>
      {action}
    </div>
  );
}

/** Tarjeta blanca estándar: borde #E4DCD0, radio 16, padding 14/15. */
export function Card({ children, className = '', onClick, border = '#E4DCD0', bg = '#FFFFFF', radius = 16, pad = '14px 15px', style }) {
  return (
    <div onClick={onClick} style={{ background: bg, border: '1px solid ' + border, borderRadius: radius, padding: pad, ...style }}
      className={'flex flex-col gap-[11px]' + (onClick ? ' cursor-pointer' : '') + ' ' + className}>{children}</div>
  );
}

/** Tarjeta noche: el bloque que corona cada pantalla con lo importante. */
export function NightCard({ children, className = '', radius = 16, pad = '14px 16px' }) {
  return <div style={{ background: '#16162B', borderRadius: radius, padding: pad }} className={'flex flex-col gap-[9px] ' + className}>{children}</div>;
}

/** Título de tarjeta: 16px/500. */
export function CardTitle({ children, right }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[16px] font-medium text-[#16162B]">{children}</span>
      {right ? <span className="text-[12.5px] text-[#8A8299]">{right}</span> : null}
    </div>
  );
}

/** Separador de sección: etiqueta mono + filete que ocupa el resto del ancho. */
export function SectionRule({ children, onClick }) {
  return (
    <div onClick={onClick} className={'mt-[2px] flex items-center gap-[9px]' + (onClick ? ' cursor-pointer' : '')}>
      <Eyebrow>{children}</Eyebrow>
      <div className="h-px flex-1 bg-[#DCD4C8]" />
    </div>
  );
}

/**
 * Chip. Dos estados exactos del prototipo (CHIP_OFF / CHIP_ON):
 * apagado crema con borde, encendido noche pleno. Alto mínimo 40px.
 */
export function Chip({ selected, onClick, children }) {
  return (
    <span onClick={onClick}
      style={{
        padding: '9px 13px', borderRadius: 99, fontSize: '14.5px', minHeight: 40,
        background: selected ? '#16162B' : '#FBF7F0',
        border: '1px solid ' + (selected ? '#16162B' : '#DCD4C8'),
        color: selected ? '#FBF7F0' : '#4A4459',
      }}
      className="grid cursor-pointer place-items-center">{children}</span>
  );
}

/** Pestañas segmentadas sobre el hueco crema hundido. */
export function SegTabs({ items, active, onSelect, radius = 11, pad = 4 }) {
  return (
    <div style={{ background: '#EFE9DF', borderRadius: radius, padding: pad }} className="flex gap-[5px]">
      {items.map(it => {
        const on = active === it.id;
        return (
          <div key={it.id} onClick={() => onSelect && onSelect(it.id)}
            style={{
              flex: 1, padding: 8, textAlign: 'center', borderRadius: 8, fontSize: '14.5px', cursor: 'pointer',
              background: on ? '#FFFFFF' : 'transparent', color: on ? '#16162B' : '#8A8299',
              fontWeight: on ? 500 : 400, boxShadow: on ? '0 1px 3px rgba(22,22,43,.12)' : 'none',
            }}>{it.label}</div>
        );
      })}
    </div>
  );
}

/**
 * Stepper de hora / cantidad: −  valor  ＋.
 * El control firma de Nocttua: se usa con una mano y sin teclado, de madrugada.
 * Cajas de 34px, radio 10, valor en mono 21px con ancho mínimo para que no salte.
 */
export function Stepper({ label, value, onDec, onInc, minW = 62 }) {
  const btn = { width: 34, height: 34, borderRadius: 10, border: '1px solid #DCD4C8', fontSize: 16, color: '#4A4459' };
  return (
    <div className="flex items-center justify-between">
      <span className="text-[15.5px] text-[#4A4459]">{label}</span>
      <div className="flex items-center gap-[10px]">
        <span onClick={onDec} style={btn} className="grid cursor-pointer place-items-center">−</span>
        <span style={{ minWidth: minW }} className="text-center font-mono text-[21px] text-[#16162B]">{value}</span>
        <span onClick={onInc} style={btn} className="grid cursor-pointer place-items-center">＋</span>
      </div>
    </div>
  );
}

/** Stepper compacto en columna, para las dos cajas de la extracción. */
export function StepperBox({ label, value, onDec, onInc }) {
  const btn = { width: 30, height: 30, borderRadius: 9, background: '#FBF7F0', fontSize: 15, color: '#4A4459' };
  return (
    <div className="flex flex-1 flex-col gap-[7px]">
      <span className="text-[13px] text-[#8A8299]">{label}</span>
      <div className="flex items-center gap-[7px] rounded-[12px] border border-[#DCD4C8] px-[8px] py-[6px]">
        <span onClick={onDec} style={btn} className="grid cursor-pointer place-items-center">−</span>
        <span className="flex-1 text-center font-mono text-[17px] text-[#16162B]">{value}</span>
        <span onClick={onInc} style={btn} className="grid cursor-pointer place-items-center">＋</span>
      </div>
    </div>
  );
}

/**
 * Interruptor. Track 48×29, perilla 23px.
 * tone 'violet' para «le tocaba», 'coral' para «se durmió durante la toma»:
 * el color dice si el dato es neutro o si es una señal a vigilar.
 */
export function Toggle({ checked, onChange, tone = 'violet' }) {
  const on = tone === 'coral' ? '#D9705A' : '#6B5DD3';
  return (
    <div onClick={onChange}
      style={{ width: 48, height: 29, borderRadius: 99, padding: 3, background: checked ? on : '#DCD4C8', justifyContent: checked ? 'flex-end' : 'flex-start' }}
      className="flex cursor-pointer">
      <div style={{ width: 23, height: 23, borderRadius: 99, background: '#FFFFFF' }} />
    </div>
  );
}

/** Fila etiqueta + interruptor, con subtítulo opcional en dos líneas. */
export function ToggleRow({ label, hint, checked, onChange, tone, boxed = false }) {
  const inner = (
    <>
      <span className="text-[14.5px] leading-[1.3] text-[#4A4459]">
        {label}{hint ? <><br /><span className="text-[12px] text-[#8A8299]">{hint}</span></> : null}
      </span>
      <Toggle checked={checked} onChange={onChange} tone={tone} />
    </>
  );
  if (!boxed) return <div className="flex items-center justify-between">{inner}</div>;
  return <div className="flex items-center justify-between rounded-[12px] border border-[#C9C1D8] bg-[#F6F1FB] px-[13px] py-[11px]">{inner}</div>;
}

/** Botón noche de ancho completo. Alto mínimo 50px. */
export function PrimaryButton({ children, onClick, minH = 50, className = '' }) {
  return (
    <div onClick={onClick} style={{ minHeight: minH }}
      className={'grid cursor-pointer place-items-center rounded-[13px] bg-[#16162B] text-[16.5px] font-medium text-[#FBF7F0] ' + className}>{children}</div>
  );
}

/** Botón secundario de borde. */
export function GhostButton({ children, onClick, minH = 50, className = '' }) {
  return (
    <div onClick={onClick} style={{ minHeight: minH }}
      className={'grid cursor-pointer place-items-center rounded-[13px] border border-[#DCD4C8] px-[15px] text-center text-[14.5px] text-[#4A4459] ' + className}>{children}</div>
  );
}

/** Barra etiqueta + valor + progreso. El gráfico más repetido del producto. */
export function MetricBar({ label, value, pct, color = '#6B5DD3', caption, valueSize = 15 }) {
  return (
    <div className="flex flex-col gap-[5px]">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[14px] leading-[1.3] text-[#16162B]">{label}</span>
        <span style={{ color, fontSize: valueSize }} className="text-right font-mono">{value}</span>
      </div>
      <div className="h-[9px] rounded-[99px] bg-[#F3EEE6]">
        <div style={{ width: Math.min(100, pct) + '%', background: color }} className="h-full animate-growW rounded-[99px]" />
      </div>
      {caption ? <span className="text-[11.5px] text-[#A9A2B5]">{caption}</span> : null}
    </div>
  );
}

/** Cifra + etiqueta, la unidad de los bloques de KPIs. */
export function Stat({ value, label, tone = '#FBF7F0', labelTone = '#8E87B5', size = 19 }) {
  return (
    <div>
      <div style={{ fontSize: size, color: tone }} className="font-mono">{value}</div>
      <div style={{ color: labelTone }} className="text-[12px]">{label}</div>
    </div>
  );
}

/** Leyenda de color: cuadrito (o punto) + texto. */
export function Legend({ items, size = '11.5px' }) {
  return (
    <div style={{ fontSize: size }} className="flex flex-wrap gap-[12px] text-[#8A8299]">
      {items.map(it => (
        <span key={it.label} className="flex items-center gap-[5px]">
          <span style={{ width: it.dot ? 7 : 9, height: it.dot ? 7 : 9, borderRadius: it.dot ? 99 : 3, background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

/** Avatar circular con inicial. */
export function Avatar({ initial, bg, fg, size = 32, weight = 700, fontSize = '12.5px' }) {
  return (
    <span style={{ width: size, height: size, borderRadius: 99, background: bg, color: fg, fontSize, fontWeight: weight }}
      className="grid shrink-0 place-items-center">{initial}</span>
  );
}
