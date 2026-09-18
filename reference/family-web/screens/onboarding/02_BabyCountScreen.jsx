import { useState } from 'react';
import { OnboardingLayout, Button } from './OnboardingLayout';

/**
 * 02 · Uno o dos bebés.
 * Decide toda la app: si elige dos, cada registro pide a quién corresponde
 * y aparecen el desfase y el registro doble.
 */
const OPTIONS = [
  { id: 'one', title: 'Un bebé', body: 'Un carril de sueño y tomas.' },
  { id: 'two', title: 'Mellizos o gemelos', body: 'Dos carriles, registro doble y desfase entre los dos.' },
];

export function BabyCountScreen({ onNext, onSelect }) {
  const [sel, setSel] = useState('two');
  return (
    <OnboardingLayout
      step={1}
      eyebrow="Paso 1 de 5"
      title="¿A cuántos bebés vas a seguir?"
      primary={<Button size="lg" full onClick={() => { onSelect && onSelect(sel); onNext && onNext(); }}>Continuar</Button>}
    >
      <div className="flex flex-col gap-5">
        {OPTIONS.map((o) => {
          const on = sel === o.id;
          return (
            <button
              key={o.id} type="button" onClick={() => setSel(o.id)}
              className={['flex flex-col gap-2 rounded-xl border bg-white px-8 py-8 text-left transition', on ? 'border-[1.5px] border-violeta-600 bg-violeta-50' : 'border-crema-line-strong'].join(' ')}
            >
              <span className="font-ui-app text-lg font-medium text-tinta-fuerte">{o.title}</span>
              <span className="font-ui-app text-base text-tinta-tenue">{o.body}</span>
            </button>
          );
        })}
      </div>
      <p className="m-0 font-ui-app text-sm leading-relaxed text-tinta-tenue">Se puede cambiar después, pero cambia cómo se ve todo.</p>
    </OnboardingLayout>
  );
}
export default BabyCountScreen;
