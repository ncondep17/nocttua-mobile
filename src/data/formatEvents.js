const TYPE_LABEL = { sleep: 'Sueño', feed: 'Toma', pump: 'Extracción' };
const SESSION_LABEL = { nap: 'Siesta', night: 'Sueño de noche' };

function formatDuration(startedAt, endedAt) {
  if (!endedAt) return null;
  const minutes = Math.round((new Date(endedAt) - new Date(startedAt)) / 60000);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/** Fila de `events` (con `babies(tone)` embebido) -> props de <TimelineEvent>. */
export function eventToTimelineProps(event) {
  const time = new Date(event.started_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const duration = formatDuration(event.fell_asleep_at || event.started_at, event.ended_at);
  const wakeCount = event.wake_count ? `${event.wake_count} despertar${event.wake_count === 1 ? '' : 'es'}` : null;
  const metaParts = [duration, event.kind, event.place, event.volume_ml ? `${event.volume_ml} ml` : null, wakeCount].filter(Boolean);

  const title = event.type === 'sleep'
    ? (SESSION_LABEL[event.session] ?? TYPE_LABEL.sleep)
    : [TYPE_LABEL[event.type], event.kind].filter(Boolean).join(' · ') || TYPE_LABEL[event.type];

  return {
    time,
    title,
    meta: metaParts.join(' · ') || null,
    baby: event.baby_id ? event.babies?.tone ?? 'a' : 'both',
  };
}
