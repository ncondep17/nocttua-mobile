import { OnboardingLayout, Button } from './OnboardingLayout';

/** 06 · Permiso de notificaciones. Se pide después de mostrar para qué sirven. */
export function NotificationsPermissionScreen({ onAllow, onSkip }) {
  return (
    <OnboardingLayout
      step={5} eyebrow="Paso 5 de 5"
      title="¿Te avisamos antes de cada ventana?"
      body="Un aviso 15 minutos antes. Nada más: sin rachas, sin recordatorios de culpa."
      primary={<Button size="lg" full onClick={onAllow}>Activar avisos</Button>}
      secondary={<Button variant="ghost" full onClick={onSkip}>Más tarde</Button>}
    >
      <div className="flex flex-col gap-4 rounded-xl border border-crema-line bg-white px-8 py-8">
        <span className="font-mono text-xs text-tinta-tenue">ahora</span>
        <span className="font-ui-app text-md font-medium text-tinta-fuerte">Ventana de Emilia en 15 min</span>
        <span className="font-ui-app text-sm text-tinta-tenue">Lleva 1h 30m despierta.</span>
      </div>
    </OnboardingLayout>
  );
}
export default NotificationsPermissionScreen;
