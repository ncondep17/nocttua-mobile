import { useState } from 'react';
import { OnboardingLayout, Button } from './OnboardingLayout';
import { TextField } from '../../../../components/forms/TextArea';

/**
 * 09 · Individual o invitada.
 * Si tiene código de asesora, la cuenta nace vinculada al panel de Coach.
 */
export function AccountTypeScreen({ onNext }) {
  const [mode, setMode] = useState('solo');
  const [code, setCode] = useState('');
  const matched = code.trim().length >= 4;
  return (
    <OnboardingLayout
      title="¿Vas sola o te invitó una asesora?"
      primary={<Button size="lg" full onClick={onNext}>{mode === 'code' && matched ? 'Vincular y continuar' : 'Continuar'}</Button>}
    >
      <div className="flex flex-col gap-5">
        {[{ id: 'solo', t: 'Voy por mi cuenta', b: 'Registro, patrones y guía.' }, { id: 'code', t: 'Tengo un código de asesora', b: 'Compartís reportes y ella deja el plan aquí.' }].map((o) => {
          const on = mode === o.id;
          return (
            <button key={o.id} type="button" onClick={() => setMode(o.id)}
              className={['flex flex-col gap-2 rounded-xl border bg-white px-8 py-8 text-left transition', on ? 'border-[1.5px] border-violeta-600 bg-violeta-50' : 'border-crema-line-strong'].join(' ')}>
              <span className="font-ui-app text-lg font-medium text-tinta-fuerte">{o.t}</span>
              <span className="font-ui-app text-base text-tinta-tenue">{o.b}</span>
            </button>
          );
        })}
      </div>
      {mode === 'code' ? (
        <div className="flex animate-riseIn flex-col gap-6">
          <TextField label="Código de la asesora" mono value={code} onChange={setCode} placeholder="CRS-2481" />
          {matched ? (
            <div className="flex items-center gap-6 rounded-md border border-verde-200 bg-verde-50 px-7 py-6">
              <span className="grid h-9 w-9 place-items-center rounded-pill bg-verde-100 font-ui-app text-sm font-medium text-verde-600">C</span>
              <span className="font-ui-app text-base text-tinta-cuerpo">Carolina S. · Asesora de sueño</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </OnboardingLayout>
  );
}
export default AccountTypeScreen;
