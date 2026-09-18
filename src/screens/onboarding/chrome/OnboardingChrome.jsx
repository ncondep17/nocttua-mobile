import { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect } from 'react-native-svg';
import { theme } from '@nocttua/theme/native';
import { CategoryIcon } from '../../../components/v2/primitives';

/**
 * Piezas compartidas de las 10 pantallas de onboarding, portadas 1:1 del
 * paquete de diseño aprobado (Downloads/onboarding-handoff). NO redondear
 * ni "normalizar" los tamaños: son intencionales, ver SPEC.md.
 *
 * Los fondos radiales de CSS (elipse 120%/70% etc) se aproximan acá con un
 * radialGradient circular de SVG — la forma exacta de la elipse se pierde,
 * el resplandor cálido/difuso que aporta se mantiene.
 */
const LINEAR_STOPS = {
  noche: [['0%', '#16162B'], ['60%', '#22224A'], ['100%', '#312D58']],
  nocheAlta: [['0%', '#16162B'], ['58%', '#23234B'], ['100%', '#332F5C']],
  nocheBaja: [['0%', '#16162B'], ['62%', '#23234B'], ['100%', '#332F5C']],
  ambarAbajo: [['0%', '#16162B'], ['56%', '#22224A'], ['100%', '#332F5C']],
  ambarArriba: [['0%', '#1A1A34'], ['58%', '#26264F'], ['100%', '#332F5C']],
  violetaAbajo: [['0%', '#16162B'], ['60%', '#22224A'], ['100%', '#332F5C']],
};

const RADIAL_GLOW = {
  ambarAbajo: { rgb: '240,168,104', alpha: 0.24, cy: '108%' },
  ambarArriba: { rgb: '240,168,104', alpha: 0.28, cy: '8%' },
  violetaAbajo: { rgb: '167,159,224', alpha: 0.22, cy: '105%' },
};

export const BACKGROUNDS = {
  ambarAbajo: 'ambarAbajo',
  noche: 'noche',
  ambarArriba: 'ambarArriba',
  nocheAlta: 'nocheAlta',
  violetaAbajo: 'violetaAbajo',
  nocheBaja: 'nocheBaja',
};

/** Lienzo de una pantalla: fondo degradado compuesto a pantalla completa + contenido. */
export function NightCanvas({ variant, children }) {
  const { width, height } = useWindowDimensions();
  const linear = LINEAR_STOPS[variant];
  const radial = RADIAL_GLOW[variant];

  return (
    <View style={{ flex: 1, backgroundColor: '#16162B' }}>
      <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Defs>
          <LinearGradient id={`lg-${variant}`} x1="0" y1="0" x2="0" y2="1">
            {linear.map(([offset, color]) => <Stop key={offset} offset={offset} stopColor={color} />)}
          </LinearGradient>
          {radial ? (
            <RadialGradient id={`rg-${variant}`} cx="50%" cy={radial.cy} r="65%" gradientUnits="objectBoundingBox">
              <Stop offset="0%" stopColor={`rgb(${radial.rgb})`} stopOpacity={radial.alpha} />
              <Stop offset="62%" stopColor={`rgb(${radial.rgb})`} stopOpacity={0} />
            </RadialGradient>
          ) : null}
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill={`url(#lg-${variant})`} />
        {radial ? <Rect x={0} y={0} width={width} height={height} fill={`url(#rg-${variant})`} /> : null}
      </Svg>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

/**
 * Cabecera de paso: etiqueta ámbar en versalitas + "Saltar" (solo si hay
 * onSkip) — más, opcionalmente, una flecha de volver a la izquierda
 * (`onBack`), independiente del slot de la derecha. La mayoría de los pasos
 * ya reusaban ese slot de la derecha como "Atrás" (onSkip={onBack}) porque
 * no tenían un skip propio — A3 sí lo tiene ("No sé aún"), así que ahí ese
 * truco tapaba la vuelta atrás por completo. `onBack` resuelve los dos
 * casos sin tocar los pasos que ya andaban bien.
 */
export function StepHeader({ label, onBack, onSkip, skipLabel = 'Saltar' }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 18 + insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={10} style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 20, color: '#B9B2C9' }}>‹</Text>
          </Pressable>
        ) : null}
        <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.3, color: '#F0A868' }}>{label}</Text>
      </View>
      {onSkip ? (
        <Pressable onPress={onSkip} hitSlop={8} style={{ borderRadius: 99, borderWidth: 1, borderColor: '#3A3560', paddingHorizontal: 12, paddingVertical: 6 }}>
          <Text style={{ fontSize: 13.5, color: '#B9B2C9' }}>{skipLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Paginador de N puntos (5 en el onboarding, 6 en el assessment): el activo mide 22×4, los demás 6×4. */
export function Dots({ active, total = 5 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={{ width: i === active ? 22 : 6, height: 4, borderRadius: 99, backgroundColor: i === active ? '#FBF7F0' : '#4A4A7A' }} />
      ))}
    </View>
  );
}

