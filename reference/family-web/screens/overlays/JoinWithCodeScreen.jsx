import { useState } from 'react';
import { Button } from '../../../../components/core/Button';
import { Eyebrow } from '../../../../components/core/Eyebrow';
import { TextField } from '../../../../components/forms/TextArea';

/** Pantalla completa · Vincular con una asesora desde una cuenta ya creada. */
export function JoinWithCodeScreen({ onClose, onLink }) {
  const [code, setCode] = useState('');
  const matched = code.trim().length >= 4;
  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-crema-paper">
      <div className="flex items-center justify-between px-9 pt-9">
        <Eyebrow>Vincular asesora</Eyebrow>
        <button type="button" onClick={onClose} className="font-ui-app text-base text-tinta-suave">Cerrar</button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-auto px-9 pt-11">
        <h1 className="font-display-app text-display-md leading-tight text-tinta-fuerte">Pegá el código que te dio tu asesora</h1>
        <p className="m-0 font-ui-app text-base leading-relaxed text-tinta-cuerpo">
          Verá tus reportes y podrá dejar el plan aquí. Podés cortarle el acceso cuando quieras desde Equipo.
        </p>
        <TextField label="Código" mono value={code} onChange={setCode} placeholder="CRS-2481" />
        {matched ? (
          <div className="flex animate-riseIn items-center gap-6 rounded-md border border-verde-200 bg-verde-50 px-8 py-7">
            <span className="grid h-9 w-9 place-items-center rounded-pill bg-verde-100 font-ui-app text-sm font-medium text-verde-600">C</span>
            <span className="font-ui-app text-base text-tinta-cuerpo">Carolina S. · Asesora de sueño</span>
          </div>
        ) : null}
      </div>
      <div className="px-9 pb-11 pt-8">
        <Button size="lg" full disabled={!matched} onClick={onLink}>Vincular</Button>
      </div>
    </div>
  );
}
export default JoinWithCodeScreen;
