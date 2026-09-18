import { OnboardingLayout, Button } from './OnboardingLayout';

/** 10 · Listo. Primera acción concreta, no una felicitación. */
export function ReadyScreen({ onFinish }) {
  return (
    <OnboardingLayout
      dark
      title="Listo. Anotá el primer sueño"
      body="No hace falta llenar nada del pasado. El patrón empieza a salir al tercer día."
      primary={<Button variant="amber" size="lg" full onClick={onFinish}>Entrar a Nocttua</Button>}
    />
  );
}
export default ReadyScreen;
