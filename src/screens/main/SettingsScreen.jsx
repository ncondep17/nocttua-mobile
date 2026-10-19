import { useCallback, useState } from 'react';
import { View, Text, Alert, Linking, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { theme } from '@nocttua/theme/native';
import { ScreenScroll } from '../../components/layout/ScreenScroll';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { Card } from '../../components/core/Card';
import { Button } from '../../components/core/Button';
import { TextField } from '../../components/forms/TextArea';
import { DateField } from '../../components/forms/DateField';
import { getMyFamilyId, getBabies, updateBaby, addBaby, deleteBaby, getMyProfileAndRelationship, updateMyDisplayName, setMyRelationship, getFeedingMode, updateFeedingMode, deleteMyAccount } from '../../data/family';
import { supabase } from '../../lib/supabase';
import { TERMS_URL, PRIVACY_URL, SUPPORT_URL } from '../../lib/legalLinks';

const PERMISSION_COPY = {
  granted: 'Activados.',
  denied: 'Desactivados — se cambia desde Ajustes del sistema, la app no puede reactivarlos por ti.',
  undetermined: 'Todavía no los activaste.',
};

const RELATIONSHIP_OPTIONS = [
  { id: 'mama', label: 'Mamá' },
  { id: 'papa', label: 'Papá' },
  { id: 'ninera', label: 'Niñera' },
  { id: 'otro', label: 'Otro' },
];

const GENDER_OPTIONS = [{ id: 'niña', label: 'Niña' }, { id: 'niño', label: 'Niño' }];

function toEdits(babies) {
  return Object.fromEntries(babies.map((b) => [b.id, { name: b.name, birthDate: b.birth_date ? new Date(b.birth_date) : new Date(), gender: b.gender ?? null }]));
}

function GenderPicker({ value, onChange }) {
  return (
    <View style={{ gap: theme.space[3] }}>
      <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.sm, color: theme.color.tintaTenue }}>Género</Text>
      <View style={{ flexDirection: 'row', gap: theme.space[4] }}>
        {GENDER_OPTIONS.map((o) => {
          const on = value === o.id;
          return (
            <Pressable
              key={o.id}
              onPress={() => onChange(o.id)}
              style={{
                flex: 1, minHeight: 38, borderRadius: theme.radius.pill, alignItems: 'center', justifyContent: 'center',
                borderWidth: on ? 1.5 : 1, borderColor: on ? theme.color.violeta600 : theme.color.cremaLineStrong,
                backgroundColor: on ? theme.color.violeta50 : theme.color.white,
              }}
            >
              <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.base, color: on ? theme.color.violeta600 : theme.color.tintaCuerpo }}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function SettingsScreen({ onClose, onOpenSleepPlan }) {
  const [familyId, setFamilyId] = useState(null);
  const [babies, setBabies] = useState([]);
  const [edits, setEdits] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [permission, setPermission] = useState('undetermined');
  const [myName, setMyName] = useState('');
  const [savedName, setSavedName] = useState('');
  const [myRelationship, setLocalRelationship] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [addingBaby, setAddingBaby] = useState(false);
  const [newBabyName, setNewBabyName] = useState('');
  const [newBabyBirth, setNewBabyBirth] = useState(new Date());
  const [newBabyGender, setNewBabyGender] = useState(null);
  const [savingNewBaby, setSavingNewBaby] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [feedingMode, setFeedingMode] = useState('breastfeeding');
  const [savingFeedingMode, setSavingFeedingMode] = useState(false);

  const load = useCallback(async () => {
    const fid = await getMyFamilyId();
    setFamilyId(fid);
    const [data, profile, mode] = await Promise.all([getBabies(fid), getMyProfileAndRelationship(), getFeedingMode(fid)]);
    setBabies(data);
    setEdits(toEdits(data));
    setMyName(profile.displayName);
    setSavedName(profile.displayName);
    setLocalRelationship(profile.relationship);
    setFeedingMode(mode);
    const { status } = await Notifications.getPermissionsAsync();
    setPermission(status);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const updateEdit = (babyId, patch) => setEdits((prev) => ({ ...prev, [babyId]: { ...prev[babyId], ...patch } }));

  const isDirty = (b) => {
    const e = edits[b.id];
    if (!e) return false;
    return e.name !== b.name || e.birthDate.toISOString().slice(0, 10) !== b.birth_date || e.gender !== (b.gender ?? null);
  };

  const handleSave = async (babyId) => {
    try {
      setSavingId(babyId);
      await updateBaby(babyId, edits[babyId]);
      await load();
    } catch (err) {
      Alert.alert('No se pudo guardar', err.message ?? String(err));
    } finally {
      setSavingId(null);
    }
  };

  const handleAddBaby = async () => {
    if (!newBabyName.trim()) return;
    const tone = ['a', 'b'].find((t) => !babies.some((b) => b.tone === t));
    try {
      setSavingNewBaby(true);
      await addBaby(familyId, { name: newBabyName, birthDate: newBabyBirth, tone, gender: newBabyGender });
      setAddingBaby(false);
      setNewBabyName('');
      setNewBabyBirth(new Date());
      setNewBabyGender(null);
      await load();
    } catch (err) {
      Alert.alert('No se pudo agregar', err.message ?? String(err));
    } finally {
      setSavingNewBaby(false);
    }
  };

  const handleDeleteBaby = (baby) => {
    Alert.alert(
      '¿Eliminar a ' + baby.name + '?',
      'Se borra junto con todo su historial de sueño, tomas y medicinas. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive', onPress: async () => {
            try {
              setDeletingId(baby.id);
              await deleteBaby(baby.id);
              await load();
            } catch (err) {
              Alert.alert('No se pudo eliminar', err.message ?? String(err));
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      if (myName.trim() && myName !== savedName) await updateMyDisplayName(myName);
      if (myRelationship) await setMyRelationship(myRelationship);
      await load();
    } catch (err) {
      Alert.alert('No se pudo guardar', err.message ?? String(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleFeedingMode = async (mode) => {
    if (mode === feedingMode) return;
    setFeedingMode(mode);
    try {
      setSavingFeedingMode(true);
      await updateFeedingMode(familyId, mode);
    } catch (err) {
      setFeedingMode(feedingMode);
      Alert.alert('No se pudo guardar', err.message ?? String(err));
    } finally {
      setSavingFeedingMode(false);
    }
  };

  const handleNotifications = async () => {
    if (permission === 'undetermined') {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermission(status);
      return;
    }
    Linking.openSettings();
  };

  const handleSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Segura/o?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  };

  const handleDeleteAccount = () => {
    const familyNote = babies.length > 0
      ? ' Si eres la única persona en tu família, también se borran ' + (babies.length === 1 ? 'los datos de ' + babies[0].name : 'los datos de tus bebés') + ': sueño, tomas, medicinas, todo.'
      : '';
    Alert.alert(
      '¿Eliminar tu cuenta?',
      'No se puede deshacer.' + familyNote + ' Si compartes família con alguien más, sus datos siguen intactos — solo se va tu acceso.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar cuenta', style: 'destructive', onPress: () => {
            Alert.alert('¿Estás segura/o?', 'Esta es la última confirmación — tu cuenta se borra ahora mismo.', [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Sí, eliminar', style: 'destructive', onPress: async () => {
                  try {
                    setDeletingAccount(true);
                    await deleteMyAccount();
                    await supabase.auth.signOut();
                  } catch (err) {
                    setDeletingAccount(false);
                    Alert.alert('No se pudo eliminar', err.message ?? String(err));
                  }
                },
              },
            ]);
          },
        },
      ],
    );
  };

  return (
    <ScreenScroll>
      <ScreenHeader
        eyebrow="Tu cuenta"
        title="Ajustes"
        action={
          <Text onPress={onClose} style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.base, color: theme.color.violeta600 }}>
            Listo
          </Text>
        }
      />

      <Card title="Tu perfil">
        <TextField label="Tu nombre" value={myName} onChange={setMyName} placeholder="Cómo te llamas" />
        <View style={{ gap: theme.space[4] }}>
          <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.sm, color: theme.color.tintaTenue }}>Tu rol</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[4] }}>
            {RELATIONSHIP_OPTIONS.map((o) => {
              const on = myRelationship === o.id;
              return (
                <Pressable
                  key={o.id}
                  onPress={() => setLocalRelationship(o.id)}
                  style={{
                    borderRadius: theme.radius.pill, paddingHorizontal: theme.space[7], paddingVertical: theme.space[4], minHeight: 38, justifyContent: 'center',
                    borderWidth: on ? 1.5 : 1, borderColor: on ? theme.color.violeta600 : theme.color.cremaLineStrong,
                    backgroundColor: on ? theme.color.violeta50 : theme.color.white,
                  }}
                >
                  <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.base, color: on ? theme.color.violeta600 : theme.color.tintaCuerpo }}>{o.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Button variant="secondary" disabled={savingProfile} onPress={handleSaveProfile}>Guardar</Button>
      </Card>

      <Card title="Bebés">
        <View style={{ gap: theme.space[9] }}>
          {babies.map((b) => (
            <View key={b.id} style={{ gap: theme.space[6] }}>
              <TextField label="Nombre" value={edits[b.id]?.name ?? ''} onChange={(v) => updateEdit(b.id, { name: v })} placeholder="Nombre" />
              <DateField label="Fecha de nacimiento" value={edits[b.id]?.birthDate ?? new Date()} onChange={(v) => updateEdit(b.id, { birthDate: v })} />
              <GenderPicker value={edits[b.id]?.gender ?? null} onChange={(v) => updateEdit(b.id, { gender: v })} />
              <View style={{ flexDirection: 'row', gap: theme.space[4] }}>
                <Button
                  variant="secondary" style={{ flex: 1 }}
                  disabled={savingId === b.id || !edits[b.id]?.name?.trim() || !isDirty(b)}
                  onPress={() => handleSave(b.id)}
                >
                  Guardar
                </Button>
                <Button variant="danger" disabled={deletingId === b.id} onPress={() => handleDeleteBaby(b)}>
                  Eliminar
                </Button>
              </View>
            </View>
          ))}

          {babies.length < 2 ? (
            addingBaby ? (
              <View style={{ gap: theme.space[6] }}>
                <TextField label="Nombre" value={newBabyName} onChange={setNewBabyName} placeholder="Nombre" />
                <DateField label="Fecha de nacimiento" value={newBabyBirth} onChange={setNewBabyBirth} />
                <GenderPicker value={newBabyGender} onChange={setNewBabyGender} />
                <View style={{ flexDirection: 'row', gap: theme.space[4] }}>
                  <Button variant="secondary" style={{ flex: 1 }} disabled={savingNewBaby || !newBabyName.trim()} onPress={handleAddBaby}>
                    Agregar
                  </Button>
                  <Button variant="ghost" onPress={() => { setAddingBaby(false); setNewBabyName(''); }}>
                    Cancelar
                  </Button>
                </View>
              </View>
            ) : (
              <Button variant="secondary" onPress={() => setAddingBaby(true)}>＋ Agregar bebé</Button>
            )
          ) : null}
        </View>
      </Card>

      <Card title="Horarios y plan">
        <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.base, color: theme.color.tintaCuerpo }}>
          El despertar, la hora de acostarse y las siestas que Hoy usa para sugerir horarios.
        </Text>
        <Button variant="secondary" onPress={onOpenSleepPlan}>Editar horarios</Button>
      </Card>

      <Card title="Alimentación">
        <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.sm, color: theme.color.tintaTenue }}>
          Define qué ves en Leche — sin lactancia ni extracción, esa sección no aplica.
        </Text>
        <View style={{ gap: theme.space[4] }}>
          {[
            { id: 'breastfeeding', label: 'Lactancia y/o extracción', hint: 'Incluye pecho, biberón, extracción y banco de leche.' },
            { id: 'bottle_only', label: 'Solo biberón', hint: 'Sin lactancia ni extracción — Leche no muestra esas secciones.' },
          ].map((o) => {
            const on = feedingMode === o.id;
            return (
              <Pressable
                key={o.id}
                onPress={() => handleFeedingMode(o.id)}
                disabled={savingFeedingMode}
                style={{
                  gap: 3, borderRadius: theme.radius.md, padding: theme.space[7],
                  borderWidth: on ? 1.5 : 1, borderColor: on ? theme.color.violeta600 : theme.color.cremaLineStrong,
                  backgroundColor: on ? theme.color.violeta50 : theme.color.white,
                }}
              >
                <Text style={{ fontFamily: theme.fontFamily.uiAppMedium, fontWeight: '500', fontSize: theme.fontSize.base, color: theme.color.tintaFuerte }}>{o.label}</Text>
                <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.sm, color: theme.color.tintaTenue }}>{o.hint}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card title="Notificaciones">
        <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.base, color: theme.color.tintaCuerpo }}>
          {PERMISSION_COPY[permission]}
        </Text>
        <Button variant="secondary" onPress={handleNotifications}>
          {permission === 'undetermined' ? 'Activar avisos' : 'Abrir Ajustes del sistema'}
        </Button>
      </Card>

      <Card title="Legal">
        <View style={{ gap: theme.space[5] }}>
          <Text onPress={() => Linking.openURL(PRIVACY_URL)} style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.base, color: theme.color.violeta600 }}>
            Política de privacidad
          </Text>
          <Text onPress={() => Linking.openURL(TERMS_URL)} style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.base, color: theme.color.violeta600 }}>
            Términos de uso
          </Text>
          <Text onPress={() => Linking.openURL(SUPPORT_URL)} style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.base, color: theme.color.violeta600 }}>
            Soporte
          </Text>
        </View>
      </Card>

      <Button variant="danger" size="lg" full onPress={handleSignOut}>Cerrar sesión</Button>

      <Card title="Eliminar cuenta">
        <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.base, color: theme.color.tintaCuerpo }}>
          Borra tu cuenta y tu acceso por completo. Si eres la única persona en tu família, también se borran los datos de tus bebés — sueño, tomas, medicinas, todo. No se puede deshacer.
        </Text>
        <Button variant="danger" disabled={deletingAccount} onPress={handleDeleteAccount}>
          {deletingAccount ? 'Eliminando…' : 'Eliminar mi cuenta'}
        </Button>
      </Card>
    </ScreenScroll>
  );
}
export default SettingsScreen;
