import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useOnboarded } from '../lib/onboarding';
import { SkyScreen } from '../screens/SkyScreen';
import { COLORS } from '../sky/theme';

export default function Index() {
  const onboarded = useOnboarded();
  if (onboarded === null) return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;
  // The sky screen asks for location as soon as it mounts, so first-run users see the explanation first.
  if (!onboarded) return <Redirect href="/onboarding" />;
  return <SkyScreen />;
}
