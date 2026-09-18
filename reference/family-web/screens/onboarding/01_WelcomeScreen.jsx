import { OnboardingLayout, Button } from './OnboardingLayout';

/** 01 · Bienvenida. La promesa, sin prometer que el bebé va a dormir. */
export function WelcomeScreen({ onNext }) {
  return (
    <OnboardingLayout
      dark
      title="El sueño de tu bebé, anotado sin drama"
      body="Registrá siestas, noches y tomas en segundos. Nocttua encuentra el patrón y te dice cuándo viene la próxima ventana."
      primary={<Button variant="amber" size="lg" full onClick={onNext}>Empezar</Button>}
      secondary={<Button variant="ghost" full onClick={onNext}>Ya tengo cuenta</Button>}
    />
  );
}
export default WelcomeScreen;
