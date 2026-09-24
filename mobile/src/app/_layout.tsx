import { DarkTheme, DefaultTheme, ThemeProvider, Slot, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, Image, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/context/AuthContext';

function NavigationGuard() {
  const { user, isLoading } = useAuth();
  const router   = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Immediately dismiss native splash screen so Expo Go never hangs at 99%
    SplashScreen.hideAsync().catch(() => {});

    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.logoBadge}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.brandTitle}>PixxTechnologiees</Text>
        <Text style={styles.brandSubtitle}>Bicycle Management System</Text>
        <ActivityIndicator size="small" color="#1a56db" style={{ marginTop: 20 }} />
      </View>
    );
  }

  if (!user) return <Slot />;

  return (
    <Stack>
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

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoBadge: {
    width: 90,
    height: 90,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
  },
  logoImage: {
    width: 72,
    height: 72,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
  },
});
