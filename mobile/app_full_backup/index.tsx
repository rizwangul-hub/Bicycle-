import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { Colors, Spacing } from '@/constants/theme';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const shopName =
    typeof user?.shop === 'object' && user.shop !== null
      ? user.shop.name
      : typeof user?.shop === 'string'
      ? user.shop
      : 'Your Shop';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── Header ───────────────────────────────── */}
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: '#ffffff' }]}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.brand, { color: '#1a56db' }]}>PixxTechnologiees</Text>
          <Text style={[styles.shopName, { color: colors.text }]}>{shopName}</Text>
          <View style={[styles.shopPill, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.shopPillLabel, { color: colors.textSecondary }]}>
              Signed in as  
            </Text>
            <Text style={[styles.shopPillValue, { color: colors.text }]}>
              {user?.name ?? 'Shop User'}
            </Text>
          </View>
        </View>

        {/* ── Action Buttons ────────────────────────── */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.push('/create-declaration' as any)}
          >
            <Text style={styles.primaryBtnIcon}>＋</Text>
            <Text style={styles.primaryBtnText}>New Declaration</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryBtn,
              {
                backgroundColor: colors.backgroundElement,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={() => router.push('/declarations' as any)}
          >
            <Text style={styles.secondaryBtnIcon}>📋</Text>
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
              My Declarations
            </Text>
          </Pressable>
        </View>

        {/* ── Info Card ─────────────────────────────── */}
        <View style={[styles.infoCard, { backgroundColor: colors.backgroundElement }]}>
          <Text style={[styles.infoCardTitle, { color: colors.textSecondary }]}>
            About This App
          </Text>
          <Text style={[styles.infoCardText, { color: colors.text }]}>
            Use this app to digitally record Bicycle Owner's Declaration Forms when
            a customer sells or provides a bicycle to your shop.
          </Text>
        </View>

        {/* ── Logout ────────────────────────────────── */}
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={logout}
        >
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    padding: Spacing.four,
    gap: Spacing.three,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },

  // Header
  header: { alignItems: 'center', paddingVertical: Spacing.three, gap: Spacing.two },
  badge: {
    width: 76,
    height: 76,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    padding: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brand: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  shopName: { fontSize: 26, fontWeight: '800', textAlign: 'center', lineHeight: 32 },
  shopPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    gap: 4,
  },
  shopPillLabel: { fontSize: 13 },
  shopPillValue: { fontSize: 13, fontWeight: '600' },

  // Actions
  actions: { gap: Spacing.two },
  primaryBtn: {
    backgroundColor: '#1a56db',
    borderRadius: 14,
    padding: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  primaryBtnIcon: { color: '#fff', fontSize: 22, lineHeight: 24 },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  secondaryBtn: {
    borderRadius: 14,
    padding: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  secondaryBtnIcon: { fontSize: 22 },
  secondaryBtnText: { fontSize: 17, fontWeight: '600' },

  // Info card
  infoCard: { borderRadius: 14, padding: Spacing.three, gap: Spacing.one },
  infoCardTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoCardText: { fontSize: 14, lineHeight: 20 },

  // Logout
  logoutBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dc2626',
    padding: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  logoutText: { color: '#dc2626', fontSize: 15, fontWeight: '600' },
});
