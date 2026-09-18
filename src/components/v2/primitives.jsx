import { View, Text, Pressable } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { theme } from '@nocttua/theme/native';
import { useHoldRepeat } from '../../lib/useHoldRepeat';

/**
 * Primitivas del paquete de diseño "app-completa-handoff", portadas con los
 * valores EXACTOS del prototipo. Los tamaños no redondeados (14.5, 12.5,
 * 15.5, 10.5...) son intencionales — no se ajustan a la escala de tokens.
 * Viven aparte de src/components/core para no romper Ajustes/onboarding,
 * que siguen con el sistema anterior.
 */

const TONES = { muted: '#8A8299', amber: '#F0A868', lilac: '#A79FE0', brown: '#B08A55', faint: '#A9A2B5', violet: '#6B5DD3' };

/** Etiqueta mono en versalitas. El recurso tipográfico de la marca. */
export function Eyebrow({ tone = 'muted', size = 11, tracking = 1.1, children }) {
  const color = TONES[tone] || tone;
  return (
    <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: size, letterSpacing: tracking, textTransform: 'uppercase', color }}>
      {children}
    </Text>
  );
}

/** Encabezado de pantalla móvil: fecha mono + titular Instrument Serif 31px. */
export function ScreenTitle({ eyebrow, title, action }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
      <View>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 31, lineHeight: 31 * 1.1, color: '#16162B' }}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

/** Tarjeta blanca estándar: borde #E4DCD0, radio 16, padding 14/15. */
export function Card({ children, onPress, border = '#E4DCD0', bg = '#FFFFFF', radius = 16, style }) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} style={[{ backgroundColor: bg, borderWidth: 1, borderColor: border, borderRadius: radius, padding: 14, gap: 11 }, style]}>
      {children}
    </Wrapper>
  );
}

/** Tarjeta noche: el bloque que corona cada pantalla con lo importante. */
export function NightCard({ children, radius = 16, style }) {
  return <View style={[{ backgroundColor: '#16162B', borderRadius: radius, padding: 14, gap: 9 }, style]}>{children}</View>;
}

/** Título de tarjeta: 16px/500. */
export function CardTitle({ children, right }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
      <Text style={{ fontSize: 16, fontFamily: theme.fontFamily.uiAppMedium, fontWeight: '500', color: '#16162B' }}>{children}</Text>
      {right ? <Text style={{ fontSize: 12.5, color: '#8A8299' }}>{right}</Text> : null}
    </View>
  );
}

/** Separador de sección: etiqueta mono + filete que ocupa el resto del ancho. */
export function SectionRule({ children, onPress }) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} style={{ marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: 9 }}>
      <Eyebrow>{children}</Eyebrow>
      <View style={{ height: 1, flex: 1, backgroundColor: '#DCD4C8' }} />
    </Wrapper>
  );
}

/**
 * Chip de las hojas de registro (Sueño/Toma/Extracción/Pañal) — rectángulo
 * redondeado, sin borde, el contraste lo da el relleno. Portado del handoff
 * (`08-hoja-toma.png`/`09-hoja-extraccion.png`): antes era una píldora
 * (radio 99) con borde beige, que se leía más liviana de lo que pide el
 * diseño.
 */
export function Chip({ selected, onPress, children }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 15, borderRadius: 12, minHeight: 46, alignItems: 'center', justifyContent: 'center',
        backgroundColor: selected ? '#16162B' : '#EFE9DF',
      }}
    >
      <Text style={{ fontSize: 14.5, color: selected ? '#FBF7F0' : '#4A4459' }}>{children}</Text>
    </Pressable>
  );
}

/**
 * Etiqueta de grupo dentro de una hoja de registro — DM Mono 9,5 px,
 * letter-spacing .14em, siempre `#8A8299`. Separada de `Eyebrow` (que sigue
 * sirviendo para cabeceras de pantalla con otros tamaños) para que estas
 * cuatro hojas no varíen entre sí como pasaba antes.
 */
