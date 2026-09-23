import { Stack } from 'expo-router';

/**
 * Auth group layout — wraps unauthenticated screens.
 * Currently only contains the login screen.
 * Future: forgot password, etc.
 */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}
