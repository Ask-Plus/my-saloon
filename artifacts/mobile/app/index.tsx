import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

function Loading() {
  const colors = useColors();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Loading />;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role === 'owner') return <Redirect href="/(owner)" />;
  return <Redirect href="/(customer)" />;
}
