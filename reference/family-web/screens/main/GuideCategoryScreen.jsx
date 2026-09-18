import { useState } from 'react';
import { ScreenScroll } from '../../../../components/layout/ScreenScroll';
import { Eyebrow } from '../../../../components/core/Eyebrow';
import { guideCategories, guideTips } from '../../data/mock';

/** Detalle de un tema de la guía: acordeón de consejos, con el "cómo se hace" en crema. */
export function GuideCategoryScreen({ categoryId, onBack }) {
  const [open, setOpen] = useState(null);
  const cat = guideCategories.find((c) => c.id === categoryId);
  const tips = guideTips.filter((t) => !categoryId || t.category === categoryId);

  return (
    <ScreenScroll>
      <button type="button" onClick={onBack} className="flex w-fit items-center gap-5 font-ui-app text-base text-tinta-cuerpo">
        <span className="grid h-9 w-9 place-items-center rounded-pill border border-crema-line-strong">←</span>
        Guía
      </button>
      <h1 className="font-display-app text-display-md leading-tight text-tinta-fuerte">{cat ? cat.label : 'Todos los consejos'}</h1>

      <div className="flex flex-col gap-4">
        {tips.map((t) => {
          const on = open === t.id;
          return (
            <div key={t.id} className="flex flex-col rounded-lg border border-crema-line bg-white px-8 py-7">
              <button type="button" onClick={() => setOpen(on ? null : t.id)} className="flex items-start justify-between gap-6 text-left">
                <span className="font-ui-app text-md font-medium leading-snug text-tinta-fuerte">{t.title}</span>
                <span className={['text-lg text-tinta-apagada transition-transform', on ? 'rotate-180' : ''].join(' ')}>⌄</span>
              </button>
              {on ? (
                <div className="flex animate-riseIn flex-col gap-6 pt-6">
                  <span className="font-ui-app text-base leading-relaxed text-tinta-cuerpo">{t.body}</span>
                  {t.how ? (
                    <div className="flex flex-col gap-4 rounded-md bg-crema-paper px-7 py-6">
                      <Eyebrow tone="warm">Cómo se hace</Eyebrow>
                      {t.how.map((h, i) => (
                        <span key={i} className="font-ui-app text-base leading-relaxed text-tinta-cuerpo">{i + 1}. {h}</span>
                      ))}
                    </div>
                  ) : null}
                  {t.data ? (
                    <span className="rounded-md bg-violeta-50 px-7 py-6 font-ui-app text-sm leading-relaxed text-violeta-600">{t.data}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </ScreenScroll>
  );
}
export default GuideCategoryScreen;