export function GroupLabel({ children }) {
  return (
    <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 9.5, letterSpacing: 1.33, textTransform: 'uppercase', color: '#8A8299' }}>
      {children}
    </Text>
  );
}

/** Pestañas segmentadas sobre el hueco crema hundido. */
export function SegTabs({ items, active, onSelect, radius = 11, pad = 4 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 5, backgroundColor: '#EFE9DF', borderRadius: radius, padding: pad }}>
      {items.map((it) => {
        const on = active === it.id;
        return (
          <Pressable
            key={String(it.id)}
            onPress={() => onSelect && onSelect(it.id)}
            style={[
              { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: on ? '#FFFFFF' : 'transparent' },
              on ? theme.elevation.card : null,
            ]}
          >
            <Text style={{ fontSize: 14.5, color: on ? '#16162B' : '#8A8299', fontFamily: on ? theme.fontFamily.uiAppMedium : theme.fontFamily.uiApp, fontWeight: on ? '500' : '400' }}>
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Selector ml/oz — para cantidades de leche, la mayoría mide en onzas. */
/** Chips ml/oz — mismo look que Chip (09-hoja-extraccion.png), no un toggle compacto. */
export function UnitToggle({ unit, onChange }) {
  return (
    <View style={{ flexDirection: 'row', gap: 7 }}>
      {['ml', 'oz'].map((u) => <Chip key={u} selected={unit === u} onPress={() => onChange(u)}>{u}</Chip>)}
    </View>
  );
}

/** Stepper de hora / cantidad: −  valor  ＋. Cajas de 34px, valor en mono 21px. */
export function Stepper({ label, value, onDec, onInc, minW = 62 }) {
  const btnStyle = { width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: '#DCD4C8', alignItems: 'center', justifyContent: 'center' };
  const dec = useHoldRepeat(onDec);
  const inc = useHoldRepeat(onInc);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 15.5, color: '#4A4459' }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable {...dec} style={btnStyle}><Text style={{ fontSize: 16, color: '#4A4459' }}>−</Text></Pressable>
        <Text style={{ minWidth: minW, textAlign: 'center', fontFamily: theme.fontFamily.mono, fontSize: 21, color: '#16162B' }}>{value}</Text>
        <Pressable {...inc} style={btnStyle}><Text style={{ fontSize: 16, color: '#4A4459' }}>＋</Text></Pressable>
      </View>
    </View>
  );
}

/**
 * Hora grande con stepper de minutos (10-hoja-sueno.png / hoja "Cerrar la
 * noche"): elegir una hora en pasos de 5 min sin abrir el selector nativo.
 * El conteo vive afuera (onDec/onInc corren sobre el estado del caller) —
 * este componente solo la muestra.
 */
export function TimeStepper({ value, onDec, onInc, size = 32 }) {
  const btnStyle = { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: '#DCD4C8', alignItems: 'center', justifyContent: 'center' };
  const dec = useHoldRepeat(onDec);
  const inc = useHoldRepeat(onInc);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <Pressable {...dec} style={btnStyle}><Text style={{ fontSize: 18, color: '#4A4459' }}>−</Text></Pressable>
      <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: size, color: '#16162B', minWidth: size * 2.2, textAlign: 'center' }}>{value}</Text>
      <Pressable {...inc} style={btnStyle}><Text style={{ fontSize: 18, color: '#4A4459' }}>＋</Text></Pressable>
    </View>
  );
}

/** Stepper compacto en columna, para las dos cajas de la extracción. */
export function StepperBox({ label, value, onDec, onInc }) {
  const btnStyle = { width: 30, height: 30, borderRadius: 9, backgroundColor: '#FBF7F0', alignItems: 'center', justifyContent: 'center' };
  const dec = useHoldRepeat(onDec);
  const inc = useHoldRepeat(onInc);
  return (
    <View style={{ flex: 1, gap: 7 }}>
      <Text style={{ fontSize: 13, color: '#8A8299' }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 12, borderWidth: 1, borderColor: '#DCD4C8', paddingHorizontal: 8, paddingVertical: 6 }}>
        <Pressable {...dec} style={btnStyle}><Text style={{ fontSize: 15, color: '#4A4459' }}>−</Text></Pressable>
        <Text style={{ flex: 1, textAlign: 'center', fontFamily: theme.fontFamily.mono, fontSize: 17, color: '#16162B' }}>{value}</Text>
        <Pressable {...inc} style={btnStyle}><Text style={{ fontSize: 15, color: '#4A4459' }}>＋</Text></Pressable>
      </View>
    </View>
  );
}

