import { OnboardingLayout, Button } from './OnboardingLayout';

/** 08 · Acceso. Apple / Google / correo, en ese orden. */
export function AppleAuthScreen({ onAuth }) {
  return (
    <OnboardingLayout
      dark
      title="Creá tu cuenta"
      body="Los registros se sincronizan entre todas las personas que cuidan al bebé."
      primary={
        <div className="flex flex-col gap-5">
          <Button variant="secondary" size="lg" full icon="" onClick={onAuth}>Continuar con Apple</Button>
          <Button variant="secondary" size="lg" full onClick={onAuth}>Continuar con Google</Button>
          <Button variant="ghost" full onClick={onAuth}>Usar mi correo</Button>
        </div>
      }
    >
      <p className="m-0 font-ui-app text-sm leading-relaxed text-noite-tenue">Nocttua no vende datos ni publica nada. Los registros son de tu familia.</p>
    </OnboardingLayout>
  );
}
export default AppleAuthScreen;
