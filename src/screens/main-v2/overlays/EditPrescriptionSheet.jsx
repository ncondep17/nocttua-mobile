import { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert, Image } from 'react-native';
import { theme } from '@nocttua/theme/native';
import { Eyebrow, Stepper, PrimaryButton, GhostButton, DangerButton } from '../../../components/v2/primitives';
import { SheetV2 } from '../../../components/v2/MobileChrome';
import { TextField } from '../../../components/forms/TextArea';
import { DateField } from '../../../components/forms/DateField';
import { ML } from '../../../lib/meds';
import { pickAndUploadPrescriptionPhoto, getPrescriptionPhotoUrl, deletePrescriptionPhoto } from '../../../lib/prescriptionPhoto';

const emptyForm = (babies) => ({
  id: null, name: '', conc: '', everyHours: 6, maxDay: 4, doctor: '', prescribedOn: new Date(), note: '', altNote: '',
  remindMinutesBefore: 5, photoUrl: null,
  doses: Object.fromEntries(babies.map((b) => [b.id, ''])),
});

/**
 * Administrar medicinas indicadas — "Editar" en Cuidado abre esto. No está en
 * el paquete de diseño (quedaba como "pendiente"): lista + agregar/editar +
 * retirar, con la misma regla del producto ("Noctua repite, no calcula") y
 * gateado por RLS a quien tiene acceso total sobre la família.
 */
