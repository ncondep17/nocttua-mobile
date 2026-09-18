import { Text } from 'react-native';
import { NightCanvas, BACKGROUNDS } from '../chrome/OnboardingChrome';
import { useAssessmentDraft, ASSESSMENT_STEPS } from '../../../lib/useAssessmentDraft';
import { A1_WhoScreen } from './A1_WhoScreen';
import { A2_BirthdateScreen } from './A2_BirthdateScreen';
import { A3_TypicalDayScreen } from './A3_TypicalDayScreen';
import { A4_NapsScreen } from './A4_NapsScreen';
import { A5_BaselineScreen } from './A5_BaselineScreen';
import { A6_SummaryScreen } from './A6_SummaryScreen';

/**
 * Controlador del assessment del onboarding (A1–A6). Reemplaza a
 * BabySurveyScreen en el paso 'babySurvey' de RootNavigator — mismo
 * contrato de props (`twins`, `onDone`) para que el punto de enganche sea
 * mínimo. El borrador vive en AsyncStorage (useAssessmentDraft): cerrar la
 * app a mitad y reabrir vuelve al mismo paso con las respuestas puestas.
 */
export function AssessmentFlow({ twins, onDone }) {
  const { draft, loading, update, clear } = useAssessmentDraft(twins ? 2 : 1);

  if (loading || !draft) {
    return (
      <NightCanvas variant={BACKGROUNDS.noche}>
        <Text style={{ marginTop: 80, alignSelf: 'center', color: '#8A8299' }}>Cargando…</Text>
      </NightCanvas>
    );
  }

  const stepIndex = ASSESSMENT_STEPS.indexOf(draft.step);
  const goTo = (step) => update({ step });
  const next = () => goTo(ASSESSMENT_STEPS[Math.min(stepIndex + 1, ASSESSMENT_STEPS.length - 1)]);
  const back = () => goTo(ASSESSMENT_STEPS[Math.max(stepIndex - 1, 0)]);

  const handleDone = () => {
    clear();
    onDone();
  };

  switch (draft.step) {
    case 'A1':
      return <A1_WhoScreen draft={draft} update={update} onNext={next} />;
    case 'A2':
      return <A2_BirthdateScreen draft={draft} update={update} onNext={next} onBack={back} />;
    case 'A3':
      return <A3_TypicalDayScreen draft={draft} update={update} onNext={next} onBack={back} />;
    case 'A4':
      return <A4_NapsScreen draft={draft} update={update} onNext={next} onBack={back} />;
    case 'A5':
      return <A5_BaselineScreen draft={draft} update={update} onNext={next} onBack={back} />;
    case 'A6':
      return <A6_SummaryScreen draft={draft} onBack={back} onChangeSomething={() => goTo('A3')} onDone={handleDone} />;
    default:
      return null;
  }
}
export default AssessmentFlow;
