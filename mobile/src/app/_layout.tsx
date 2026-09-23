import { DarkTheme, DefaultTheme, ThemeProvider, Slot, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/context/AuthContext';

SplashScreen.preventAutoHideAsync();

/**
 * Navigation guard — redirects to login when unauthenticated.
 *
 * Logic:
 *  - isLoading:     keep splash visible (return null)
 *  - user === null: redirect to /(auth)/login
 *  - user exists:   render the authenticated stack layout
 *
 * The Stack below exposes:
 *  • (auth)               — login group (no header)
 *  • index                — Dashboard tab screen (no header)
 *  • declarations         — Declarations tab screen (no header)
 *  • create-declaration   — push screen with header
 *  • declaration/[id]     — push screen with header
 *
 * The NativeTabs component (in AppTabs) is rendered from inside index.tsx /
 * declarations.tsx via the expo-router file-system nesting, so it shows the
 * bottom tab bar on both tab screens automatically.
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

  if (isLoading) return null;
  if (!user)     return <Slot />;

  // Authenticated: Stack manages all app screens.
  // AppTabs is wired via NativeTabs inside the file system (app/index.tsx,
  // app/declarations.tsx share the same NativeTabs instance from app-tabs.tsx).
  return (
    <Stack>
      {/* Tab root screens — NativeTabs handles the bottom bar for these */}
      <Stack.Screen name="index"        options={{ headerShown: false }} />
      <Stack.Screen name="declarations" options={{ headerShown: false }} />

      {/* Stack screens pushed over the tabs */}
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
        <AnimatedSplashOverlay />
        <NavigationGuard />
      </ThemeProvider>
    </AuthProvider>
  );
}
