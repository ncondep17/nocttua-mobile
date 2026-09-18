import { useEffect, useState } from 'react';

/**
 * Fuerza un re-render cada `ms` — sin esto, un texto "hace X minutos" queda
 * pegado al valor que tenía en el último render (llegó a mostrar "hace 0
 * minutos" mucho después de esa toma, porque nada disparaba un redibujado
 * nuevo con el reloj ya avanzado).
 */
export function useNowTick(ms = 30000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}
