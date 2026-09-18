import { Logo } from '../../../../components/brand/Logo';
import { Button } from '../../../../components/core/Button';
import { Eyebrow } from '../../../../components/core/Eyebrow';

/**
 * OnboardingLayout — la cáscara común de las 10 pantallas de bienvenida.
 * Fondo noche para las de marca (dark), crema para las de decisión.
 * El paginador son puntos; el paso 0 no lo muestra.
 */
export function OnboardingLayout({ dark = false, eyebrow, title, body, children, primary, secondary, step, total = 10, className = '' }) {
  return (
    <div className={['flex h-full flex-col', dark ? 'bg-noche-900' : 'bg-crema-paper', className].join(' ')}>
      <div className="flex items-center justify-between px-9 pt-9">
        <Logo variant={dark ? 'iso-crema' : 'iso-noche'} width={24} />
        {step != null ? (
          <div className="flex gap-2">
            {Array.from({ length: total }).map((_, i) => (
              <span key={i} className={['h-[5px] rounded-pill transition-all', i === step ? 'w-5 ' + (dark ? 'bg-ambar-500' : 'bg-violeta-600') : 'w-[5px] ' + (dark ? 'bg-noche-600' : 'bg-crema-line-strong')].join(' ')} />
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-auto px-9 pt-11">
        {eyebrow ? <Eyebrow tone={dark ? 'night' : 'muted'}>{eyebrow}</Eyebrow> : null}
        <h1 className={['font-display-app text-display-lg leading-tight', dark ? 'text-crema-paper' : 'text-tinta-fuerte'].join(' ')}>{title}</h1>
        {body ? <p className={['m-0 font-ui-app text-lg leading-relaxed', dark ? 'text-noite-suave' : 'text-tinta-cuerpo'].join(' ')}>{body}</p> : null}
        {children}
      </div>

      <div className="flex flex-col gap-5 px-9 pb-11 pt-8">
        {primary}
        {secondary}
      </div>
    </div>
  );
}

export { Button };
export default OnboardingLayout;
