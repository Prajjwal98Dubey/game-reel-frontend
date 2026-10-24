import { Archivo_600SemiBold } from '@expo-google-fonts/archivo/600SemiBold';
import { Archivo_700Bold } from '@expo-google-fonts/archivo/700Bold';
import { Archivo_800ExtraBold } from '@expo-google-fonts/archivo/800ExtraBold';
import { Archivo_900Black } from '@expo-google-fonts/archivo/900Black';
import { useFonts } from 'expo-font';

import { fonts } from './tokens';

/**
 * Loads the two Archivo widths (§17.5). Normal width comes from @expo-google-fonts; the expanded
 * width is bundled as static files, since React Native cannot set a variable font's width axis.
 */
export function useAppFonts(): [loaded: boolean, error: Error | null] {
  return useFonts({
    [fonts.semiBold]: Archivo_600SemiBold,
    [fonts.bold]: Archivo_700Bold,
    [fonts.extraBold]: Archivo_800ExtraBold,
    [fonts.black]: Archivo_900Black,
    [fonts.expandedBlack]: require('../../assets/fonts/ArchivoExpanded-Black.ttf'),
    [fonts.expandedExtraBold]: require('../../assets/fonts/ArchivoExpanded-ExtraBold.ttf'),
  });
}
