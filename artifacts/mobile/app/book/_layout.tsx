import { Stack } from 'expo-router';
import { useColors } from '@/hooks/useColors';

export default function BookLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontFamily: 'Inter_700Bold', color: colors.foreground },
        headerShadowVisible: false,
        headerBackTitle: 'Back',
      }}
    />
  );
}
