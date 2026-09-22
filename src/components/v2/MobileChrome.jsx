import { useEffect } from 'react';
import { View, Text, Pressable, Modal, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@nocttua/theme/native';

/** Cuerpo scrolleable de una pantalla: padding 12/20/18, gap propio de cada una. */
export function ScreenBody({ gap = 12, children }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FBF7F0' }}
      contentContainerStyle={{ gap, paddingHorizontal: 20, paddingBottom: 18, paddingTop: 12 + insets.top }}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

/** Las 5 pestañas del rediseño — iconos geométricos, nunca emoji. */
export const TABS = [
  { id: 'hoy', label: 'Sueño', icon: '◐' },
  { id: 'leche', label: 'Leche', icon: '◍' },
  { id: 'analitica', label: 'Datos', icon: '◔' },
  { id: 'guia', label: 'Tips', icon: '❏' },
  { id: 'equipo', label: 'Cuidado', icon: '◇' },
];

export function TabBarV2({ active, onSelect }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#E4DCD0', backgroundColor: '#FBF7F0', paddingHorizontal: 20, paddingTop: 9, paddingBottom: 20 + insets.bottom }}>
      {TABS.map((t) => {
        const on = active === t.id;
        return (
          <Pressable key={t.id} onPress={() => onSelect(t.id)} style={{ minWidth: 56, minHeight: 44, alignItems: 'center', gap: 3 }}>
            <Text style={{ fontSize: 19, color: on ? '#16162B' : '#A9A2B5' }}>{t.icon}</Text>
            <Text style={{ fontSize: 11.5, color: on ? '#16162B' : '#A9A2B5', fontWeight: on ? '500' : '400' }}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Hoja inferior. Radio compuesto 24/24/34/34, botonera pegada al fondo. */
export function SheetV2({ open, title, onClose, children, footer, maxH = '90%' }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={!!open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable onPress={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(22,22,43,.35)' }} />
        <View style={{ maxHeight: maxH, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 22 + insets.bottom, gap: 13 }}>
          <View style={{ alignSelf: 'center', height: 4, width: 40, borderRadius: 99, backgroundColor: '#DCD4C8' }} />
          {title ? (
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 19, fontFamily: theme.fontFamily.uiAppMedium, fontWeight: '500', color: '#16162B' }}>{title}</Text>
              <Text onPress={onClose} style={{ fontSize: 15, color: '#8A8299' }}>Cerrar</Text>
            </View>
          ) : null}
          <ScrollView contentContainerStyle={{ gap: 13 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer ? <View style={{ flexDirection: 'row', gap: 9 }}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

/** Toast: flota sobre la TabBar, nunca la tapa. */
export function ToastV2({ open, children }) {
  const anim = useAnim(open);
  if (!open) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', bottom: 96, left: 20, right: 20, zIndex: 40, borderRadius: 13,
        backgroundColor: '#16162B', paddingHorizontal: 15, paddingVertical: 13,
        opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
      }}
    >
      <Text style={{ fontSize: 14.5, lineHeight: 14.5 * 1.4, color: '#FBF7F0' }}>{children}</Text>
    </Animated.View>
  );
}

function useAnim(open) {
  const anim = new Animated.Value(open ? 1 : 0);
  useEffect(() => { Animated.timing(anim, { toValue: open ? 1 : 0, duration: 200, useNativeDriver: true }).start(); }, [open]);
  return anim;
}

/** Pantalla completa superpuesta (código de asesora, modo noche, etc). */
export function FullScreenV2({ children }) {
  return <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FBF7F0' }}>{children}</View>;
}
