import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import { theme } from '@nocttua/theme/native';
import { SheetV2 } from '../../../components/v2/MobileChrome';
import { CategoryIcon, Glyph } from '../../../components/v2/primitives';
import { ACCENT } from '../../../data/profiles';

/** Nota de relevo no tiene categoría propia en la tabla del README — se dibuja acá mismo con las mismas reglas de trazo (1.7, linecap round, grilla 24×24) en vez de tomar un ícono de otro set. */
function NoteGlyph({ size = 19, color = '#FBF7F0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={4} width={14} height={17} rx={2} stroke={color} strokeWidth={1.7} />
      <Path d="M8 9h8M8 13h8M8 17h5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

function tilesFor(hasActiveTreatment) {
  return [
    { key: 'sueno', category: 'sueno', label: 'Sueño', hint: 'siesta o noche' },
    { key: 'toma', category: 'toma', label: 'Toma', hint: 'pecho o biberón' },
    { key: 'extraccion', category: 'extraccion', label: 'Extracción', hint: 'de mamá' },
    { key: 'panal', category: 'panal', label: 'Pañal', hint: 'pipí o popó' },
    { key: 'medicina', category: 'medicina', label: 'Medicina', hint: hasActiveTreatment ? 'tratamiento activo' : 'agregar o dar', hintColor: hasActiveTreatment ? '#D9705A' : undefined },
    { key: 'nota', category: null, label: 'Nota de relevo', hint: 'para el turno' },
  ];
}

/**
 * Hoja del botón + de la barra de pestañas — un menú de accesos directos,
 * no un formulario nuevo: cada tile abre la misma hoja real de siempre
 * (SleepLogSheet/FeedLogSheet/DiaperLogSheet/MedsSheet) con la bebé elegida
 * acá ya preseleccionada. No duplica ninguna lógica de guardado.
 */
export function QuickActionsSheet({ open, babies, hasActiveTreatment = false, onClose, onLogSleep, onLogFeed, onLogPump, onLogDiaper, onLogMeds, onLogNote, onEnterNightMode }) {
  const [who, setWho] = useState(babies.length > 1 ? 'both' : 0);
  const TILES = tilesFor(hasActiveTreatment);

  const babyIndex = who === 'both' ? 0 : who;

  const runTile = (key) => {
    onClose && onClose();
    const h = new Date().getHours();
    if (key === 'sueno') onLogSleep && onLogSleep(babyIndex, h >= 18 || h < 6 ? 'night' : 'nap');
    else if (key === 'toma') onLogFeed && onLogFeed(babyIndex);
    else if (key === 'extraccion') onLogPump && onLogPump(babyIndex);
    else if (key === 'panal') onLogDiaper && onLogDiaper(babyIndex);
    else if (key === 'medicina') onLogMeds && onLogMeds();
    else if (key === 'nota') onLogNote && onLogNote();
  };

  return (
    <SheetV2
      open={open}
      title="Registrar"
      onClose={onClose}
      footer={
        <>
          <Pressable
            onPress={() => { onClose && onClose(); onEnterNightMode && onEnterNightMode(); }}
            style={{ flex: 1, minHeight: 50, borderRadius: 14, backgroundColor: '#16162B', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Glyph category="sueno" size={17} color="#F0A868" />
            <Text style={{ fontSize: 14.5, fontWeight: '600', color: '#FBF7F0' }}>Entrar en modo noche</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              onClose && onClose();
              // Registro retroactivo real: noche de ayer, no "ahora" — arranca
              // en 20:00 de ayer, editable como cualquier otro campo del formulario.
              const yesterday8pm = new Date();
              yesterday8pm.setDate(yesterday8pm.getDate() - 1);
              yesterday8pm.setHours(20, 0, 0, 0);
              onLogSleep && onLogSleep(babyIndex, 'night', yesterday8pm);
            }}
            style={{ minHeight: 50, paddingHorizontal: 15, borderRadius: 14, borderWidth: 1, borderColor: '#C9C1B4', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 13.5, color: '#6A6478' }}>Ayer</Text>
          </Pressable>
        </>
      }
    >
      {babies.length > 1 ? (
        <View style={{ flexDirection: 'row', gap: 6, backgroundColor: '#E3DCCF', borderRadius: 13, padding: 4 }}>
          {babies.map((b, i) => (
            <Pressable
              key={b.id}
              onPress={() => setWho(i)}
              style={{ flex: 1, minHeight: 42, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: who === i ? 'white' : 'transparent' }}
            >
              <View style={{ width: 8, height: 8, borderRadius: 99, borderWidth: who === i ? 0 : 1, borderColor: ACCENT[b.tone], backgroundColor: who === i ? ACCENT[b.tone] : 'transparent' }} />
              <Text style={{ fontSize: 13.5, fontWeight: '600', color: '#16162B' }}>{b.name}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => setWho('both')}
            style={{ flex: 1, minHeight: 42, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: who === 'both' ? 'white' : 'transparent' }}
          >
            <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: who === 'both' ? '#16162B' : 'transparent', borderWidth: who === 'both' ? 0 : 1, borderColor: '#16162B' }} />
            <Text style={{ fontSize: 13.5, fontWeight: '600', color: '#16162B' }}>Las dos</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
        {TILES.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => runTile(t.key)}
            style={{ width: '47%', minHeight: 76, borderRadius: 16, borderWidth: 1, borderColor: '#E4DCD0', backgroundColor: 'white', paddingHorizontal: 13, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 11 }}
          >
            {t.category ? (
              <CategoryIcon category={t.category} size={40} />
            ) : (
              <View style={{ width: 40, height: 40, borderRadius: 99, backgroundColor: '#8A8299', alignItems: 'center', justifyContent: 'center' }}>
                <NoteGlyph size={19} color="#FBF7F0" />
              </View>
            )}
            <View style={{ gap: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#16162B' }}>{t.label}</Text>
              <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10, color: t.hintColor ?? '#8A8299' }}>{t.hint}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </SheetV2>
  );
}
export default QuickActionsSheet;