/** Interruptor. Track 48×29, perilla 23px. tone 'coral' para señales a vigilar. */
export function Toggle({ checked, onChange, tone = 'violet' }) {
  const on = tone === 'coral' ? '#D9705A' : '#6B5DD3';
  return (
    <Pressable
      onPress={onChange}
      style={{ width: 48, height: 29, borderRadius: 99, padding: 3, backgroundColor: checked ? on : '#DCD4C8', justifyContent: 'center', alignItems: checked ? 'flex-end' : 'flex-start' }}
    >
      <View style={{ width: 23, height: 23, borderRadius: 99, backgroundColor: '#FFFFFF' }} />
    </Pressable>
  );
}

/** Fila etiqueta + interruptor, con subtítulo opcional en dos líneas. */
export function ToggleRow({ label, hint, checked, onChange, tone, boxed = false }) {
  const inner = (
    <>
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={{ fontSize: 14.5, lineHeight: 14.5 * 1.3, color: '#4A4459' }}>{label}</Text>
        {hint ? <Text style={{ fontSize: 12, color: '#8A8299' }}>{hint}</Text> : null}
      </View>
      <Toggle checked={checked} onChange={onChange} tone={tone} />
    </>
  );
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
        boxed ? { borderRadius: 12, borderWidth: 1, borderColor: '#C9C1D8', backgroundColor: '#F6F1FB', paddingHorizontal: 13, paddingVertical: 11 } : null,
      ]}
    >
      {inner}
    </View>
  );
}

