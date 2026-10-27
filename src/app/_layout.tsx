import { AmiriQuran_400Regular } from '@expo-google-fonts/amiri-quran';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { Newsreader_400Regular } from '@expo-google-fonts/newsreader';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StoreProvider, useStore } from '@/lib/store';
import { colors } from '@/theme';

function Screens() {
  const { loaded } = useStore();
  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ground }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ground } }} />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    AmiriQuran_400Regular,
    DigitalKhattIndoPak: require('../../assets/fonts/DigitalKhattIndoPak.ttf'),
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Newsreader_400Regular,
  });

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="dark" />
        {fontsLoaded ? (
          <Screens />
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.ground }} />
        )}
      </StoreProvider>
    </SafeAreaProvider>
  );
}