/** Pie de las pantallas paginadas: puntos a la izquierda, pastilla violeta a la derecha. */
export function StepFooter({ active, total = 5, onNext, label = 'Seguir', disabled = false }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Dots active={active} total={total} />
      <Pressable
        onPress={disabled ? undefined : onNext}
        style={{ borderRadius: 99, backgroundColor: '#6B5DD3', paddingHorizontal: 26, paddingVertical: 13, minHeight: 44, justifyContent: 'center', opacity: disabled ? 0.5 : 1 }}
      >
        <Text style={{ fontSize: 15, fontFamily: theme.fontFamily.uiAppMedium, fontWeight: '500', color: '#FBF7F0' }}>{label}</Text>
      </Pressable>
    </View>
  );
}

/** Titular + párrafo. El titular SIEMPRE en Instrument Serif 400. */
export function Headline({ title, body, size = 33, gap = 13, bodySize = 15 }) {
  return (
    <View style={{ gap }}>
      <Text style={{ fontSize: size, lineHeight: size * 1.1, fontFamily: theme.fontFamily.displayApp, color: '#FBF7F0' }}>{title}</Text>
      {body ? <Text style={{ fontSize: bodySize, lineHeight: bodySize * 1.6, color: '#D6D0E4' }}>{body}</Text> : null}
    </View>
  );
}

/** Tarjeta de vidrio: el contenedor de demo dentro de las pantallas noche. */
export function GlassCard({ radius = 20, padding = 17, gap = 12, style, children }) {
  return (
    <View style={[{ borderRadius: radius, padding, gap, borderWidth: 1, borderColor: '#4A4A7A', backgroundColor: 'rgba(251,247,240,.07)' }, style]}>
      {children}
    </View>
  );
}

/** Botón crema de ancho completo (acción principal fuera de las pantallas paginadas). */
export function CreamButton({ children, onPress, style }) {
  return (
    <Pressable onPress={onPress} style={[{ borderRadius: 14, backgroundColor: '#FBF7F0', paddingHorizontal: 16, paddingVertical: 16, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text style={{ fontSize: 16, fontFamily: theme.fontFamily.uiAppMedium, fontWeight: '500', color: '#16162B' }}>{children}</Text>
    </Pressable>
  );
}

/**
 * Fila de chips de una sola selección — el control más repetido del
 * assessment (A1–A6). `options` es `[{ label, value }]`; `columns={2}` arma
 * un grid 2×2 (usado en A5 para el método de dormirse). `otraLabel`/`onOtra`
 * agregan un chip final que abre un picker nativo en vez de seleccionar un
 * valor fijo — separado de `onChange` porque "Otra" no tiene un valor propio
 * hasta que el picker devuelve uno.
 */
export function ChipRow({ options, value, onChange, otraLabel, onOtra, columns }) {
  const chipStyle = (on) => ({
    minHeight: 40, borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center',
    borderWidth: on ? 1.5 : 1, borderColor: on ? '#6B5DD3' : '#2C2C52',
    backgroundColor: on ? 'rgba(107,93,211,.18)' : 'transparent',
    ...(columns ? { flexBasis: (100 / columns) + '%', flexGrow: 0 } : {}),
  });
  const chipText = (on) => ({ fontSize: 14, fontFamily: theme.fontFamily.uiApp, color: on ? '#FBF7F0' : '#8E87B5' });

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
      {options.map((opt) => {
        const on = value === opt.value;
        return (
          <Pressable key={String(opt.value)} onPress={() => onChange(opt.value)} style={chipStyle(on)}>
            <Text style={chipText(on)}>{opt.label}</Text>
          </Pressable>
        );
      })}
      {otraLabel ? (
        <Pressable onPress={onOtra} style={chipStyle(false)}>
          <Text style={chipText(false)}>{otraLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Tarjeta con ícono de categoría + etiqueta + cifra grande + fila de chips debajo (A3/A4). */
export function ValueCard({ icon, label, value, valueColor = '#FBF7F0', children }) {
  return (
    <View style={{ borderRadius: 18, borderWidth: 1, borderColor: '#2C2C52', backgroundColor: 'rgba(11,11,22,.4)', padding: 15, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {icon ? <CategoryIcon category={icon} size={34} /> : null}
        <Text style={{ flex: 1, fontSize: 13.5, color: '#B9B2C9' }}>{label}</Text>
        {value != null ? <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 22, color: valueColor }}>{value}</Text> : null}
      </View>
      {children}
    </View>
  );
}

/** Estrella titilante decorativa. Posición absoluta dictada por cada pantalla. */
export function Twinkle({ top, left, right, size = 12, color = '#F0A868', duration = 4 }) {
  const anim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: (duration * 1000) / 2, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.35, duration: (duration * 1000) / 2, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, duration]);

  return (
    <Animated.Text style={{ position: 'absolute', top, left, right, fontSize: size, color, opacity: anim }}>✦</Animated.Text>
  );
}
