import { OnboardingLayout, Button } from './OnboardingLayout';

/** 04 · Lactancia y extracción: el registro que ninguna app de sueño hace bien. */
export function PumpingIntroScreen({ onNext }) {
  return (
    <OnboardingLayout
      step={3} eyebrow="Paso 3 de 5"
      title="También la extracción y la reserva"
      body="Volumen, duración y qué queda en el congelador. Si alimentás con fórmula o mixta, se anota igual."
      primary={<Button size="lg" full onClick={onNext}>Siguiente</Button>}
    >
      <div className="flex flex-col gap-5 rounded-2xl bg-noche-900 px-9 py-9">
        <span className="font-mono text-xs uppercase tracking-eyebrow text-noite-tenue">Reserva</span>
        <span className="font-display-app text-display-lg leading-tight text-crema-paper">1,4 L</span>
        <span className="font-ui-app text-base leading-relaxed text-noite-suave">Suma de lo extraído menos lo usado. Se actualiza con cada registro.</span>
      </div>
    </OnboardingLayout>
  );
}
export default PumpingIntroScreen;
