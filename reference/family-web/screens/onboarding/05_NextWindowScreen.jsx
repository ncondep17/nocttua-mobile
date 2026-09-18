import { OnboardingLayout, Button } from './OnboardingLayout';
import { WindowCountdown } from '../../../../components/data/WindowCountdown';

/** 05 · La ventana crítica: el momento en que la app deja de ser un diario. */
export function NextWindowScreen({ onNext }) {
  return (
    <OnboardingLayout
      step={4} eyebrow="Paso 4 de 5"
      title="Y te dice cuándo viene la próxima ventana"
      body="Con dos o tres días de registro, Nocttua calcula cuánto aguanta despierta a su edad y avisa antes de que se pase."
      primary={<Button size="lg" full onClick={onNext}>Siguiente</Button>}
    >
      <WindowCountdown time="11:20" remaining="en 38 min" baby="Emilia" note="Lleva 1h 45m despierta." />
    </OnboardingLayout>
  );
}
export default NextWindowScreen;
