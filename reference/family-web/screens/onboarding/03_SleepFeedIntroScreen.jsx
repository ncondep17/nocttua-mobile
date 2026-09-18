import { OnboardingLayout, Button } from './OnboardingLayout';

/** 03 · Qué se registra: sueño y tomas en un toque. */
const ROWS = [
  { icon: '☾', title: 'Siestas y noches', body: 'Un toque al acostar, otro al despertar.' },
  { icon: '◐', title: 'Tomas', body: 'Pecho, fórmula o mixta, con volumen y lado.' },
  { icon: '⇄', title: 'Registro doble', body: 'Si son dos, se anota a las dos a la vez.' },
];

export function SleepFeedIntroScreen({ onNext }) {
  return (
    <OnboardingLayout
      step={2} eyebrow="Paso 2 de 5"
      title="Se anota en dos toques, con una mano"
      primary={<Button size="lg" full onClick={onNext}>Siguiente</Button>}
    >
      <div className="flex flex-col gap-6">
        {ROWS.map((r) => (
          <div key={r.title} className="flex items-start gap-7 rounded-lg border border-crema-line bg-white px-8 py-7">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-pill bg-violeta-50 text-lg text-violeta-600">{r.icon}</span>
            <div className="flex flex-col gap-1">
              <span className="font-ui-app text-md font-medium text-tinta-fuerte">{r.title}</span>
              <span className="font-ui-app text-sm leading-normal text-tinta-tenue">{r.body}</span>
            </div>
          </div>
        ))}
      </div>
    </OnboardingLayout>
  );
}
export default SleepFeedIntroScreen;
