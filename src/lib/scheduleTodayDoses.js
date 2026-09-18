import { medPlan } from './meds';
import { scheduleDoseAlert, cancelDoseAlert } from './doseAlerts';

/**
 * Conecta doseAlerts.js a la predicción real: por cada medicina y bebé,
 * agenda un aviso para la próxima dosis que todavía no llegó. Si ya no queda
 * nada pendiente para una medicina+bebé (se desactivó o se cerró el
 * episodio), cancela cualquier aviso viejo en vez de dejarlo sonar solo.
 */
export async function scheduleTodayDoseAlerts(familyId, babies, prescriptions, doses, now = new Date()) {
  const babyIds = babies.map((b) => b.id);
  const rows = medPlan(prescriptions, doses, babyIds, now);
  const live = new Set();

  for (const row of rows) {
    if (row.due) continue;
    const baby = babies.find((b) => b.id === row.babyId);
    live.add(`${row.prescription.id}:${row.babyId}`);
    await scheduleDoseAlert({
      familyId,
      prescriptionId: row.prescription.id,
      babyId: row.babyId,
      babyName: baby?.name ?? '',
      medName: row.prescription.name,
      doseMl: row.doseMl,
      doseAt: row.at,
      remindMinutesBefore: row.prescription.remindMinutesBefore ?? 5,
    }).catch(() => {});
  }

  for (const p of prescriptions) {
    for (const babyId of babyIds) {
      const key = `${p.id}:${babyId}`;
      if (p.doses[babyId] != null && !live.has(key)) {
        await cancelDoseAlert(p.id, babyId).catch(() => {});
      }
    }
  }
}
