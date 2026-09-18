import { OnboardingLayout, Button } from './OnboardingLayout';
import { BarChart } from '../../../../components/data/BarChart';
import { weekNights } from '../../data/mock';

/** 07 · Patrones y reportes: lo que se ve a la semana. */
export function PatternsIntroScreen({ onNext }) {
  return (
    <OnboardingLayout
      title="A la semana se ve el patrón"
      body="Horas de noche, siestas que sí funcionaron y qué pasó antes de las noches malas. Exportable para tu pediatra o tu asesora."
      primary={<Button size="lg" full onClick={onNext}>Siguiente</Button>}
    >
      <div className="rounded-2xl border border-crema-line bg-white px-8 py-8">
        <BarChart data={weekNights} highlightLast />
      </div>
    </OnboardingLayout>
  );
}
export default PatternsIntroScreen;
