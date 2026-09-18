import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'nocttua.assessmentDraft';

export const ASSESSMENT_STEPS = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'];

/**
 * Borrador del assessment del onboarding (A1–A6), persistido tras CADA
 * respuesta — igual que useFeedSession.js. Si un bebé llora a mitad del
 * flujo y se cierra la app, `useAssessmentDraft` vuelve con el mismo `step`
 * y las respuestas puestas (criterio de aceptación §6.4 del README).
 *
 * `babiesCount` solo se usa para crear el borrador la PRIMERA vez (nunca
 * pisa uno ya guardado) — llega de `twins` en RootNavigator, la pregunta ya
 * contestada en la pantalla 2 del onboarding existente.
 */
function emptyDraft(babiesCount) {
  const count = babiesCount ?? 1;
  return {
    step: 'A1',
    babiesCount: count,
    siblingType: count === 2 ? 'multiple' : 'single',
    babies: Array.from({ length: count }, () => ({ name: '', gender: 'niña' })),
    birthDate: null,
    premature: 'no',
    gestationWeeks: null,
    wakeTime: null,
    bedtime: null,
    wakeWindowMin: null,
    naps: null,
    napSchedule: [],
    twinSyncDefault: true,
    baseline: { wakingsPerNight: null, fallAsleepMethod: null, latencyMin: null, nightFeeds: [] },
    skippedSteps: [],
  };
}

export function useAssessmentDraft(babiesCount) {
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setDraft(raw ? JSON.parse(raw) : emptyDraft(babiesCount)))
      .catch(() => setDraft(emptyDraft(babiesCount)))
      .finally(() => setLoading(false));
    // Solo al montar: no queremos que un cambio de `babiesCount` a mitad del
    // flujo reinicie un borrador que ya existe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Mezcla `patch` (objeto o función `draft => patch`) sobre el borrador y lo guarda de inmediato. */
  const update = useCallback((patch) => {
    setDraft((d) => {
      const next = { ...d, ...(typeof patch === 'function' ? patch(d) : patch) };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setDraft(null);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  return { draft, loading, update, clear };
}
