import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useDeclarations } from '@/hooks/useDeclarations';
import { Colors, ColorTheme, Spacing } from '@/constants/theme';
import type { Declaration } from '@/types';

type FilterType = 'ALL' | 'WITH_FRAME' | 'WITH_COLOUR' | 'UNCONFIRMED';

function formatDate(iso?: string) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return null;
  }
}

function DeclarationCard({
  item,
  onPress,
  colors,
}: {
  item: Declaration;
  onPress: () => void;
  colors: ColorTheme;
}) {
  const createdDate = formatDate(item.date || item.createdAt);
  const shortId = item._id.slice(-6).toUpperCase();
  const bikeInfo = [item.bicycleMake, item.bicycleModel].filter(Boolean).join(' ');

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.backgroundElement, opacity: pressed ? 0.82 : 1 },
      ]}
      onPress={onPress}
    >
      {/* Top Header: Customer Name & Date */}
      <View style={styles.cardTop}>
        <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
          {item.customerName}
        </Text>
        {createdDate && (
          <Text style={[styles.cardDate, { color: colors.textSecondary }]}>{createdDate}</Text>
        )}
      </View>

      {/* Bicycle Details: Make, Model, Colour */}
      <View style={styles.bikeRow}>
        <Text style={[styles.cardModel, { color: colors.text }]} numberOfLines={1}>
          🚲 {bikeInfo}
        </Text>
        {item.bicycleColour ? (
          <View style={styles.colourPill}>
            <Text style={styles.colourText}>{item.bicycleColour}</Text>
          </View>
        ) : null}
      </View>

      {/* Bottom Meta: Frame Number & Short ID */}
      <View style={styles.cardBottom}>
        <Text style={[styles.cardFrame, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.frameNumber ? `Frame: ${item.frameNumber}` : 'Frame: Not specified'}
        </Text>
        <Text style={[styles.cardId, { color: colors.textSecondary }]}>
          #{shortId}
        </Text>
      </View>
    </Pressable>
  );
}

