import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@nocttua/theme/native';
import { Eyebrow, NightCard, MetricBar } from '../../components/v2/primitives';
import { FullScreenV2 } from '../../components/v2/MobileChrome';
import { getMyFamilyId, getBabies } from '../../data/family';
import { getDayRecords, buildDayRecords } from '../../data/dayRecords';
import { avgWindow, baseWakes, correlations } from '../../lib/derive';
import { dur, one } from '../../lib/time';
import { profileForBirthDate } from '../../data/profiles';
import { getMonthlyAndAnnualPackages, purchase, restorePurchases } from '../../lib/purchases';

// Anual = 25% off sobre 12 meses a $7,99 ($95,88) → $71,91/año, $5,99/mes equivalente.
const PLANS = [
  { id: 'mensual', name: 'Mensual', detail: 'Cancela cuando quieras', price: '$7,99', badge: '' },
  { id: 'anual', name: 'Anual', detail: '$71,91 al año · equivale a $5,99/mes', price: '$5,99', badge: 'Ahorras 25%' },
];

/**
 * Paywall — se regala el primer insight real, calculado con los propios
 * datos; los factores se ven desenfocados (existen, no qué dicen). Solo UI:
 * falta StoreKit/RevenueCat real, ver plan "Fases siguientes".
 */
