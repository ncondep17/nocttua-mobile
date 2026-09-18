import { ScreenHeader } from '../../../../components/layout/ScreenHeader';
import { ScreenScroll } from '../../../../components/layout/ScreenScroll';
import { Eyebrow } from '../../../../components/core/Eyebrow';
import { guideCategories } from '../../data/mock';

/** Pestaña · Guía (índice). Temas, no artículos: el detalle vive en GuideCategoryScreen. */
export function GuideScreen({ onOpenCategory }) {
  return (
    <ScreenScroll>
      <ScreenHeader eyebrow="Guía práctica" title="Qué hacer" />
      <span className="font-ui-app text-base leading-relaxed text-tinta-cuerpo">
        Respuestas cortas a las preguntas de las tres de la mañana. Cuando hay datos tuyos, se usan.
      </span>
      <div className="flex flex-col gap-4">
        <Eyebrow>Por tema</Eyebrow>
        {guideCategories.map((c) => (
          <button key={c.id} type="button" onClick={() => onOpenCategory && onOpenCategory(c.id)}
            className="flex items-center justify-between gap-6 rounded-lg border border-crema-line bg-white px-8 py-7 text-left transition hover:border-violeta-300">
            <span className="font-ui-app text-md text-tinta-fuerte">{c.label}</span>
            <span className="font-mono text-sm text-tinta-apagada">{c.count}</span>
          </button>
        ))}
      </div>
    </ScreenScroll>
  );
}
export default GuideScreen;
