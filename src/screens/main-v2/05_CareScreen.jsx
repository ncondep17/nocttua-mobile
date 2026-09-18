import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Share, Alert, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@nocttua/theme/native';
import { ScreenTitle, NightCard, Eyebrow, PrimaryButton, DangerButton } from '../../components/v2/primitives';
import { SheetV2, ScreenBody } from '../../components/v2/MobileChrome';
import { MedsPrescriptionCard } from '../../components/v2/MedsPrescriptionCard';
import { getMyFamilyId, getBabies, getTeamMembers, getLatestPlan, createInvite, updateMemberPermission, removeMember, redeemAdvisorInvite, setNightShiftToday } from '../../data/family';
import { getPrescriptions, setPrescriptionInUse, getDosesSince } from '../../data/meds';
import { getDayRecords, buildDayRecords } from '../../data/dayRecords';
import { correlations } from '../../lib/derive';
import { profileForBirthDate } from '../../data/profiles';
import { supabase } from '../../lib/supabase';
import { useNowTick } from '../../lib/useNowTick';

const RELATIONSHIP_LABEL = { mama: 'Mamá', papa: 'Papá', ninera: 'Niñera', otro: 'Otro' };
const ROLE_LABEL = { caregiver: 'Cuidador/a', coach: 'Asesora' };
const ACCESS_LEVELS = [
  { id: 'full', label: 'Acceso total', hint: 'Puede invitar, editar bebés y ver todo. Para papá, mamá, niñera.' },
  { id: 'reports', label: 'Solo analíticas', hint: 'Ve los registros y patrones, no puede editar nada. Para una asesora que arma el plan aparte.' },
  { id: 'plan', label: 'Solo el plan', hint: 'Ve y publica el plan vigente, sin ver el resto de las analíticas.' },
];

/**
 * Equipo — miembros, permisos, plan vigente y lo que está "fuera del sueño".
 *
 * La pantalla reúne temas distintos: debajo del plan y de los factores a
 * vigilar hay un separador FUERA DEL SUEÑO y ahí vive el botiquín. Todo lo
 * de sueño arriba, todo lo demás abajo.
 */
