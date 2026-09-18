/**
 * Barra de pestañas del rediseño: Hoy · Noche · + (elevado) · Datos · Equipo
 * — 5 espacios, calcados del handoff. Leche y Tips dejan de tener pestaña
 * propia (el prototipo no las contempla) pero siguen siendo pantallas
 * reales, alcanzables desde Equipo (ver 05_CareScreen.jsx).
 *
 * 'noche' y 'plus' no son rutas del Tab.Navigator — TabBar los reconoce por
 * `action` y MainTabs los intercepta antes de intentar un `navigate()`.
 */
export const FAMILY_TABS = [
  { id: 'hoy', label: 'Hoy', kind: 'hoy' },
  { id: 'noche', label: 'Noche', kind: 'noche', action: 'nightMode' },
  { id: 'plus', label: '', kind: 'plus', action: 'quickActions', elevated: true },
  { id: 'patrones', label: 'Datos', kind: 'datos' },
  { id: 'equipo', label: 'Equipo', kind: 'equipo' },
];
