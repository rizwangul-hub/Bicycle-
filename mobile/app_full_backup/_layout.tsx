import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter, useSegments } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/context/AuthContext';

/**
 * Navigation guard — redirects to login when unauthenticated,
 * and redirects to dashboard when authenticated.
 * 
 * Always mounts the Root Stack Navigator immediately so Expo Router
 * and Expo Go never hang during startup.
 */
function NavigationGuard() {
  const { user, isLoading } = useAuth();
  const router   = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/');
    }
  }, [user, isLoading, segments]);

  return (
    <Stack>
      <Stack.Screen name="(auth)"       options={{ headerShown: false }} />
      <Stack.Screen name="index"        options={{ headerShown: false }} />
      <Stack.Screen name="declarations" options={{ headerShown: false }} />
      <Stack.Screen
        name="create-declaration"
        options={{ title: 'New Declaration', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="declaration/[id]"
        options={{ title: 'Declaration Details', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="edit-declaration/[id]"
        options={{ title: 'Edit Declaration', headerBackTitle: 'Back' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <NavigationGuard />
      </ThemeProvider>
    </AuthProvider>
  );
}
