import { NightCanvas, StatusBar, Headline, CreamButton, BACKGROUNDS } from '../components/OnboardingChrome';

/**
 * 06 · Permiso de notificaciones
 * Sin "Saltar" y sin paginador: es una decisión, no un paso del carrusel.
 * Contenido CENTRADO. La lista declara honestamente qué se notifica y qué no:
 * "nunca" para novedades va en #8E87B5, no en ámbar.
 */
export function NotificationsPermissionScreen({ onAllow, onDecline }) {
  const row = (label, value, dim = false, mutedValue = false) => (
    <span className="flex items-center justify-between">
      <span className={['text-[13.5px]', dim ? 'text-[#D6D0E4]' : 'text-[#FBF7F0]'].join(' ')}>{label}</span>
      <span className={['font-mono text-[11px]', mutedValue ? 'text-[#8E87B5]' : 'text-[#F0A868]'].join(' ')}>{value}</span>
    </span>
  );

  return (
    <NightCanvas background={BACKGROUNDS.nocheAlta}>
      <StatusBar />
      <div className="flex flex-1 flex-col justify-center gap-[20px] px-[26px]">
        <div className="flex flex-col gap-[12px]">
          <span className="font-mono text-[10.5px] uppercase tracking-[.12em] text-[#F0A868]">Un solo permiso</span>
          <Headline
            size={32} gap={12} bodySize={14.5}
            title="Activa el aviso. Es lo único que te vamos a pedir."
            body="Sin este permiso podemos calcular la ventana y la próxima toma, pero no avisarte: tendrías que abrir la app para saberlo."
          />
        </div>

        <div className="flex flex-col gap-[9px] rounded-[16px] border border-[#4A4A7A] p-[14px]">
          {row('Ventana de sueño', 'imprescindible')}
          {row('Próxima toma o extracción', 'recomendado', true)}
          {row('Novedades de Nocttua', 'nunca', true, true)}
        </div>

        <div className="flex flex-col gap-[10px]">
          <CreamButton onClick={onAllow}>Activar avisos</CreamButton>
          <button type="button" onClick={onDecline} className="text-center text-[13.5px] text-[#8E87B5]">Prefiero mirar la app yo</button>
        </div>
      </div>
    </NightCanvas>
  );
}
export default NotificationsPermissionScreen;