export function EditPrescriptionSheet({ open, familyId, prescriptions, babies, onClose, onSave, onDeactivate }) {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [form, setForm] = useState(() => emptyForm(babies));
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);

  useEffect(() => { if (open) setView('list'); }, [open]);

  useEffect(() => {
    let cancelled = false;
    if (form.photoUrl) getPrescriptionPhotoUrl(form.photoUrl).then((url) => { if (!cancelled) setPhotoPreviewUrl(url); });
    else setPhotoPreviewUrl(null);
    return () => { cancelled = true; };
  }, [form.photoUrl]);

  const openNew = () => { setForm(emptyForm(babies)); setView('form'); };
  const openEdit = (p) => {
    setForm({
      id: p.id, name: p.name, conc: p.conc, everyHours: p.everyHours, maxDay: p.maxDay,
      doctor: p.doctor, prescribedOn: new Date(p.prescribedOn + 'T00:00:00'), note: p.note, altNote: p.altNote,
      remindMinutesBefore: p.remindMinutesBefore ?? 5, photoUrl: p.photoUrl ?? null,
      doses: Object.fromEntries(babies.map((b) => [b.id, p.doses[b.id] != null ? String(p.doses[b.id]) : ''])),
    });
    setView('form');
  };

  const setDose = (babyId, v) => setForm((f) => ({ ...f, doses: { ...f.doses, [babyId]: v } }));

  const handlePickPhoto = async () => {
    // La receta necesita estar guardada antes de subir la foto (el path
    // incluye el prescriptionId) — con una medicina nueva, primero un
    // guardado rápido para tener id, después el picker.
    try {
      setUploadingPhoto(true);
      let prescriptionId = form.id;
      if (!prescriptionId) {
        Alert.alert('Guarda primero', 'Guarda la medicina una vez antes de agregar la foto de la receta.');
        return;
      }
      const path = await pickAndUploadPrescriptionPhoto(familyId, prescriptionId);
      if (path) setForm((f) => ({ ...f, photoUrl: path }));
    } catch (err) {
      Alert.alert('No se pudo subir la foto', err.message ?? String(err));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert('¿Quitar la foto?', 'Se borra del todo, no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar', style: 'destructive', onPress: async () => {
          try {
            setUploadingPhoto(true);
            await deletePrescriptionPhoto(form.photoUrl);
            setForm((f) => ({ ...f, photoUrl: null }));
          } catch (err) {
            Alert.alert('No se pudo quitar', err.message ?? String(err));
          } finally {
            setUploadingPhoto(false);
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Falta el nombre', 'Escribe el nombre de la medicina.'); return; }
    const doses = babies.map((b) => ({ babyId: b.id, ml: parseFloat((form.doses[b.id] || '').replace(',', '.')) })).filter((d) => d.ml > 0);
    if (doses.length === 0) { Alert.alert('Falta la dosis', 'Indica la dosis para al menos un bebé.'); return; }
    try {
      setSaving(true);
      const savedId = await onSave({
        id: form.id, name: form.name, conc: form.conc, everyHours: form.everyHours, maxDay: form.maxDay,
        doctor: form.doctor, prescribedOn: form.prescribedOn.toISOString().slice(0, 10), note: form.note, altNote: form.altNote,
        remindMinutesBefore: form.remindMinutesBefore, photoUrl: form.photoUrl, doses,
      });
      if (!form.id && savedId) setForm((f) => ({ ...f, id: savedId }));
      setView('list');
    } catch (err) {
      Alert.alert('No se pudo guardar', err.message ?? String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = () => {
    Alert.alert('¿Retirar ' + form.name + '?', 'Deja de aparecer como indicada. El historial de dosis ya dadas no se borra.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Retirar', style: 'destructive', onPress: async () => {
          try {
            setSaving(true);
            await onDeactivate(form.id);
            setView('list');
          } catch (err) {
            Alert.alert('No se pudo retirar', err.message ?? String(err));
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  return (
    <SheetV2
      open={open}
      onClose={onClose}
      title={view === 'list' ? 'Medicinas indicadas' : (form.id ? 'Editar medicina' : 'Agregar medicina')}
      maxH="92%"
      footer={view === 'form' ? <PrimaryButton style={{ flex: 1 }} onPress={handleSave} disabled={saving}>Guardar</PrimaryButton> : undefined}
    >
      {view === 'list' ? (
        <View style={{ gap: 9 }}>
          <Text style={{ fontSize: 13, lineHeight: 13 * 1.5, color: '#8A8299' }}>
            Solo se guarda lo que indicó el médico: nombre, concentración, dosis por bebé y con qué frecuencia. Noctua no calcula nada de esto.
          </Text>
          {prescriptions.map((p) => (
            <Pressable key={p.id} onPress={() => openEdit(p)} style={{ borderRadius: 14, borderWidth: 1, borderColor: '#E4DCD0', backgroundColor: 'white', paddingHorizontal: 14, paddingVertical: 13, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#16162B' }}>{p.name}</Text>
                <Text style={{ fontSize: 13, color: '#6B5DD3' }}>Editar</Text>
              </View>
              <Text style={{ fontSize: 12.5, color: '#8A8299' }}>
                {babies.filter((b) => p.doses[b.id] != null).map((b) => b.name + ' ' + ML(p.doses[b.id])).join(' · ')}
              </Text>
            </Pressable>
          ))}
          <Pressable onPress={openNew} style={{ borderRadius: 14, borderWidth: 1, borderColor: '#C9C1D8', borderStyle: 'dashed', paddingVertical: 13, alignItems: 'center' }}>
            <Text style={{ fontSize: 14.5, color: '#6B5DD3' }}>＋ Agregar medicina</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 13 }}>
          <TextField label="Nombre" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Paracetamol" />
          <TextField label="Concentración" value={form.conc} onChange={(v) => setForm((f) => ({ ...f, conc: v }))} placeholder="Gotas 100 mg/ml" />

          <View style={{ gap: 9 }}>
            <Eyebrow>Dosis por bebé (ml)</Eyebrow>
            {babies.map((b) => (
              <TextField key={b.id} label={b.name} value={form.doses[b.id]} onChange={(v) => setDose(b.id, v)} placeholder="1,2" mono />
            ))}
          </View>

          <Stepper label="Cada cuántas horas" value={form.everyHours + ' h'} onDec={() => setForm((f) => ({ ...f, everyHours: Math.max(1, f.everyHours - 1) }))} onInc={() => setForm((f) => ({ ...f, everyHours: f.everyHours + 1 }))} />
          <Stepper label="Máximo por día" value={form.maxDay} onDec={() => setForm((f) => ({ ...f, maxDay: Math.max(1, f.maxDay - 1) }))} onInc={() => setForm((f) => ({ ...f, maxDay: f.maxDay + 1 }))} />
          <Stepper label="Avisa antes (min)" value={form.remindMinutesBefore} onDec={() => setForm((f) => ({ ...f, remindMinutesBefore: Math.max(0, f.remindMinutesBefore - 5) }))} onInc={() => setForm((f) => ({ ...f, remindMinutesBefore: f.remindMinutesBefore + 5 }))} />

          <TextField label="Indicado por" value={form.doctor} onChange={(v) => setForm((f) => ({ ...f, doctor: v }))} placeholder="Dra. Pérez (pediatra)" />
          <DateField label="Fecha de la indicación" value={form.prescribedOn} onChange={(d) => setForm((f) => ({ ...f, prescribedOn: d }))} />
          <TextField label="Nota (opcional)" value={form.note} onChange={(v) => setForm((f) => ({ ...f, note: v }))} placeholder="Solo si pasa de 38,5 °C" />

          <View style={{ gap: 9 }}>
            <Eyebrow>Foto de la receta (opcional)</Eyebrow>
            {photoPreviewUrl ? (
              <Image source={{ uri: photoPreviewUrl }} style={{ width: '100%', height: 160, borderRadius: 12 }} resizeMode="cover" />
            ) : null}
            <View style={{ flexDirection: 'row', gap: 9 }}>
              <GhostButton style={{ flex: 1 }} onPress={handlePickPhoto} disabled={uploadingPhoto}>
                {uploadingPhoto ? 'Un momento…' : photoPreviewUrl ? 'Cambiar foto' : 'Agregar foto'}
              </GhostButton>
              {photoPreviewUrl ? (
                <DangerButton onPress={handleRemovePhoto} disabled={uploadingPhoto}>Quitar</DangerButton>
              ) : null}
            </View>
          </View>

          {form.id ? (
            <DangerButton onPress={handleDeactivate} disabled={saving}>Retirar esta medicina</DangerButton>
          ) : null}
          <GhostButton onPress={() => setView('list')}>Volver a la lista</GhostButton>
        </View>
      )}
    </SheetV2>
  );
}
export default EditPrescriptionSheet;
