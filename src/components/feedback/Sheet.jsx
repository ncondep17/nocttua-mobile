import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@nocttua/theme/native';

/**
 * Sheet — hoja inferior del móvil: registro de sueño, toma, gestión de acceso.
 * El velo cierra al tocar; la botonera queda pegada al fondo.
 */
export function Sheet({ open, title, subtitle, onClose, children, footer }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={!!open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable onPress={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(22,22,43,.35)' }} />
        <View
          style={{
            maxHeight: '86%', gap: theme.space[7], borderTopLeftRadius: 24, borderTopRightRadius: 24,
            backgroundColor: theme.color.white, paddingHorizontal: theme.space[9], paddingBottom: theme.space[10] + insets.bottom, paddingTop: theme.space[6],
          }}
        >
          <View style={{ alignSelf: 'center', height: 4, width: 36, borderRadius: theme.radius.pill, backgroundColor: theme.color.cremaLineStrong }} />
          {(title || subtitle) ? (
            <View style={{ gap: theme.space[1] }}>
              {title ? (
                <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: theme.fontSize['display-sm'], lineHeight: theme.fontSize['display-sm'] * theme.lineHeight.tight, color: theme.color.tintaFuerte }}>
                  {title}
                </Text>
              ) : null}
              {subtitle ? <Text style={{ fontFamily: theme.fontFamily.uiApp, fontSize: theme.fontSize.sm, color: theme.color.tintaTenue }}>{subtitle}</Text> : null}
            </View>
          ) : null}
          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: theme.space[7] }}>
            {children}
          </ScrollView>
          {footer ? <View style={{ flexDirection: 'row', gap: theme.space[5], paddingTop: theme.space[1] }}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}
export default Sheet;