export function CareScreen({ onOpenSettings, onEditMeds, onMedsChanged, onOpenTreatment, refreshKey }) {
  useNowTick();
  const todayStr = new Date().toISOString().slice(0, 10);
  const [myId, setMyId] = useState(null);
  const [babies, setBabies] = useState([]);
  const [members, setMembers] = useState([]);
  const [plan, setPlan] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [doses, setDoses] = useState([]);
  const [babyLabel, setBabyLabel] = useState('');
  const [inviteCode, setInviteCode] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [choosingLevel, setChoosingLevel] = useState(false);
  const [inviteLevel, setInviteLevel] = useState('full');
  const [managing, setManaging] = useState(null); // { userId, name, level }
  const [saving, setSaving] = useState(false);
  const [joiningAdvisor, setJoiningAdvisor] = useState(false);
  const [advisorCodeInput, setAdvisorCodeInput] = useState('');
  const [redeemingAdvisor, setRedeemingAdvisor] = useState(false);

  const load = useCallback(async () => {
    const [fid, { data: session }] = await Promise.all([getMyFamilyId(), supabase.auth.getSession()]);
    setMyId(session.session?.user?.id ?? null);
    const [babiesData, team, latestPlan, { sleepEvents, feedEvents }, meds, dosesData] = await Promise.all([
      getBabies(fid), getTeamMembers(fid), getLatestPlan(fid), getDayRecords(fid, 7), getPrescriptions(fid),
      getDosesSince(fid, new Date(Date.now() - 5 * 86400000)),
    ]);
    setBabies(babiesData);
    setBabyLabel(babiesData.map((b) => b.name).join(' & '));
    setMembers(team);
    setPlan(latestPlan);
    setPrescriptions(meds);
    setDoses(dosesData);
    const profile = profileForBirthDate(babiesData[0]?.birth_date);
    const records = buildDayRecords(sleepEvents, feedEvents, babiesData.map((b) => b.id));
    const corr = correlations(records).slice(0, 2).map((c) => c.label);
    setWatchlist([profile.watch, ...corr]);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // refreshKey sube cada vez que se guarda algo desde una hoja del shell
  // (sueño, toma, pañal, medicinas) mientras esta pestaña sigue montada en
  // segundo plano — antes esto remontaba la pantalla entera (key={refreshKey}
  // en MainTabs), perdiendo el scroll y mostrando el loading de nuevo cada
  // vez. Ahora solo se refetchean los datos.
  const isFirstRefresh = useRef(true);
  useEffect(() => {
    if (isFirstRefresh.current) { isFirstRefresh.current = false; return; }
    load();
  }, [refreshKey, load]);

  const handleToggleInUse = async (id, inUse) => {
    setPrescriptions((prev) => prev.map((p) => (p.id === id ? { ...p, inUse } : p)));
    try {
      await setPrescriptionInUse(id, inUse);
      // FamilyShell tiene su propia copia de prescriptions para el plan de
      // dosis y las notificaciones (MedsSheet) — sin este aviso quedaba
      // desactualizada hasta el próximo mount, mismo tipo de bug que ya
      // encontramos con el modo enfermedad.
      onMedsChanged && onMedsChanged();
    } catch (err) {
      setPrescriptions((prev) => prev.map((p) => (p.id === id ? { ...p, inUse: !inUse } : p)));
      Alert.alert('No se pudo guardar', err.message ?? String(err));
    }
  };

  const handleInvite = async (level) => {
    try {
      setInviting(true);
      setInviteCode(await createInvite(level));
      setChoosingLevel(false);
    } catch (err) {
      Alert.alert('No se pudo generar el código', err.message ?? String(err));
    } finally {
      setInviting(false);
    }
  };

  const handleRedeemAdvisorCode = async () => {
    try {
      setRedeemingAdvisor(true);
      await redeemAdvisorInvite(advisorCodeInput.trim());
      setJoiningAdvisor(false);
      setAdvisorCodeInput('');
      await load();
    } catch (err) {
      Alert.alert('No se pudo vincular', err.message ?? String(err));
    } finally {
      setRedeemingAdvisor(false);
    }
  };

  const handleSavePermission = async () => {
    try {
      setSaving(true);
      await updateMemberPermission(managing.userId, managing.level);
      setManaging(null);
      await load();
    } catch (err) {
      Alert.alert('No se pudo guardar', err.message ?? String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNightShift = async () => {
    try {
      setSaving(true);
      await setNightShiftToday(managing.userId, !managing.onDuty);
      setManaging((m) => ({ ...m, onDuty: !m.onDuty }));
      await load();
    } catch (err) {
      Alert.alert('No se pudo guardar', err.message ?? String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => {
    Alert.alert('¿Quitar del equipo?', managing.name + ' va a perder el acceso a los registros.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar', style: 'destructive', onPress: async () => {
          try {
            setSaving(true);
            await removeMember(managing.userId);
            setManaging(null);
            await load();
          } catch (err) {
            Alert.alert('No se pudo quitar', err.message ?? String(err));
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  return (
    <ScreenBody gap={14}>
      <ScreenTitle
        eyebrow={babyLabel + ' · ' + members.length + (members.length === 1 ? ' persona' : ' personas')}
        title="Equipo"
        action={<Pressable onPress={onOpenSettings}><Ionicons name="settings-outline" size={20} color="#16162B" /></Pressable>}
      />

      <View style={{ gap: 7 }}>
        {members.map((m) => {
          const isMe = m.profiles.id === myId;
          const isCoach = m.profiles.role === 'coach';
          return (
            <Pressable
              key={m.profiles.id}
              disabled={isMe}
              onPress={() => setManaging({ userId: m.profiles.id, name: m.profiles.display_name || 'Sin nombre', level: m.permission_level, onDuty: (m.night_shift_dates ?? []).includes(todayStr) })}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 15, paddingHorizontal: 13, paddingVertical: 11,
                backgroundColor: isCoach ? '#16162B' : 'white',
                borderWidth: isCoach ? 0 : 1, borderColor: '#EFD9BC',
              }}
            >
              <View style={{ width: 34, height: 34, borderRadius: 99, alignItems: 'center', justifyContent: 'center', backgroundColor: isCoach ? '#2A2848' : isMe ? '#6B5DD3' : '#C2703F' }}>
                <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 13, color: isCoach ? '#A79FE0' : '#FBF7F0' }}>
                  {m.profiles.initial || m.profiles.display_name?.[0] || '?'}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '600', color: isCoach ? '#FBF7F0' : '#16162B' }}>{m.profiles.display_name || 'Sin nombre'}{isMe ? ' (tú)' : ''}</Text>
                <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10, color: (m.night_shift_dates ?? []).includes(todayStr) ? '#B08A55' : isCoach ? '#8E87B5' : '#8A8299' }}>
                  {(m.night_shift_dates ?? []).includes(todayStr)
                    ? 'turno de noche hoy'
                    : isCoach ? 've el expediente completo' : (m.relationship ? RELATIONSHIP_LABEL[m.relationship] ?? m.relationship : ROLE_LABEL[m.profiles.role])}
                </Text>
              </View>
              <View style={{ borderRadius: 99, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: isCoach ? '#2A2848' : '#EFE9DF' }}>
                <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase', color: isCoach ? '#A79FE0' : '#6A6478' }}>
                  {isCoach ? 'Asesora' : m.permission_level === 'full' ? 'Admin' : 'Cuidadora'}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={{ borderRadius: 16, borderWidth: 1, borderColor: '#E4DCD0', backgroundColor: 'white', overflow: 'hidden' }}>
        <Pressable onPress={() => { setInviteLevel('full'); setChoosingLevel(true); }} disabled={inviting} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F0EAE0' }}>
          <Text style={{ fontSize: 15, color: '#6B5DD3' }}>＋ Invitar cuidador o asesora</Text>
          <Text style={{ fontSize: 15, color: '#C9C1D8' }}>›</Text>
        </Pressable>
        <Pressable onPress={() => { setAdvisorCodeInput(''); setJoiningAdvisor(true); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 13 }}>
          <Text style={{ fontSize: 15, color: '#6B5DD3' }}>Tengo un código de mi asesora</Text>
          <Text style={{ fontSize: 15, color: '#C9C1D8' }}>›</Text>
        </Pressable>
      </View>

      {plan ? (
        <NightCard style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Eyebrow tone="amber">Plan vigente · {plan.version_label}</Eyebrow>
            <Text style={{ fontSize: 13, color: '#8E87B5' }}>{plan.profiles?.display_name}</Text>
          </View>
          {plan.fields.map((f) => (
            <View key={f.key} style={{ gap: 2 }}>
              <Text style={{ fontSize: 13, color: '#B9B2C9' }}>{f.label}</Text>
              <Text style={{ fontSize: 14.5, lineHeight: 14.5 * 1.4, color: '#FBF7F0' }}>{f.value}</Text>
            </View>
          ))}
          <Text style={{ borderTopWidth: 1, borderTopColor: '#33335F', paddingTop: 11, fontSize: 14, lineHeight: 14 * 1.45, color: '#8E87B5' }}>
            Todos ven el mismo plan. Solo tu asesora puede editarlo.
          </Text>
        </NightCard>
      ) : (
        <NightCard style={{ gap: 8 }}>
          <Eyebrow tone="amber">Plan vigente</Eyebrow>
          <Text style={{ fontSize: 14.5, lineHeight: 14.5 * 1.4, color: '#FBF7F0' }}>Todavía no hay un plan. Si trabajas con una asesora de sueño, invítala aquí arriba y va a aparecer.</Text>
        </NightCard>
      )}

      {watchlist.length > 0 ? (
        <View style={{ gap: 9, borderRadius: 16, borderWidth: 1, borderColor: '#EFDCC4', backgroundColor: '#FFF9F0', paddingHorizontal: 15, paddingVertical: 14 }}>
          <Eyebrow tone="brown">Factores a vigilar</Eyebrow>
          {watchlist.map((w) => (
            <View key={w} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 9 }}>
              <Text style={{ color: '#B08A55' }}>·</Text>
              <Text style={{ flex: 1, fontSize: 14.5, lineHeight: 14.5 * 1.45, color: '#4A4459' }}>{w}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Frontera de la pestaña: arriba sueño, abajo lo demás. */}
      <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <Eyebrow>Fuera del sueño</Eyebrow>
        <View style={{ height: 1, flex: 1, backgroundColor: '#DCD4C8' }} />
      </View>

      <MedsPrescriptionCard
        prescriptions={prescriptions} babies={babies} doses={doses} now={new Date()}
        onEdit={onEditMeds} onToggleInUse={handleToggleInUse}
        onOpenTreatment={(id) => onOpenTreatment && onOpenTreatment(id)}
      />

      <SheetV2
        open={choosingLevel}
        onClose={() => setChoosingLevel(false)}
        title="¿Con qué acceso?"
        footer={<PrimaryButton style={{ flex: 1 }} onPress={() => handleInvite(inviteLevel)} disabled={inviting}>Generar código</PrimaryButton>}
      >
        <View style={{ gap: 9 }}>
          {ACCESS_LEVELS.map((lv) => (
            <Pressable
              key={lv.id}
              onPress={() => setInviteLevel(lv.id)}
              style={{
                gap: 5, borderRadius: 14, padding: 13,
                borderWidth: inviteLevel === lv.id ? 1.5 : 1, borderColor: inviteLevel === lv.id ? '#6B5DD3' : '#DCD4C8',
                backgroundColor: inviteLevel === lv.id ? '#F6F1FB' : 'white',
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#16162B' }}>{lv.label}</Text>
              <Text style={{ fontSize: 13, lineHeight: 13 * 1.4, color: '#8A8299' }}>{lv.hint}</Text>
            </Pressable>
          ))}
        </View>
      </SheetV2>

      <SheetV2
        open={!!managing}
        onClose={() => setManaging(null)}
        title={managing?.name}
        footer={<PrimaryButton style={{ flex: 1 }} onPress={handleSavePermission} disabled={saving}>Guardar</PrimaryButton>}
      >
        {managing ? (
          <View style={{ gap: 9 }}>
            {ACCESS_LEVELS.map((lv) => (
              <Pressable
                key={lv.id}
                onPress={() => setManaging((m) => ({ ...m, level: lv.id }))}
                style={{
                  gap: 5, borderRadius: 14, padding: 13,
                  borderWidth: managing.level === lv.id ? 1.5 : 1, borderColor: managing.level === lv.id ? '#6B5DD3' : '#DCD4C8',
                  backgroundColor: managing.level === lv.id ? '#F6F1FB' : 'white',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#16162B' }}>{lv.label}</Text>
                <Text style={{ fontSize: 13, lineHeight: 13 * 1.4, color: '#8A8299' }}>{lv.hint}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={handleToggleNightShift}
              disabled={saving}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, padding: 13,
                borderWidth: 1, borderColor: managing.onDuty ? '#EFD9BC' : '#DCD4C8', backgroundColor: managing.onDuty ? '#FFF9F0' : 'white',
              }}
            >
              <View style={{ gap: 2 }}>
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#16162B' }}>Turno de noche hoy</Text>
                <Text style={{ fontSize: 13, lineHeight: 13 * 1.4, color: '#8A8299' }}>Se muestra en Equipo, para saber a quién le toca.</Text>
              </View>
              <View style={{ width: 44, height: 26, borderRadius: 99, backgroundColor: managing.onDuty ? '#F0A868' : '#DCD4C8', padding: 3, justifyContent: 'center' }}>
                <View style={{ width: 20, height: 20, borderRadius: 99, backgroundColor: 'white', alignSelf: managing.onDuty ? 'flex-end' : 'flex-start' }} />
              </View>
            </Pressable>
            <DangerButton onPress={handleRemove} disabled={saving} minH={44}>Quitar del equipo</DangerButton>
          </View>
        ) : null}
      </SheetV2>

      <SheetV2
        open={!!inviteCode}
        onClose={() => setInviteCode(null)}
        title="Comparte este código"
        footer={<PrimaryButton style={{ flex: 1 }} onPress={() => Share.share({ message: `Únete a nuestra família en Nocttua con este código: ${inviteCode}` })}>Compartir</PrimaryButton>}
      >
        <View style={{ alignItems: 'center', paddingVertical: 30 }}>
          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 27, letterSpacing: 4, color: '#16162B' }}>{inviteCode}</Text>
        </View>
      </SheetV2>

      <SheetV2
        open={joiningAdvisor}
        onClose={() => setJoiningAdvisor(false)}
        title="Vincula a tu asesora"
        footer={
          <PrimaryButton style={{ flex: 1 }} onPress={handleRedeemAdvisorCode} disabled={redeemingAdvisor || advisorCodeInput.trim().length < 6}>
            Vincular
          </PrimaryButton>
        }
      >
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 14, lineHeight: 14 * 1.4, color: '#4A4459' }}>
            Ingresa el código de 6 caracteres que te compartió tu asesora. Se suma a tu equipo con el acceso que ella eligió, sin tocar tus bebés ni tu historial.
          </Text>
          <TextInput
            value={advisorCodeInput}
            onChangeText={(t) => setAdvisorCodeInput(t.toUpperCase())}
            placeholder="ABC123"
            placeholderTextColor="#B9B2C9"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            style={{
              fontFamily: theme.fontFamily.mono, fontSize: 22, letterSpacing: 4, textAlign: 'center',
              color: '#16162B', borderWidth: 1, borderColor: '#DCD4C8', borderRadius: 13,
              paddingVertical: 14, backgroundColor: 'white',
            }}
          />
        </View>
      </SheetV2>
    </ScreenBody>
  );
}
export default CareScreen;
