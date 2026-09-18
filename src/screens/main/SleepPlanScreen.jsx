import { useEffect, useState } from 'react';
import { View, Alert } from 'react-native';
import { A3_TypicalDayScreen } from '../onboarding/assessment/A3_TypicalDayScreen';
import { A4_NapsScreen } from '../onboarding/assessment/A4_NapsScreen';
import { getMyFamilyId, getBabies, getLatestSleepPlan } from '../../data/family';
import { correctedAgeMonths, derivePlanFromAssessment } from '../../lib/assessment';
import { supabase } from '../../lib/supabase';

/**
 * "Horarios y plan" — reentrada desde Ajustes al assessment (README §3 paso
 * 10 / plan §7). Reusa A3/A4 tal cual (mismos componentes, mismas reglas de
 * validación): no vuelve a preguntar nombre/género/fecha/línea base, porque
 * eso no cambia con el plan. Guardar inserta una versión NUEVA de
 * sleep_plans — nunca pisa ni borra la anterior, la asesora necesita ver qué
 * plan estaba vigente cada noche.
 */
export function SleepPlanScreen({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState('A3');
  const [draft, setDraft] = useState(null);
  const [familyId, setFamilyId] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(0);
  const [referenceAgeMonths, setReferenceAgeMonths] = useState(6);

  useEffect(() => {
    (async () => {
      const fid = await getMyFamilyId();
      setFamilyId(fid);
      const [babies, plan] = await Promise.all([getBabies(fid), getLatestSleepPlan(fid)]);
      const first = babies[0];
      setReferenceAgeMonths(first?.birth_date ? correctedAgeMonths(first.birth_date, first.gestation_weeks ?? null) : 6);
      setCurrentVersion(plan?.version ?? 0);
      setDraft({
        siblingType: babies.length === 2 ? 'multiple' : 'single',
        wakeTime: plan?.wakeTime ?? null,
        bedtime: plan?.bedtime ?? null,
        wakeWindowMin: plan?.wakeWindowMin ?? null,
        naps: plan?.naps ?? null,
        napSchedule: plan?.napSchedule ?? [],
        twinSyncDefault: plan?.twinSyncDefault ?? true,
        skippedSteps: [],
      });
      setLoading(false);
    })();
  }, []);

  const update = (patch) => setDraft((d) => ({ ...d, ...(typeof patch === 'function' ? patch(d) : patch) }));

  const handleSave = async () => {
    try {
      setSaving(true);
      const plan = derivePlanFromAssessment(draft, referenceAgeMonths);
      const { data: sessionData } = await supabase.auth.getSession();
      const { error } = await supabase.from('sleep_plans').insert({
        family_id: familyId,
        version: currentVersion + 1,
        source: 'user',
        wake_time: plan.wakeTime,
        bedtime: plan.bedtime,
        wake_window_min: plan.wakeWindowMin,
        naps: plan.naps,
        nap_schedule: plan.napSchedule,
        tolerance_min: plan.toleranceMin,
        twin_sync_default: plan.twinSyncDefault,
        updated_by: sessionData?.session?.user?.id ?? null,
      });
      if (error) throw error;
      onClose();
    } catch (err) {
      Alert.alert('No se pudo guardar', err.message ?? String(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !draft) {
    return <View style={{ flex: 1, backgroundColor: '#16162B' }} />;
  }

  if (step === 'A3') {
    return (
      <A3_TypicalDayScreen
        draft={draft} update={update} onNext={() => setStep('A4')} onBack={onClose}
        stepLabel="HORARIOS Y PLAN · 1 DE 2" stepIndex={0} stepTotal={2}
      />
    );
  }
  return (
    <A4_NapsScreen
      draft={draft} update={update} onNext={handleSave} onBack={() => setStep('A3')}
      stepLabel="HORARIOS Y PLAN · 2 DE 2" stepIndex={1} stepTotal={2} nextLabel={saving ? 'Guardando…' : 'Guardar'}
    />
  );
}
export default SleepPlanScreen;