export default function DeclarationsScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const {
    declarations,
    meta,
    isLoading,
    isLoadingMore,
    error,
    fetchDeclarations,
    loadMore,
  } = useDeclarations();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  // Debounce search input (400ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch when search changes
  useEffect(() => {
    fetchDeclarations(debouncedSearch || undefined, 1);
  }, [debouncedSearch, fetchDeclarations]);

  const handleRefresh = useCallback(() => {
    fetchDeclarations(debouncedSearch || undefined, 1);
  }, [debouncedSearch, fetchDeclarations]);

  // Client-side quick filter chips for instant feedback
  const filteredDeclarations = useMemo(() => {
    if (activeFilter === 'ALL') return declarations;
    if (activeFilter === 'WITH_FRAME') {
      return declarations.filter((d) => Boolean(d.frameNumber?.trim()));
    }
    if (activeFilter === 'WITH_COLOUR') {
      return declarations.filter((d) => Boolean(d.bicycleColour?.trim()));
    }
    if (activeFilter === 'UNCONFIRMED') {
      return declarations.filter((d) => !d.legalOwnerConfirmed);
    }
    return declarations;
  }, [declarations, activeFilter]);

  const filterChips: { type: FilterType; label: string }[] = [
    { type: 'ALL', label: 'All' },
    { type: 'WITH_FRAME', label: 'With Frame #' },
    { type: 'WITH_COLOUR', label: 'With Colour' },
    { type: 'UNCONFIRMED', label: 'Unconfirmed' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* ── Search Bar ────────────────────── */}
      <View style={[styles.searchBar, { backgroundColor: colors.backgroundElement }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by name, model, make, frame #, phone..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Text style={[styles.clearBtn, { color: colors.textSecondary }]}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* ── Filter Chips ──────────────────── */}
      <View style={styles.filterRow}>
        {filterChips.map((chip) => {
          const isActive = activeFilter === chip.type;
          return (
            <Pressable
              key={chip.type}
              style={[
                styles.chip,
                isActive
                  ? styles.chipActive
                  : { backgroundColor: colors.backgroundElement },
              ]}
              onPress={() => setActiveFilter(chip.type)}
            >
              <Text
                style={[
                  styles.chipText,
                  isActive
                    ? styles.chipTextActive
                    : { color: colors.textSecondary },
                ]}
              >
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Main List Content ─────────────── */}
      {isLoading && declarations.length === 0 ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#1a56db" />
          <Text style={[styles.centerText, { color: colors.textSecondary }]}>
            Loading declarations…
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={handleRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredDeclarations}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.listContent,
            filteredDeclarations.length === 0 && styles.listEmpty,
          ]}
          refreshing={isLoading}
          onRefresh={handleRefresh}
          renderItem={({ item }) => (
            <DeclarationCard
              item={item}
              colors={colors}
              onPress={() => router.push(`/declaration/${item._id}` as any)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {debouncedSearch
                  ? 'No matching declarations found.'
                  : activeFilter !== 'ALL'
                  ? 'No records match this filter.'
                  : 'No declarations found.'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {debouncedSearch
                  ? `No declarations matched "${debouncedSearch}". Try another keyword.`
                  : activeFilter !== 'ALL'
                  ? 'Switch back to "All" to view all records.'
                  : 'Your shop has not created any declarations yet.'}
              </Text>
              {!debouncedSearch && activeFilter === 'ALL' && (
                <Pressable
                  style={styles.emptyBtn}
                  onPress={() => router.push('/create-declaration' as any)}
                >
                  <Text style={styles.emptyBtnText}>＋ Create Declaration</Text>
                </Pressable>
              )}
            </View>
          }
          ListFooterComponent={
            <View style={styles.footerContainer}>
              {/* Load More Button */}
              {meta && meta.page < meta.totalPages ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.loadMoreBtn,
                    { opacity: pressed || isLoadingMore ? 0.7 : 1 },
                  ]}
                  onPress={() => loadMore(debouncedSearch || undefined)}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <View style={styles.loadingMoreRow}>
                      <ActivityIndicator size="small" color="#1a56db" />
                      <Text style={styles.loadMoreText}>Loading more...</Text>
                    </View>
                  ) : (
                    <Text style={styles.loadMoreText}>
                      Load More Declarations ({declarations.length} of {meta.total})
                    </Text>
                  )}
                </Pressable>
              ) : null}

              {meta && meta.total > 0 && (
                <Text style={[styles.footerCount, { color: colors.textSecondary }]}>
                  Showing {filteredDeclarations.length} of {meta.total} declaration{meta.total !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    gap: Spacing.two,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15 },
  clearBtn: { fontSize: 16, fontWeight: '600', paddingHorizontal: 4 },

  // Filters
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipActive: {
    backgroundColor: '#1a56db',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },

  // List
  listContent: { padding: Spacing.three, gap: Spacing.two, paddingTop: 0 },
  listEmpty:   { flex: 1 },

  // Cards
  card: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: 6,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  cardDate: {
    fontSize: 12,
  },
  bikeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardModel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  colourPill: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  colourText: {
    fontSize: 11,
    fontWeight: '500',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  cardFrame: {
    fontSize: 12,
  },
  cardId: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
  },

  // Loading / Error
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  centerText: { fontSize: 15 },
  errorText: { color: '#dc2626', fontSize: 15, textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#1a56db',
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  retryText: { color: '#fff', fontWeight: '600' },

  // Empty
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    gap: Spacing.two,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    backgroundColor: '#1a56db',
    borderRadius: 10,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    marginTop: Spacing.two,
  },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  // Footer & Load More
  footerContainer: {
    paddingVertical: Spacing.three,
    gap: 8,
    alignItems: 'center',
  },
  loadMoreBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a56db',
    backgroundColor: 'rgba(26, 86, 219, 0.05)',
  },
  loadingMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadMoreText: {
    color: '#1a56db',
    fontSize: 13,
    fontWeight: '600',
  },
  footerCount: {
    textAlign: 'center',
    fontSize: 12,
  },
});
