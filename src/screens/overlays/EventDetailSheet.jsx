import { View, Text } from 'react-native';
import { theme } from '@nocttua/theme/native';
import { Sheet } from '../../components/feedback/Sheet';
import { Button } from '../../components/core/Button';
import { Eyebrow } from '../../components/core/Eyebrow';
import { eventToTimelineProps } from '../../data/formatEvents';

/** Hoja · Detalle de un registro. Editar o borrar, sin ceremonia. */
export function EventDetailSheet({ open, event, onClose, onEdit, onDelete }) {
  if (!event) return null;
  const { title, time, meta } = eventToTimelineProps(event);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      subtitle={time}
      footer={
        <>
          <Button variant="secondary" size="lg" style={{ flex: 1 }} onPress={onEdit}>Editar</Button>
          <Button variant="danger" size="lg" onPress={onDelete}>Borrar</Button>
        </>
      }
    >
      <View style={{ gap: theme.space[6], borderRadius: theme.radius.md, backgroundColor: theme.color.cremaPaper, paddingHorizontal: theme.space[8], paddingVertical: theme.space[7] }}>
        <View style={{ gap: theme.space[1] }}>
          <Eyebrow>Detalle</Eyebrow>
          <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.base, lineHeight: theme.fontSize.base * theme.lineHeight.relaxed, color: theme.color.tintaCuerpo }}>
            {meta || 'Sin detalles adicionales.'}
          </Text>
        </View>
      </View>
    </Sheet>
  );
}
export default EventDetailSheet;
