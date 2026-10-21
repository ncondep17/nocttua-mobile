import { useCallback, useEffect, useState } from 'react';
import { View, Alert } from 'react-native';
import { MainTabs } from './MainTabs';
import { navigate } from './navigationRef';
import { Toast } from '../components/feedback/Toast';
import { SleepLogSheet } from '../screens/main-v2/overlays/SleepLogSheet';
import { CloseNightSheet } from '../screens/main-v2/overlays/CloseNightSheet';
import { FeedLogSheet } from '../screens/main-v2/overlays/FeedLogSheet';
import { DiaperLogSheet } from '../screens/main-v2/overlays/DiaperLogSheet';
import { MedsSheet } from '../screens/main-v2/overlays/MedsSheet';
import { GiveDoseSheet } from '../screens/main-v2/overlays/GiveDoseSheet';
import { EditPrescriptionSheet } from '../screens/main-v2/overlays/EditPrescriptionSheet';
import { EventDetailSheet } from '../screens/overlays/EventDetailSheet';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { SleepPlanScreen } from '../screens/main/SleepPlanScreen';
import { NightModeScreen } from '../screens/main-v2/NightModeScreen';
import { MorningScreen } from '../screens/main-v2/MorningScreen';
import { WinsScreen } from '../screens/main-v2/WinsScreen';
import { TreatmentScreen } from '../screens/main-v2/TreatmentScreen';
import { QuickActionsSheet } from '../screens/main-v2/overlays/QuickActionsSheet';
import { getMyFamilyId, getBabies, insertEvent, updateEvent, deleteEvent, closeNight, getLatestSleepEventAt, getOpenSleepEvent, payloadFromRow } from '../data/family';
import { getActiveEpisode, getPrescriptions, getDosesSince, startEpisode, endEpisode, upsertPrescription, deactivatePrescription, setPrescriptionInUse, logDose } from '../data/meds';
import { addShiftNote } from '../data/shiftNotes';
import { scheduleTodayDoseAlerts } from '../lib/scheduleTodayDoses';
import { scheduleInactivityAlert } from '../lib/inactivityAlerts';
import { scheduleIllnessCheckAlert, cancelIllnessCheckAlert } from '../lib/illnessCheckAlerts';
import { refreshOpenNightAlerts } from '../lib/openNightAlerts';
import { refreshOpenNapAlerts } from '../lib/openNapAlerts';
import { supabase } from '../lib/supabase';

/**
 * Shell autenticado: tabs + hojas de registro + overlays de pantalla completa.
 * Las hojas de sueño/toma son las del rediseño (main-v2/overlays) — más
 * completas que las anteriores, con contacto/humor/factores.
 */
