import { useRef } from 'react';

/**
 * Mantener presionado un botón −/+ repite el paso solo — sin esto, corregir
 * una hora varias horas (o una cantidad bien distinta al default) significa
 * tocar decenas de veces el mismo botón de a 5 en 5 / de a 1 en 1. Un toque
 * normal se sigue resolviendo con `onPress` (un solo paso); pasados 450 ms
 * sostenido arranca a repetir cada 90 ms hasta soltar.
 */
export function useHoldRepeat(step) {
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  const clear = () => {
    clearTimeout(timeoutRef.current);
    clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  };

  const onPressIn = () => {
    clear();
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(step, 90);
    }, 450);
  };

  return { onPress: step, onPressIn, onPressOut: clear };
}
export default useHoldRepeat;
