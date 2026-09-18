import { useCallback, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '@nocttua/theme/native';
import { ScreenTitle, NightCard, Eyebrow } from '../../components/v2/primitives';
import { ScreenBody } from '../../components/v2/MobileChrome';
import { ReferenceCards } from '../../components/v2/ReferenceCards';
import { getGuideCategories, getGuideTips, tipsForAge } from '../../data/guide';
import { getMyFamilyId, getBabies, hasLinkedCoach } from '../../data/family';
import { getDayRecords, buildDayRecords } from '../../data/dayRecords';
import { avgLatency, avgNightFeeds } from '../../lib/derive';
import { profileForBirthDate, getProfile } from '../../data/profiles';
import { dur, one } from '../../lib/time';

const FEATURED_TITLES = ['Cuánto tarda en dormirse te dice si la hora está bien', 'La pregunta no es si comió, es si le tocaba', 'Con mellizas, la silla va en el medio'];

/**
 * Tips — recordatorios cortos, NO un plan. El plan siempre viene de la
 * asesora (pestaña Cuidado); esta pantalla nunca prescribe, recuerda.
 *
 * Arriba de "Por tema" van las tablas de referencia (ventanas por edad, un
 * día de ejemplo, regresiones). `previewProfile` es solo de esas tres
 * tarjetas: tocar otra edad ahí no cambia el perfil real del bebé, que sigue
 * viniendo de su fecha de nacimiento.
 */
export function TipsScreen({ onGoTeam }) {
  const [cats, setCats] = useState([]);
  const [tips, setTips] = useState([]);
  const [profile, setProfile] = useState(null);
  const [previewProfileId, setPreviewProfileId] = useState(null);
  const [records, setRecords] = useState([]);
  const [hasCoach, setHasCoach] = useState(false);
  const [cat, setCat] = useState('todo');
  const [open, setOpen] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [categories, allTips] = await Promise.all([getGuideCategories(), getGuideTips()]);
        const familyId = await getMyFamilyId();
        const babies = await getBabies(familyId);
        const [{ sleepEvents, feedEvents }, linked] = await Promise.all([getDayRecords(familyId, 7), hasLinkedCoach(familyId)]);
        if (cancelled) return;
        setCats(categories);
        setTips(allTips);
        setProfile(profileForBirthDate(babies[0]?.birth_date));
        setRecords(buildDayRecords(sleepEvents, feedEvents, babies.map((b) => b.id)));
        setHasCoach(linked);
      })();
      return () => { cancelled = true; };
    }, [])
  );

  if (!profile) return <ScreenBody><Text style={{ color: '#8A8299' }}>Cargando…</Text></ScreenBody>;

  const forAge = tipsForAge(tips, profile.id);
  const atHome = cat === 'todo';
  const list = forAge.filter((t) => (atHome ? FEATURED_TITLES.indexOf(t.title) >= 0 : cat === 'all' || t.category_id === cat));

  const dataFor = (title) => {
    if (title.indexOf('tarda en dormirse') >= 0) return records.length ? 'Tarda en dormirse, en promedio: ' + Math.round(avgLatency(records)) + ' min.' : '';
    if (title.indexOf('si le tocaba') >= 0) return records.length ? one(avgNightFeeds(records)) + ' tomas nocturnas por noche.' : '';
    return '';
  };

  return (
    <ScreenBody gap={13}>
      <ScreenTitle eyebrow="Recordatorios cortos" title="Tips" />

      <NightCard style={{ gap: 9 }}>
        <Eyebrow tone="amber">Para tu edad</Eyebrow>
        <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 24, lineHeight: 24 * 1.25, color: '#FBF7F0' }}>{profile.note}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#33335F', paddingTop: 11 }}>
          <Text style={{ fontSize: 13.5, color: '#8E87B5' }}>{hasCoach ? 'El plan lo define tu asesora' : 'Todavía no tienes un plan'}</Text>
          <Pressable onPress={onGoTeam} style={{ borderRadius: 99, backgroundColor: '#3A3560', paddingHorizontal: 12, paddingVertical: 7 }}>
            <Text style={{ fontSize: 13.5, fontWeight: '500', color: '#F0A868' }}>{hasCoach ? 'Ver plan' : 'Invitar a tu asesora'}</Text>
          </Pressable>
        </View>
      </NightCard>

      {atHome ? (
        <>
          <ReferenceCards profile={previewProfileId ? getProfile(previewProfileId) : profile} onSelectProfile={setPreviewProfileId} />

          <View style={{ gap: 11 }}>
            <Eyebrow>Por tema</Eyebrow>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
              {cats.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => { setCat(c.id); setOpen(null); }}
                  style={{ flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, borderColor: '#E4DCD0', backgroundColor: 'white', paddingHorizontal: 13, paddingVertical: 12 }}
                >
                  <View style={{ height: 32, width: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F1FB' }}>
                    <Text style={{ fontSize: 15, color: '#6B5DD3' }}>{c.icon}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '500', color: '#16162B' }}>{c.label}</Text>
                    <Text style={{ fontSize: 12, color: '#8A8299' }}>{forAge.filter((t) => t.category_id === c.id).length} tips</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={{ marginTop: 3, flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <Eyebrow>Destacados</Eyebrow>
            <View style={{ height: 1, flex: 1, backgroundColor: '#DCD4C8' }} />
          </View>
        </>
      ) : (
        <Pressable onPress={() => { setCat('todo'); setOpen(null); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ height: 30, width: 30, borderRadius: 99, borderWidth: 1, borderColor: '#DCD4C8', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, color: '#4A4459' }}>←</Text>
          </View>
          <Text style={{ fontSize: 15, color: '#4A4459' }}>{cat === 'all' ? 'Todos los tips' : cats.find((c) => c.id === cat)?.label}</Text>
          <Text style={{ marginLeft: 'auto', fontFamily: theme.fontFamily.mono, fontSize: 12, color: '#8A8299' }}>{list.length} tips</Text>
        </Pressable>
      )}

      {list.map((t, ix) => {
        const isOpen = open === t.id;
        const mine = t.ages !== '*';
        const data = dataFor(t.title);
        return (
          <View
            key={t.id}
            style={{
              borderRadius: 14, backgroundColor: 'white', paddingHorizontal: 14, paddingVertical: 13,
              borderWidth: 1, borderColor: isOpen ? '#B9AFEA' : mine ? '#C9C1D8' : '#E4DCD0',
            }}
          >
            <Pressable onPress={() => setOpen(isOpen ? null : t.id)} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <Text style={{ paddingTop: 3, fontFamily: theme.fontFamily.mono, fontSize: 11.5, color: mine ? '#6B5DD3' : '#C6BFB2' }}>{String(ix + 1).padStart(2, '0')}</Text>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ fontSize: 15.5, fontWeight: '500', lineHeight: 15.5 * 1.3, color: isOpen ? '#6B5DD3' : '#16162B' }}>{t.title}</Text>
                <Text style={{ fontSize: 13.5, lineHeight: 13.5 * 1.45, color: '#6E6878' }}>{t.hook}</Text>
              </View>
              <Text style={{ paddingTop: 3, fontSize: 15, color: '#A9A2B5' }}>{isOpen ? '︿' : '⌄'}</Text>
            </Pressable>

            {isOpen ? (
              <View style={{ gap: 9, paddingLeft: 34, paddingTop: 11 }}>
                <Text style={{ fontSize: 14.5, lineHeight: 14.5 * 1.55, color: '#4A4459' }}>{t.body}</Text>
                {t.how?.length ? (
                  <View style={{ gap: 6, borderRadius: 11, backgroundColor: '#FBF7F0', paddingHorizontal: 12, paddingVertical: 11 }}>
                    <Eyebrow tone="brown" size={10.5}>Cómo se hace</Eyebrow>
                    {t.how.map((h) => (
                      <View key={h} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                        <Text style={{ fontSize: 12, color: '#C6BFB2' }}>→</Text>
                        <Text style={{ flex: 1, fontSize: 13.5, lineHeight: 13.5 * 1.5, color: '#4A4459' }}>{h}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                {data ? (
                  <Text style={{ borderRadius: 10, backgroundColor: '#F6F1FB', paddingHorizontal: 11, paddingVertical: 9, fontFamily: theme.fontFamily.mono, fontSize: 12, lineHeight: 12 * 1.5, color: '#6B5DD3' }}>{data}</Text>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}

      {atHome ? (
        <Pressable onPress={() => { setCat('all'); setOpen(null); }} style={{ borderRadius: 14, borderWidth: 1, borderColor: '#C9C1D8', borderStyle: 'dashed', padding: 13, alignItems: 'center' }}>
          <Text style={{ fontSize: 14.5, color: '#6B5DD3' }}>Ver los {forAge.length} tips</Text>
        </Pressable>
      ) : null}

      <Text style={{ fontSize: 11.5, lineHeight: 11.5 * 1.5, color: '#A9A2B5' }}>
        {hasCoach ? 'Tips de recordatorio. Tu plan y sus ajustes vienen siempre de tu asesora.' : 'Tips de recordatorio, no un plan. Si trabajas con una asesora de sueño, puedes invitarla desde Cuidado para que te arme uno.'}
      </Text>
    </ScreenBody>
  );
}
export default TipsScreen;
