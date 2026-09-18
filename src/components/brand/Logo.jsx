import WordmarkCrema from '../../../assets/brand/wordmark-crema.svg';
import WordmarkNoche from '../../../assets/brand/wordmark-noche.svg';
import WordmarkTightCrema from '../../../assets/brand/wordmark-tight-crema.svg';
import WordmarkTightNoche from '../../../assets/brand/wordmark-tight-noche.svg';
import LockupCrema from '../../../assets/brand/lockup-crema.svg';
import LockupNoche from '../../../assets/brand/lockup-noche.svg';
import IsoCrema from '../../../assets/brand/iso-crema.svg';
import IsoNoche from '../../../assets/brand/iso-noche.svg';
import IsoVioleta from '../../../assets/brand/iso-violeta.svg';
import FaviconNoche from '../../../assets/brand/favicon-noche.svg';
import FaviconCrema from '../../../assets/brand/favicon-crema.svg';

/**
 * Logo — envoltorio de los SVG de marca.
 * Nunca recolorear: elige la variante correcta para el fondo.
 */
const SRC = {
  'wordmark-crema': WordmarkCrema,
  'wordmark-noche': WordmarkNoche,
  'wordmark-tight-crema': WordmarkTightCrema,
  'wordmark-tight-noche': WordmarkTightNoche,
  'lockup-crema': LockupCrema,
  'lockup-noche': LockupNoche,
  'iso-crema': IsoCrema,
  'iso-noche': IsoNoche,
  'iso-violeta': IsoVioleta,
  'favicon-noche': FaviconNoche,
  'favicon-crema': FaviconCrema,
};

// Relación de aspecto real de cada SVG (ancho/alto del viewBox), para escalar por ancho.
const ASPECT = {
  'wordmark-crema': 640 / 220, 'wordmark-noche': 640 / 220,
  'wordmark-tight-crema': 352 / 86, 'wordmark-tight-noche': 352 / 86,
  'lockup-crema': 640 / 220, 'lockup-noche': 640 / 220,
  'iso-crema': 1, 'iso-noche': 1, 'iso-violeta': 1,
  'favicon-noche': 1, 'favicon-crema': 1,
};

export function Logo({ variant = 'wordmark-noche', width = 120 }) {
  const Svg = SRC[variant] || SRC['wordmark-noche'];
  const ratio = ASPECT[variant] || 1;
  return <Svg width={width} height={width / ratio} />;
}
export default Logo;
