import { useFonts } from 'expo-font';
import { BodoniModa_400Regular, BodoniModa_500Medium } from '@expo-google-fonts/bodoni-moda';
import { Onest_300Light, Onest_400Regular, Onest_500Medium, Onest_600SemiBold } from '@expo-google-fonts/onest';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';

/**
 * Registra las fuentes bajo los mismos nombres que espera
 * packages/theme/src/tokens.native.js (theme.fontFamily.*).
 */
export function useAppFonts() {
  return useFonts({
    'BodoniModa-Regular': BodoniModa_400Regular,
    'BodoniModa-Medium': BodoniModa_500Medium,
    'Onest-Light': Onest_300Light,
    'Onest-Regular': Onest_400Regular,
    'Onest-Medium': Onest_500Medium,
    'Onest-SemiBold': Onest_600SemiBold,
    'DMMono-Regular': DMMono_400Regular,
    'DMMono-Medium': DMMono_500Medium,
    'InstrumentSerif-Regular': InstrumentSerif_400Regular,
    'InstrumentSerif-Italic': InstrumentSerif_400Regular_Italic,
    'DMSans-Regular': DMSans_400Regular,
    'DMSans-Medium': DMSans_500Medium,
    'DMSans-Bold': DMSans_700Bold,
  });
}