export function PaywallScreen({ open, onClose, onSubscribe }) {
  const insets = useSafeAreaInsets();
  const [plan, setPlan] = useState('anual');
  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [packages, setPackages] = useState({ monthly: null, annual: null });
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const familyId = await getMyFamilyId();
      const babies = await getBabies(familyId);
      const { sleepEvents, feedEvents } = await getDayRecords(familyId, 7);
      if (cancelled) return;
      setProfile(profileForBirthDate(babies[0]?.birth_date));
      setRecords(buildDayRecords(sleepEvents, feedEvents, babies.map((b) => b.id)));
    })();
    getMonthlyAndAnnualPackages().then((pkgs) => { if (!cancelled) setPackages(pkgs); }).catch(() => {});
    return () => { cancelled = true; };
  }, [open]);

  const handleSubscribe = async () => {
    const pkg = plan === 'anual' ? packages.annual : packages.monthly;
    if (!pkg) {
      Alert.alert('No disponible por ahora', 'No pudimos cargar los planes — revisa tu conexión e intenta de nuevo.');
      return;
    }
    try {
      setPurchasing(true);
      const entitled = await purchase(pkg);
      if (entitled) {
        onSubscribe && onSubscribe();
        onClose && onClose();
      }
    } catch (err) {
      // userCancelled: el usuario cerró la hoja nativa de StoreKit — no es un error para mostrar.
      if (!err?.userCancelled) Alert.alert('No se pudo completar la compra', err?.message ?? String(err));
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setPurchasing(true);
      const entitled = await restorePurchases();
      if (entitled) {
        onSubscribe && onSubscribe();
        onClose && onClose();
      } else {
        Alert.alert('Nada para restaurar', 'No encontramos ninguna compra activa con esta cuenta de Apple.');
      }
    } catch (err) {
      Alert.alert('No se pudo restaurar', err?.message ?? String(err));
    } finally {
      setPurchasing(false);
    }
  };

  if (!open || !profile) return null;

  const win = Math.round(avgWindow(records));
  const wakes = baseWakes(records);
  const corr = correlations(records).slice(0, 4);

  return (
    <FullScreenV2>
      <ScrollView contentContainerStyle={{ gap: 13, paddingHorizontal: 20, paddingBottom: 6, paddingTop: 16 + insets.top }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Eyebrow>{records.length} días registrados</Eyebrow>
          <Pressable onPress={onClose} style={{ height: 30, width: 30, borderRadius: 99, borderWidth: 1, borderColor: '#DCD4C8', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, color: '#8A8299' }}>✕</Text>
          </Pressable>
        </View>

        <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 29, lineHeight: 29 * 1.12, color: '#16162B' }}>Ya tenemos suficiente para leer su sueño.</Text>

        <NightCard radius={18} style={{ padding: 16, gap: 11 }}>
          <Eyebrow tone="amber">Tu primer insight</Eyebrow>
          <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 22, lineHeight: 22 * 1.25, color: '#FBF7F0' }}>
            Llevan {dur(win)} despiertas antes de la siesta. Ahí está la noche.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, borderTopWidth: 1, borderTopColor: '#33335F', paddingTop: 11 }}>
            <View><Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 21, color: '#FBF7F0' }}>{dur(win)}</Text><Text style={{ fontSize: 11.5, color: '#8E87B5' }}>ventana real</Text></View>
            <View><Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 21, color: '#F0A868' }}>{profile.windowTarget}</Text><Text style={{ fontSize: 11.5, color: '#8E87B5' }}>objetivo edad</Text></View>
            <View><Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 21, color: '#FBF7F0' }}>{one(wakes)}</Text><Text style={{ fontSize: 11.5, color: '#8E87B5' }}>despertares</Text></View>
          </View>
          <Text style={{ fontSize: 13.5, lineHeight: 13.5 * 1.5, color: '#B9B2C9' }}>
            Con {records.length} días ya podemos separar lo que es casualidad de lo que es patrón.
          </Text>
        </NightCard>

        {corr.length > 0 ? (
          <View style={{ borderRadius: 18, overflow: 'hidden' }}>
            <View pointerEvents="none" style={{ opacity: 0.4, gap: 12, borderRadius: 18, borderWidth: 1, borderColor: '#E4DCD0', backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 15 }}>
              <Text style={{ fontSize: 15.5, fontWeight: '500', color: '#16162B' }}>Qué está pesando en la noche</Text>
              {corr.map((c) => <MetricBar key={c.label} label={c.label} value={c.value} pct={c.pct} color={c.color} />)}
            </View>
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, top: '30%', backgroundColor: 'rgba(251,247,240,.94)' }} />
            <View style={{ position: 'absolute', bottom: 12, left: 0, right: 0, alignItems: 'center', gap: 5 }}>
              <View style={{ height: 30, width: 30, borderRadius: 99, alignItems: 'center', justifyContent: 'center', backgroundColor: '#16162B' }}>
                <Text style={{ fontSize: 13, color: '#F0A868' }}>✦</Text>
              </View>
              <Text style={{ fontSize: 13, color: '#4A4459' }}>Desbloquea los {corr.length} factores que estamos midiendo</Text>
            </View>
          </View>
        ) : null}

        <View style={{ gap: 9 }}>
          {PLANS.map((pl) => {
            const on = plan === pl.id;
            return (
              <Pressable
                key={pl.id}
                onPress={() => setPlan(pl.id)}
                style={{ borderRadius: 15, paddingHorizontal: 15, paddingVertical: 14, backgroundColor: on ? '#F6F1FB' : 'white', borderWidth: on ? 1.5 : 1, borderColor: on ? '#6B5DD3' : '#DCD4C8' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                    <View style={{ marginTop: 1, height: 20, width: 20, borderRadius: 99, borderWidth: 1.5, borderColor: on ? '#6B5DD3' : '#DCD4C8', alignItems: 'center', justifyContent: 'center' }}>
                      {on ? <View style={{ height: 10, width: 10, borderRadius: 99, backgroundColor: '#6B5DD3' }} /> : null}
                    </View>
                    <View style={{ gap: 2 }}>
                      <Text style={{ fontSize: 15.5, fontWeight: '500', color: '#16162B' }}>{pl.name}</Text>
                      <Text style={{ fontSize: 12.5, lineHeight: 12.5 * 1.4, color: '#8A8299' }}>{pl.detail}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 3 }}>
                    <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 17, color: '#16162B' }}>{pl.price}</Text>
                    {pl.badge ? (
                      <View style={{ borderRadius: 99, backgroundColor: '#DCEDE4', paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 11, color: '#3F7A62' }}>{pl.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={{ gap: 8, borderTopWidth: 1, borderTopColor: '#F0EAE0', backgroundColor: '#FBF7F0', paddingHorizontal: 20, paddingBottom: 22 + insets.bottom, paddingTop: 10 }}>
        <Pressable
          onPress={handleSubscribe}
          disabled={purchasing}
          style={{ minHeight: 52, borderRadius: 14, backgroundColor: purchasing ? '#8A8299' : '#16162B', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 16.5, fontFamily: theme.fontFamily.uiAppMedium, fontWeight: '500', color: '#FBF7F0' }}>
            {purchasing ? 'Procesando…' : 'Empezar · ' + (plan === 'anual' ? '$5,99' : '$7,99') + ' al mes'}
          </Text>
        </Pressable>
        <Text style={{ textAlign: 'center', fontSize: 11.5, lineHeight: 11.5 * 1.45, color: '#A9A2B5' }}>
          Tus registros y tu historial siguen siendo tuyos y gratis. Si tu asesora te invita con su código, las analíticas quedan incluidas sin costo.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
          <Pressable onPress={onClose} style={{ borderRadius: 99, borderWidth: 1, borderColor: '#DCD4C8', paddingHorizontal: 16, paddingVertical: 10 }}>
            <Text style={{ textAlign: 'center', fontSize: 14, color: '#4A4459' }}>Seguir registrando sin analíticas</Text>
          </Pressable>
          <Pressable onPress={handleRestore} disabled={purchasing} style={{ borderRadius: 99, borderWidth: 1, borderColor: '#DCD4C8', paddingHorizontal: 16, paddingVertical: 10 }}>
            <Text style={{ textAlign: 'center', fontSize: 14, color: '#4A4459' }}>Restaurar compras</Text>
          </Pressable>
        </View>
      </View>
    </FullScreenV2>
  );
}
export default PaywallScreen;
