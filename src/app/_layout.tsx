import { SpaceGrotesk_700Bold, useFonts } from '@expo-google-fonts/space-grotesk';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProProvider } from '../lib/purchases';

export default function RootLayout() {
  // Text falls back to the system font until this resolves, so rendering is never blocked on it.
  useFonts({ SpaceGrotesk_700Bold });
  return (
    <SafeAreaProvider>
      <ProProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0F24' } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen
            name="tonight"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Tonight',
              headerStyle: { backgroundColor: '#0A0F24' },
              headerTintColor: '#F4F1E8',
            }}
          />
        </Stack>
      </ProProvider>
    </SafeAreaProvider>
  );
}