/** Botón noche de ancho completo. Alto mínimo 50px. */
export function PrimaryButton({ children, onPress, minH = 50, style, disabled }) {
  return (
    <Pressable onPress={disabled ? undefined : onPress} style={[{ minHeight: minH, borderRadius: 13, backgroundColor: disabled ? '#E4DCD0' : '#16162B', alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text style={{ fontSize: 16.5, fontFamily: theme.fontFamily.uiAppMedium, fontWeight: '500', color: disabled ? '#8A8299' : '#FBF7F0', textAlign: 'center' }}>{children}</Text>
    </Pressable>
  );
}

/** Botón secundario de borde. */
export function GhostButton({ children, onPress, minH = 50, style }) {
  return (
    <Pressable onPress={onPress} style={[{ minHeight: minH, borderRadius: 13, borderWidth: 1, borderColor: '#DCD4C8', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15 }, style]}>
      <Text style={{ fontSize: 14.5, color: '#4A4459', textAlign: 'center' }}>{children}</Text>
    </Pressable>
  );
}

/** Botón de acción destructiva (borrar/quitar/retirar): borde y fondo, nunca solo texto de color. */
export function DangerButton({ children, onPress, disabled, minH = 44, style }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[
        { minHeight: minH, borderRadius: 13, borderWidth: 1, borderColor: '#E3A6A6', backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      <Text style={{ fontSize: 14.5, fontWeight: '500', color: '#C25F45', textAlign: 'center' }}>{children}</Text>
    </Pressable>
  );
}

/** Barra etiqueta + valor + progreso. El gráfico más repetido del producto. */
export function MetricBar({ label, value, pct, color = '#6B5DD3', caption, valueSize = 15 }) {
  return (
    <View style={{ gap: 5 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <Text style={{ fontSize: 14, lineHeight: 14 * 1.3, color: '#16162B' }}>{label}</Text>
        <Text style={{ color, fontSize: valueSize, fontFamily: theme.fontFamily.mono }}>{value}</Text>
      </View>
      <View style={{ height: 9, borderRadius: 99, backgroundColor: '#F3EEE6' }}>
        <View style={{ width: `${Math.min(100, pct)}%`, height: '100%', borderRadius: 99, backgroundColor: color }} />
      </View>
      {caption ? <Text style={{ fontSize: 11.5, color: '#A9A2B5' }}>{caption}</Text> : null}
    </View>
  );
}

/** Cifra + etiqueta, la unidad de los bloques de KPIs. */
export function Stat({ value, label, tone = '#FBF7F0', labelTone = '#8E87B5', size = 19 }) {
  return (
    <View>
      <Text style={{ fontSize: size, color: tone, fontFamily: theme.fontFamily.mono }}>{value}</Text>
      <Text style={{ color: labelTone, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

/** Leyenda de color: cuadrito (o punto) + texto. */
export function Legend({ items, size = 11.5 }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {items.map((it) => (
        <View key={it.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: it.dot ? 7 : 9, height: it.dot ? 7 : 9, borderRadius: it.dot ? 99 : 3, backgroundColor: it.color }} />
          <Text style={{ fontSize: size, color: '#8A8299' }}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

/** Avatar circular con inicial. */
export function Avatar({ initial, bg, fg, size = 32, fontSize = 12.5 }) {
  return (
    <View style={{ width: size, height: size, borderRadius: 99, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: fg, fontSize, fontWeight: '700' }}>{initial}</Text>
    </View>
  );
}

// Set de iconos propio: círculo lleno del color de categoría + glifo de un
// solo trazo (stroke 1.7, round, fill none — salvo la estrella, que va
// llena) encima. Nunca emoji, nunca un set licenciado — el color identifica
// la categoría antes de leer la etiqueta, que es lo que hace legible el
// timeline a las 3 de la mañana. Paths tomados 1:1 del paquete de diseño.
const CATEGORY_ICONS = {
  sueno: {
    bg: '#6B5DD3', glyph: '#FBF7F0',
    render: (g) => (
      <>
        <Path d="M17.5 14.8A7 7 0 1 1 9.4 4.6a5.6 5.6 0 0 0 8.1 10.2z" fill="none" stroke={g} strokeWidth={1.7} strokeLinecap="round" />
        <Path d="M19.6 3.2l.55 1.45 1.45.55-1.45.55-.55 1.45-.55-1.45-1.45-.55 1.45-.55z" fill="#F0A868" stroke="none" />
      </>
    ),
  },
  despertar: {
    bg: '#F0A868', glyph: '#16162B',
    render: (g) => (
      <>
        <Circle cx={12} cy={12} r={4} fill="none" stroke={g} strokeWidth={1.7} strokeLinecap="round" />
        <Path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.9 5.9l1.7 1.7M16.4 16.4l1.7 1.7M18.1 5.9l-1.7 1.7M7.6 16.4l-1.7 1.7" fill="none" stroke={g} strokeWidth={1.7} strokeLinecap="round" />
      </>
    ),
  },
  toma: {
    bg: '#4E8FA8', glyph: '#FBF7F0',
    render: (g) => <Path d="M12 3.6c3.1 4.2 5 6.5 5 9.1a5 5 0 0 1-10 0c0-2.6 1.9-4.9 5-9.1z" fill="none" stroke={g} strokeWidth={1.7} strokeLinecap="round" />,
  },
  extraccion: {
    bg: '#8A6BC4', glyph: '#FBF7F0',
    render: (g) => <Path d="M9 3.6h6l-.8 4.2 3 3.4a5.4 5.4 0 0 1-4.2 8.8 5.4 5.4 0 0 1-4.2-8.8l3-3.4z" fill="none" stroke={g} strokeWidth={1.7} strokeLinecap="round" />,
  },
  panal: {
    bg: '#3F7A62', glyph: '#FBF7F0',
    render: (g) => (
      <>
        <Path d="M4.8 7h14.4v3.4A7.2 7.2 0 0 1 12 17.6 7.2 7.2 0 0 1 4.8 10.4z" fill="none" stroke={g} strokeWidth={1.7} strokeLinecap="round" />
        <Path d="M8.4 12.4h7.2" fill="none" stroke={g} strokeWidth={1.7} strokeLinecap="round" />
      </>
    ),
  },
  medicina: {
    bg: '#D9705A', glyph: '#FBF7F0',
    render: (g) => (
      <>
        <Rect x={3.4} y={8.6} width={17.2} height={6.8} rx={3.4} rotation={-45} origin="12,12" fill="none" stroke={g} strokeWidth={1.7} strokeLinecap="round" />
        <Path d="M9.6 9.6l4.8 4.8" fill="none" stroke={g} strokeWidth={1.7} strokeLinecap="round" />
      </>
    ),
  },
  mellizos: {
    bg: '#C2703F', glyph: '#FBF7F0',
    render: (g) => (
      <>
        <Circle cx={8.6} cy={9} r={3.1} fill="none" stroke={g} strokeWidth={1.7} strokeLinecap="round" />
        <Circle cx={15.4} cy={9} r={3.1} fill="none" stroke={g} strokeWidth={1.7} strokeLinecap="round" />
        <Path d="M3.6 19.4c.5-2.7 2.3-4.1 5-4.1M15.4 15.3c2.7 0 4.5 1.4 5 4.1" fill="none" stroke={g} strokeWidth={1.7} strokeLinecap="round" />
      </>
    ),
  },
  ventana: {
    bg: '#16162B', glyph: '#A79FE0',
    render: (g) => (
      <>
        <Circle cx={12} cy={12} r={8} fill="none" stroke={g} strokeWidth={1.7} strokeLinecap="round" />
        <Path d="M12 7.6V12l3 1.9" fill="none" stroke={g} strokeWidth={1.7} strokeLinecap="round" />
      </>
    ),
  },
  confirmado: {
    bg: '#3F7A62', glyph: '#FBF7F0',
    render: (g) => <Path d="M5 12.6l4.2 4.2L19 7" fill="none" stroke={g} strokeWidth={1.7} strokeLinecap="round" />,
  },
  atencion: {
    bg: '#D9705A', glyph: '#FBF7F0',
    render: (g) => (
      <>
        <Path d="M12 4.4 20.4 19H3.6z" fill="none" stroke={g} strokeWidth={1.7} strokeLinecap="round" />
        <Path d="M12 10v3.6M12 16.2v.1" fill="none" stroke={g} strokeWidth={1.7} strokeLinecap="round" />
      </>
    ),
  },
};

/**
 * Ícono de categoría (círculo + glifo). `category` es una de:
 * sueno, despertar, toma, extraccion, panal, medicina, mellizos, ventana,
 * confirmado, atencion. Tamaños de referencia del handoff: 50 (acción
 * principal), 44 (tile), 40 (fila de hoja), 34 (fila de lista), 26 (widget).
 */
/**
 * Glifo suelto (sin círculo de fondo) — mismo path y reglas de trazo que
 * CategoryIcon, para usar como acento chico junto a texto (una fila, un
 * botón) sin forzar el círculo de categoría donde no corresponde. Evita
 * mezclar con Ionicons en pantallas que ya usan el set propio en otro lado.
 */
export function Glyph({ category, size = 18, color }) {
  const cat = CATEGORY_ICONS[category];
  if (!cat) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {cat.render(color ?? cat.bg)}
    </Svg>
  );
}

export function CategoryIcon({ category, size = 44 }) {
  const cat = CATEGORY_ICONS[category];
  if (!cat) return null;
  const glyphSize = size * 0.52;
  return (
    <View style={{ width: size, height: size, borderRadius: 99, backgroundColor: cat.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={glyphSize} height={glyphSize} viewBox="0 0 24 24">
        {cat.render(cat.glyph)}
      </Svg>
    </View>
  );
}