export function FamilyShell() {
  const [familyId, setFamilyId] = useState(null);
  const [babies, setBabies] = useState([]);
  const [sheet, setSheet] = useState(null); // 'sleep' | 'feed' | 'pump' | 'diaper' | 'event'
  const [logCtx, setLogCtx] = useState({ label: '', babyIndex: 0, session: 'nap', isWake: false });
  const [event, setEvent] = useState(null); // evento seleccionado (detalle o edición)
  const [full, setFull] = useState(null); // 'settings'
  const [toast, setToast] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [episode, setEpisode] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [doses, setDoses] = useState([]);
  const [medsOpen, setMedsOpen] = useState(false);
  const [doseCtx, setDoseCtx] = useState(null); // { prescriptionId, babyId }
  const [editMedsOpen, setEditMedsOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [treatmentId, setTreatmentId] = useState(null);
  const [closeNightCtx, setCloseNightCtx] = useState(null); // { who, openNights, planWakeMin } — ver openCloseNight

  const loadBabies = useCallback(async (id) => {
    setBabies(await getBabies(id));
  }, []);

  const loadMeds = useCallback(async (id, babiesData) => {
    // 5 días, no 2: Tratamiento activo (TreatmentScreen) muestra "días
    // anteriores" con el conteo de dosis de los últimos días, no solo hoy.
    const since = new Date(Date.now() - 5 * 86400000);
    const [ep, meds, dosesData] = await Promise.all([getActiveEpisode(id), getPrescriptions(id), getDosesSince(id, since)]);
    setEpisode(ep);
    setPrescriptions(meds);
    setDoses(dosesData);
    // Las notificaciones siguen a qué medicinas están "en uso" ahora, no al
    // modo enfermedad — el catálogo puede tener varias cargadas de antes
    // (Panadol, Flogobrón...) y cada una se activa por separado.
    const activeMeds = meds.filter((m) => m.inUse);
    if (activeMeds.length) scheduleTodayDoseAlerts(id, babiesData, activeMeds, dosesData).catch(() => {});
    // El de "¿ya está bien?" sí sigue al modo enfermedad, no a una medicina
    // puntual — cuenta desde la última dosis real, o desde que arrancó el
    // episodio si todavía no se dio ninguna.
    if (ep) {
      const lastActivityAtMs = dosesData[0]?.givenAt?.getTime() ?? new Date(ep.startedAt).getTime();
      scheduleIllnessCheckAlert({ episodeId: ep.id, familyId: id, lastActivityAtMs }).catch(() => {});
    } else {
      cancelIllnessCheckAlert().catch(() => {});
    }
  }, []);

  useEffect(() => {
    (async () => {
      const id = await getMyFamilyId();
      setFamilyId(id);
      const babiesData = await getBabies(id);
      setBabies(babiesData);
      await loadMeds(id, babiesData);
      // Cubre reabrir la app después de días sin tocarla: si el último sueño
      // real ya está a más de REMINDER_HOURS, el motor avisa ya mismo en vez
      // de esperar a que se guarde un sueño nuevo.
      const lastSleepAt = await getLatestSleepEventAt(id);
      if (lastSleepAt) scheduleInactivityAlert(lastSleepAt.getTime()).catch(() => {});
      refreshOpenNightAlerts(id, babiesData).catch(() => {});
      refreshOpenNapAlerts(id, babiesData).catch(() => {});
    })();
  }, [loadMeds]);

  const say = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const closeSheet = () => { setSheet(null); setEvent(null); };

  // Si el registro que se está guardando es una fila legada "aplicar a
  // ambas" (baby_id null, de antes de que esto se separara en dos filas) y
  // se guarda desde una bebé específica, la separamos en dos filas
  // independientes en vez de reasignarla — reasignar borraba en silencio
  // ese sueño/toma del historial de la otra bebé (el bug real de mellizas
  // que encontramos en la auditoría).
  const splitSharedIfNeeded = async (existingEvent, payload) => {
    if (existingEvent && existingEvent.baby_id === null && payload.babyId !== null) {
      await updateEvent(existingEvent.id, payload);
      const sibling = babies.find((b) => b.id !== payload.babyId);
      if (sibling) await insertEvent(familyId, { ...payload, babyId: sibling.id });
      return true;
    }
    return false;
  };

  const handleSaveSleep = async (payload) => {
    try {
      const split = await splitSharedIfNeeded(event, payload);
      const sameRecord = !split && event && payload.babyId === event.baby_id;
      if (!split) {
        if (sameRecord) await updateEvent(event.id, payload);
        else await insertEvent(familyId, payload);
      }
      closeSheet();
      setRefreshKey((k) => k + 1);
      say(split || sameRecord ? 'Sueño actualizado' : 'Sueño anotado');
      scheduleInactivityAlert(Date.now()).catch(() => {});
      refreshOpenNightAlerts(familyId, babies).catch(() => {});
      refreshOpenNapAlerts(familyId, babies).catch(() => {});
    } catch (err) {
      say(err.message ?? String(err));
    }
  };

  // "Aplicar a ambas" en una entrada NUEVA (nunca en una edición — las hojas
  // ocultan ese botón mientras se edita): una fila independiente por bebé
  // desde el principio, nunca una fila compartida con baby_id null. Mismo
  // patrón que ya usa handleSaveDoseBoth más abajo para medicinas.
  // Respaldo además del fix en SleepLogSheet (que ya saca "Las dos" mientras
  // se completa una siesta abierta): si de todos modos llega acá una bebé
  // que YA tiene un sueño abierto de esta sesión, nunca se inserta un
  // segundo registro encima — eso es lo que dejaba siestas duplicadas y
  // huérfanas. Mejor avisar y que se complete aparte que duplicar o pisar
  // con datos adivinados.
  const handleSaveSleepBoth = async (payloadBase) => {
    try {
      const results = await Promise.all(babies.map(async (baby) => {
        const open = await getOpenSleepEvent(familyId, baby.id, payloadBase.session);
        if (open) return { skipped: true, name: baby.name };
        await insertEvent(familyId, { ...payloadBase, babyId: baby.id });
        return { skipped: false };
      }));
      closeSheet();
      setRefreshKey((k) => k + 1);
      const skipped = results.filter((r) => r.skipped).map((r) => r.name);
      say(skipped.length
        ? 'Guardado — ' + skipped.join(' y ') + ' ya tenía una siesta abierta, complétala aparte.'
        : 'Sueño anotado para las dos');
      scheduleInactivityAlert(Date.now()).catch(() => {});
      refreshOpenNightAlerts(familyId, babies).catch(() => {});
      refreshOpenNapAlerts(familyId, babies).catch(() => {});
    } catch (err) {
      say(err.message ?? String(err));
    }
  };

  // Atajo del héroe de Hoy y de una fila abierta en "Lo que ya pasó hoy" —
  // `openNights`/`planWakeMin` vienen precalculados de TodayScreen.load()
  // para no volver a traer los eventos de hoy acá.
  const openCloseNight = (who, openNights, planWakeMin) => setCloseNightCtx({ who, openNights, planWakeMin });
  const closeCloseNight = () => setCloseNightCtx(null);

  const handleCloseNight = async (closures) => {
    try {
      await Promise.all(closures.map(({ night, endedAt, wakeCount }) => closeNight(night, { endedAt, wakeCount })));
      closeCloseNight();
      setRefreshKey((k) => k + 1);
      say(closures.length > 1 ? 'Noche cerrada para las dos' : 'Despertar guardado');
      refreshOpenNightAlerts(familyId, babies).catch(() => {});
      refreshOpenNapAlerts(familyId, babies).catch(() => {});
      // "Cómo fue la noche" aparece sola apenas se cierra — antes había que
      // ir a buscarla con un botón en Hoy, y por eso nadie la veía.
      setFull('morning');
    } catch (err) {
      say(err.message ?? String(err));
    }
  };

  const handleSaveFeed = async (payload) => {
    try {
      const split = await splitSharedIfNeeded(event, payload);
      if (!split) {
        if (event) await updateEvent(event.id, payload);
        else await insertEvent(familyId, payload);
      }
      closeSheet();
      setRefreshKey((k) => k + 1);
      say(event ? 'Registro actualizado' : payload.type === 'pump' ? 'Extracción guardada' : 'Registro guardado');
    } catch (err) {
      say(err.message ?? String(err));
    }
  };

  const handleSaveFeedBoth = async (payloadBase) => {
    try {
      await Promise.all(babies.map((b) => insertEvent(familyId, { ...payloadBase, babyId: b.id })));
      closeSheet();
      setRefreshKey((k) => k + 1);
      say('Registro guardado para las dos');
    } catch (err) {
      say(err.message ?? String(err));
    }
  };

  const handleDeleteEvent = async () => {
    try {
      await deleteEvent(event.id);
      closeSheet();
      setRefreshKey((k) => k + 1);
      say('Registro borrado');
      refreshOpenNightAlerts(familyId, babies).catch(() => {});
      refreshOpenNapAlerts(familyId, babies).catch(() => {});
    } catch (err) {
      say(err.message ?? String(err));
    }
  };

  const handleEditEvent = () => {
    if (event.type === 'sleep') {
      setLogCtx({ label: event.session === 'night' ? 'Noche' : 'Siesta', babyIndex: Math.max(0, babies.findIndex((b) => b.id === event.baby_id)), session: event.session ?? 'nap' });
      setSheet('sleep');
    } else {
      setSheet(event.type);
    }
  };

  const openLog = (label, babyIndex, session, existingEvent = null, isWake = false, presetStartAt = null) => {
    setLogCtx({ label, babyIndex, session, isWake, presetStartAt });
    setEvent(existingEvent);
    setSheet('sleep');
  };

  const handleToggleEpisode = async () => {
    try {
      if (episode) await endEpisode(episode.id);
      else await startEpisode(familyId);
      setMedsOpen(false);
      await loadMeds(familyId, babies);
      setRefreshKey((k) => k + 1);
      say(episode ? 'Modo enfermedad cerrado' : 'Modo enfermedad activado');
    } catch (err) {
      say(err.message ?? String(err));
    }
  };

  const handleGiveDose = (prescriptionId, babyId) => {
    setMedsOpen(false);
    setDoseCtx({ prescriptionId, babyId });
  };

  const closeDose = () => setDoseCtx(null);

  const handleSaveDose = async (prescriptionId, babyId, at, insisted = false) => {
    try {
      await logDose(familyId, prescriptionId, babyId, at, insisted);
      closeDose();
      await loadMeds(familyId, babies);
      say('Dosis registrada');
    } catch (err) {
      say(err.message ?? String(err));
    }
  };

  const handleSaveDoseBoth = async (prescriptionId, at, insisted = false) => {
    try {
      const prescription = prescriptions.find((p) => p.id === prescriptionId);
      const targets = babies.filter((b) => prescription?.doses[b.id] != null);
      await Promise.all(targets.map((b) => logDose(familyId, prescriptionId, b.id, at, insisted)));
      closeDose();
      await loadMeds(familyId, babies);
      say('Dosis registrada para las dos');
    } catch (err) {
      say(err.message ?? String(err));
    }
  };

  const handleGoCare = () => {
    setMedsOpen(false);
    navigate('equipo');
  };

  const handleSavePrescription = async (payload) => {
    const prescriptionId = await upsertPrescription(familyId, payload);
    await loadMeds(familyId, babies);
    setRefreshKey((k) => k + 1);
    return prescriptionId;
  };

  const handleDeactivatePrescription = async (id) => {
    await deactivatePrescription(id);
    await loadMeds(familyId, babies);
    setRefreshKey((k) => k + 1);
  };

  // Distinto de handleDeactivatePrescription: eso la saca del catálogo
  // entero (solo se reactiva editándola de nuevo). Esto solo marca "ya no
  // se la estamos dando ahora" — sigue guardada, con un link "Activar" en
  // Equipo para cuando vuelva a hacer falta.
  const handleSetInUse = async (id, inUse) => {
    await setPrescriptionInUse(id, inUse);
    await loadMeds(familyId, babies);
    setRefreshKey((k) => k + 1);
  };

  const handleMedsChanged = () => loadMeds(familyId, babies);

  // Compartidas entre la barra de pestañas (vía MainTabs → TodayScreen/
  // MilkScreen) y la hoja del botón + (QuickActionsSheet), para no definir
  // la misma lógica de "abrir esta hoja con tal bebé" dos veces.
  const handleLogFeed = (babyIndex = 0) => { setLogCtx((c) => ({ ...c, babyIndex })); setSheet('feed'); };
  const handleLogPump = (babyIndex = 0) => { setLogCtx((c) => ({ ...c, babyIndex })); setSheet('pump'); };
  const handleLogDiaper = (babyIndex = 0) => { setLogCtx((c) => ({ ...c, babyIndex })); setSheet('diaper'); };

  // Misma acción que "＋ Dejar nota para el siguiente turno" de Hoy, pero
  // alcanzable desde el botón + de la barra sin tener que ir a esa pantalla
  // primero — reusa addShiftNote en vez de duplicar esa lógica.
  const handleQuickNote = () => {
    Alert.prompt('Nota de relevo', 'Qué le dejas al siguiente turno', async (text) => {
      if (!text?.trim()) return;
      const { data } = await supabase.auth.getSession();
      await addShiftNote(familyId, data.session.user.id, text);
      setRefreshKey((k) => k + 1);
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <MainTabs
        refreshKey={refreshKey}
        onLogSleep={() => openLog('Siesta', 0, 'nap')}
        onLogFeed={handleLogFeed}
        onLogPump={handleLogPump}
        onLogDiaper={handleLogDiaper}
        onOpenLog={openLog}
        onOpenEvent={(e) => { setEvent(e); setSheet('event'); }}
        onOpenSettings={() => setFull('settings')}
        onEnterNightMode={() => setFull('nightMode')}
        onOpenQuickActions={() => setQuickActionsOpen(true)}
        onOpenMorning={() => setFull('morning')}
        onOpenWins={() => setFull('wins')}
        onOpenPlan={() => setFull('sleepPlan')}
        onOpenCloseNight={openCloseNight}
        onOpenTreatment={(id) => setTreatmentId(id)}
        onOpenMeds={() => setMedsOpen(true)}
        onEditMeds={() => setEditMedsOpen(true)}
        onMedsChanged={handleMedsChanged}
        episode={episode}
        prescriptions={prescriptions}
        doses={doses}
        onExport={() => say('Reporte enviado a tu correo')}
      />

      <SleepLogSheet
        open={sheet === 'sleep'}
        label={logCtx.label}
        session={logCtx.session}
        wakeOnly={logCtx.isWake}
        babies={babies}
        initialBaby={logCtx.babyIndex}
        editing={event?.type === 'sleep' ? event : null}
        presetStartAt={logCtx.presetStartAt ?? null}
        familyId={familyId}
        onClose={closeSheet}
        onSave={handleSaveSleep}
        onSaveBoth={handleSaveSleepBoth}
        onDelete={event?.type === 'sleep' ? handleDeleteEvent : undefined}
      />
      <FeedLogSheet
        open={sheet === 'feed' || sheet === 'pump'}
        mode={sheet === 'pump' ? 'pump' : 'feed'}
        babies={babies}
        initialBaby={logCtx.babyIndex}
        editing={(event?.type === 'feed' || event?.type === 'pump') ? event : null}
        onClose={closeSheet}
        onSave={handleSaveFeed}
        onSaveBoth={handleSaveFeedBoth}
      />
      <DiaperLogSheet
        open={sheet === 'diaper'}
        babies={babies}
        initialBaby={logCtx.babyIndex}
        editing={event?.type === 'diaper' ? event : null}
        onClose={closeSheet}
        onSave={handleSaveFeed}
        onSaveBoth={handleSaveFeedBoth}
        onDelete={event?.type === 'diaper' ? handleDeleteEvent : undefined}
      />
      <EventDetailSheet open={sheet === 'event'} event={event} onClose={closeSheet} onEdit={handleEditEvent} onDelete={handleDeleteEvent} />

      <CloseNightSheet
        open={!!closeNightCtx}
        babies={babies}
        openNights={closeNightCtx?.openNights ?? babies.map(() => null)}
        initialWho={closeNightCtx?.who ?? 'both'}
        planWakeMin={closeNightCtx?.planWakeMin ?? babies.map(() => null)}
        onClose={closeCloseNight}
        onSave={handleCloseNight}
      />

      <MedsSheet
        open={medsOpen}
        episode={episode}
        prescriptions={prescriptions}
        doses={doses}
        babies={babies}
        now={new Date()}
        onGive={handleGiveDose}
        onToggleEpisode={handleToggleEpisode}
        onGoCare={handleGoCare}
        onClose={() => setMedsOpen(false)}
      />
      <GiveDoseSheet
        open={!!doseCtx}
        prescription={prescriptions.find((p) => p.id === doseCtx?.prescriptionId) ?? null}
        prescriptions={prescriptions}
        doses={doses}
        babies={babies}
        now={new Date()}
        initialBabyId={doseCtx?.babyId}
        onSave={handleSaveDose}
        onSaveBoth={handleSaveDoseBoth}
        onClose={closeDose}
      />
      <EditPrescriptionSheet
        open={editMedsOpen}
        familyId={familyId}
        prescriptions={prescriptions}
        babies={babies}
        onClose={() => setEditMedsOpen(false)}
        onSave={handleSavePrescription}
        onDeactivate={handleDeactivatePrescription}
      />

      <QuickActionsSheet
        open={quickActionsOpen}
        babies={babies}
        hasActiveTreatment={prescriptions.some((p) => p.inUse)}
        onClose={() => setQuickActionsOpen(false)}
        onLogSleep={(babyIndex, session, presetStartAt) => openLog(presetStartAt ? 'Noche de ayer' : 'Siesta', babyIndex, session, null, false, presetStartAt)}
        onLogFeed={handleLogFeed}
        onLogPump={handleLogPump}
        onLogDiaper={handleLogDiaper}
        onLogMeds={() => setMedsOpen(true)}
        onLogNote={handleQuickNote}
        onEnterNightMode={() => setFull('nightMode')}
      />

      {full === 'settings' ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'white' }}>
          <SettingsScreen
            onClose={() => { setFull(null); loadBabies(familyId); setRefreshKey((k) => k + 1); }}
            onOpenSleepPlan={() => setFull('sleepPlan')}
          />
        </View>
      ) : null}
      {full === 'sleepPlan' ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <SleepPlanScreen onClose={() => { setFull('settings'); setRefreshKey((k) => k + 1); }} />
        </View>
      ) : null}
      {full === 'nightMode' ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <NightModeScreen
            familyId={familyId}
            babies={babies}
            onClose={() => { setFull(null); setRefreshKey((k) => k + 1); }}
          />
        </View>
      ) : null}
      {full === 'morning' ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <MorningScreen onClose={() => setFull(null)} />
        </View>
      ) : null}
      {full === 'wins' ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <WinsScreen onClose={() => setFull(null)} />
        </View>
      ) : null}
      {treatmentId ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <TreatmentScreen
            prescription={prescriptions.find((p) => p.id === treatmentId) ?? null}
            doses={doses}
            babies={babies}
            onOpenGiveDose={handleGiveDose}
            onStopUsing={(id) => { handleSetInUse(id, false); setTreatmentId(null); }}
            onClose={() => setTreatmentId(null)}
          />
        </View>
      ) : null}

      <Toast open={!!toast}>{toast}</Toast>
    </View>
  );
}
export default FamilyShell;
