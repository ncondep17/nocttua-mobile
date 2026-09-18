import { useState } from 'react';
import { ScreenHeader } from '../../../../components/layout/ScreenHeader';
import { ScreenScroll } from '../../../../components/layout/ScreenScroll';
import { Card } from '../../../../components/core/Card';
import { Button } from '../../../../components/core/Button';
import { MetricBar } from '../../../../components/data/MetricBar';
import { BarChart } from '../../../../components/data/BarChart';
import { SegmentedControl } from '../../../../components/forms/SegmentedControl';
import { weekNights, patterns } from '../../data/mock';

/**
 * Pestaña · Analítica.
 * Nunca califica: describe. "4 de 7 noches con un solo despertar", no "mejorá".
 */
export function AnalyticsScreen({ onExport }) {
  const [range, setRange] = useState('semana');
  return (
    <ScreenScroll>
      <ScreenHeader eyebrow="Del 8 al 14 de agosto" title="Patrones" />

      <SegmentedControl
        items={[{ id: 'semana', label: 'Semana' }, { id: 'mes', label: 'Mes' }, { id: 'todo', label: 'Todo' }]}
        active={range} onSelect={setRange}
      />

      <Card title="Horas de sueño nocturno" eyebrow="Por noche">
        <BarChart data={weekNights} highlightLast />
        <span className="font-ui-app text-sm leading-normal text-tinta-tenue">Promedio 8,4 h. La noche del viernes cayó a 6,9 h: fue el día con la vigilia más larga.</span>
      </Card>

      <Card title="Lo que se repite" eyebrow="Últimos 7 días">
        <div className="flex flex-col gap-8">
          {patterns.map((p) => <MetricBar key={p.label} {...p} />)}
        </div>
      </Card>

      <Card surface="warm" title="Un dato, no un diagnóstico">
        <span className="font-ui-app text-base leading-relaxed text-tinta-cuerpo">
          Los números describen lo que pasó en tu casa. No sustituyen a tu pediatra ni a una asesora de sueño.
        </span>
      </Card>

      <Button variant="secondary" size="lg" full onClick={onExport}>Exportar reporte</Button>
    </ScreenScroll>
  );
}
export default AnalyticsScreen;
