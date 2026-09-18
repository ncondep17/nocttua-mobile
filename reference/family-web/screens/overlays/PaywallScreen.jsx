import { useState } from 'react';
import { Button } from '../../../../components/core/Button';
import { Badge } from '../../../../components/core/Badge';
import { Eyebrow } from '../../../../components/core/Eyebrow';
import { paywallPlans } from '../../data/mock';

const INCLUDED = [
  'Registro ilimitado de sueño, tomas y extracción',
  'Ventanas calculadas por edad',
  'Patrones y reporte exportable',
  'Hasta 6 personas en el equipo',
  'Registro doble para mellizos',
];

/** Pantalla completa · Suscripción. Precio arriba, sin cuenta regresiva ni presión. */
export function PaywallScreen({ onClose, onSubscribe }) {
  const [plan, setPlan] = useState('anual');
  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-crema-paper">
      <div className="flex items-center justify-between px-9 pt-9">
        <Eyebrow>Nocttua completo</Eyebrow>
        <button type="button" onClick={onClose} className="font-ui-app text-base text-tinta-suave">Cerrar</button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-auto px-9 pt-9">
        <h1 className="font-display-app text-display-md leading-tight text-tinta-fuerte">Dos semanas gratis. Después decidís</h1>

        <div className="flex flex-col gap-5">
          {paywallPlans.map((p) => {
            const on = plan === p.id;
            return (
              <button key={p.id} type="button" onClick={() => setPlan(p.id)}
                className={['flex items-center justify-between gap-6 rounded-xl border bg-white px-8 py-8 text-left transition', on ? 'border-[1.5px] border-violeta-600 bg-violeta-50' : 'border-crema-line-strong'].join(' ')}>
                <span className="flex flex-col gap-1">
                  <span className="font-ui-app text-md font-medium text-tinta-fuerte">{p.name}</span>
                  <span className="font-ui-app text-sm text-tinta-tenue">{p.meta}</span>
                </span>
                <span className="flex flex-col items-end gap-2">
                  <span className="font-mono text-lg text-tinta-fuerte">{p.price}</span>
                  {p.badge ? <Badge tone={p.badgeTone}>{p.badge}</Badge> : null}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-5">
          <Eyebrow>Incluye</Eyebrow>
          {INCLUDED.map((i) => (
            <div key={i} className="flex items-start gap-5">
              <span className="mt-1 text-verde-600">✓</span>
              <span className="font-ui-app text-base leading-relaxed text-tinta-cuerpo">{i}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 px-9 pb-11 pt-8">
        <Button size="lg" full onClick={onSubscribe}>Empezar las dos semanas</Button>
        <span className="text-center font-ui-app text-sm text-tinta-apagada">Se cancela desde la tienda, sin llamadas.</span>
      </div>
    </div>
  );
}
export default PaywallScreen;
