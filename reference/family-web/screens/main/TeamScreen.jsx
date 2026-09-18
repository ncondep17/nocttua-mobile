import { ScreenHeader } from '../../../../components/layout/ScreenHeader';
import { ScreenScroll } from '../../../../components/layout/ScreenScroll';
import { Card } from '../../../../components/core/Card';
import { Button } from '../../../../components/core/Button';
import { Badge } from '../../../../components/core/Badge';
import { ListRow, Avatar } from '../../../../components/core/ListRow';
import { team, plan } from '../../data/mock';

/**
 * Pestaña · Equipo.
 * Quién puede registrar, quién solo mira, y el plan que dejó la asesora
 * (aquí es de solo lectura: se edita desde Nocttua Coach).
 */
export function TeamScreen({ onInvite, onOpenMember }) {
  return (
    <ScreenScroll>
      <ScreenHeader eyebrow="Cuenta de la familia" title="Equipo" />

      <div className="flex flex-col gap-4">
        {team.map((m) => (
          <ListRow
            key={m.id}
            leading={<Avatar initial={m.initial} tone={m.tone} />}
            title={m.name}
            subtitle={m.role}
            trailing={<Badge tone={m.badgeTone}>{m.badge}</Badge>}
            onClick={() => onOpenMember && onOpenMember(m)}
          />
        ))}
      </div>

      <Button variant="secondary" size="lg" full onClick={onInvite}>Invitar a alguien</Button>

      <Card surface="cream" eyebrow={'Plan de sueño · ' + plan.version} title={'Lo dejó ' + plan.author}>
        <div className="flex flex-col gap-7">
          {plan.fields.map((f) => (
            <div key={f.label} className="flex flex-col gap-1">
              <span className="font-ui-app text-sm text-tinta-tenue">{f.label}</span>
              <span className="font-ui-app text-base leading-relaxed text-tinta-cuerpo">{f.value}</span>
            </div>
          ))}
        </div>
        <span className="font-ui-app text-sm text-tinta-apagada">Solo tu asesora puede editar el plan.</span>
      </Card>
    </ScreenScroll>
  );
}
export default TeamScreen;
