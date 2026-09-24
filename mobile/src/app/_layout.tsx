import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/context/AuthContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Navigation guard — redirects to login when unauthenticated.
 *
 * Logic:
 *  - Stack is ALWAYS mounted so Expo Go never hangs waiting for a root view.
 *  - Once session check finishes (isLoading === false):
 *      • If unauthenticated: redirect to /(auth)/login
 *      • If authenticated:   redirect to / (dashboard)
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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="declarations" options={{ headerShown: false }} />
      <Stack.Screen
        name="create-declaration"
        options={{ title: 'New Declaration', headerShown: true, headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="declaration/[id]"
        options={{ title: 'Declaration Details', headerShown: true, headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="edit-declaration/[id]"
        options={{ title: 'Edit Declaration', headerShown: true, headerBackTitle: 'Back' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <NavigationGuard />
      </ThemeProvider>
    </AuthProvider>
  );
}
