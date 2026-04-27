import { router, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../../components/ActionButton';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { Screen } from '../../components/Screen';
import { SearchBar } from '../../components/SearchBar';
import { useFontScale } from '../../hooks/useFontScale';
import {
  getPopularSuggestions,
  getRecentSearches,
  getSuggestions,
} from '../../services/mockDiscovery';
import { medifindTelemetry } from '../../services/telemetry';
import { colors, radius, spacing, type as typography } from '../../theme/tokens';
import type { SearchSuggestion } from '../../types/discovery';

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function SearchScreen() {
  const params = useLocalSearchParams();
  const initialQuery = getParamValue(params.q);
  const [query, setQuery] = useState(initialQuery);
  const [submittedNoResults, setSubmittedNoResults] = useState(false);
  const suggestions = useMemo(() => getSuggestions(query), [query]);
  const recents = useMemo(() => getRecentSearches().slice(0, 5), []);
  const popular = useMemo(() => getPopularSuggestions().slice(0, 8), []);
  const { scale, scaleLineHeight } = useFontScale();

  useEffect(() => {
    const nextQuery = getParamValue(params.q);
    setQuery(nextQuery);
  }, [params.q]);

  function submitSearch(nextQuery = query) {
    const trimmed = nextQuery.trim();
    if (!trimmed) {
      return;
    }

    const nextSuggestions = getSuggestions(trimmed);
    medifindTelemetry.emit('medifind.search.submitted', {
      q_length: trimmed.length,
      mode: 'medicine',
      had_correction: false,
    });

    if (nextSuggestions.length === 0) {
      setSubmittedNoResults(true);
      medifindTelemetry.emit('medifind.search.no_results', {
        q_length: trimmed.length,
        mode: 'medicine',
      });
      return;
    }

    router.push({ pathname: '/results', params: { q: trimmed } });
  }

  function openSuggestion(suggestion: SearchSuggestion) {
    medifindTelemetry.emit('medifind.search.suggestion_tapped', {
      suggestion_kind: suggestion.kind,
    });

    switch (suggestion.routeHint.kind) {
      case 'medicine':
        medifindTelemetry.emit('medifind.results.medicine_viewed', {
          medicine_id: suggestion.routeHint.medicineId,
          result_group: 'suggestion',
        });
        router.push({
          pathname: '/medicine/[medicineId]',
          params: { medicineId: suggestion.routeHint.medicineId },
        });
        return;
      case 'category':
        router.push({
          pathname: '/category/[categoryId]',
          params: { categoryId: suggestion.routeHint.categoryId },
        });
        return;
      case 'composition':
      case 'symptom':
        router.push({ pathname: '/results', params: { q: suggestion.display } });
        return;
    }
  }

  const showStarter = query.trim().length === 0;

  return (
    <Screen
      eyebrow="Search"
      title="Search medicines"
      description="Search by brand, composition, strength, category, or a small set of neutral OTC routing terms."
    >
      <View style={styles.stack}>
        <SearchBar
          onChangeText={(next) => {
            setSubmittedNoResults(false);
            setQuery(next);
          }}
          onSubmitEditing={() => submitSearch()}
          placeholder="Search medicines, brands or compositions"
          value={query}
          variant="input"
        />
        <View style={styles.searchActions}>
          <ActionButton label="Search" onPress={() => submitSearch()} />
          <ActionButton label="Filters" onPress={() => router.push({ pathname: '/results', params: { q: query.trim() || 'Dolo' } })} variant="secondary" />
        </View>

        {submittedNoResults || (!showStarter && suggestions.length === 0) ? (
          <EmptyState
            actionLabel="Clear search"
            body="Try a brand name or composition like Paracetamol."
            onAction={() => {
              setQuery('');
              setSubmittedNoResults(false);
            }}
            title={`No match for "${query.trim()}".`}
          />
        ) : null}

        {showStarter ? (
          <>
            <Section title="Recent">
              <View style={styles.chipRow}>
                {recents.map((recent) => (
                  <Chip
                    key={`${recent.query}-${recent.ts}`}
                    label={recent.query}
                    onPress={() => submitSearch(recent.query)}
                  />
                ))}
              </View>
            </Section>
            <Section title="Popular">
              <View style={styles.suggestionStack}>
                {popular.map((suggestion) => (
                  <SuggestionRow
                    key={suggestion.id}
                    onPress={() => openSuggestion(suggestion)}
                    suggestion={suggestion}
                  />
                ))}
              </View>
            </Section>
          </>
        ) : suggestions.length > 0 ? (
          <Section
            actionLabel="See all results"
            onAction={() => submitSearch()}
            title="Suggestions"
          >
            <View style={styles.suggestionStack}>
              {suggestions.map((suggestion) => (
                <SuggestionRow
                  key={suggestion.id}
                  onPress={() => openSuggestion(suggestion)}
                  suggestion={suggestion}
                />
              ))}
            </View>
          </Section>
        ) : null}

        <Text style={[styles.disclaimer, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
          Searches for symptom terms are routing shortcuts only. Medifind does not provide medical advice.
        </Text>
      </View>
    </Screen>
  );
}

function Section({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  const { scale, scaleLineHeight } = useFontScale();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { fontSize: scale(typography.h3), lineHeight: scaleLineHeight(24) }]}>
          {title}
        </Text>
        {actionLabel && onAction ? (
          <Pressable accessibilityRole="button" onPress={onAction}>
            <Text style={styles.sectionAction}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function SuggestionRow({
  suggestion,
  onPress,
}: {
  suggestion: SearchSuggestion;
  onPress: () => void;
}) {
  const { scale, scaleLineHeight } = useFontScale();

  return (
    <Pressable
      accessibilityHint={suggestion.hint}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
    >
      <View style={styles.suggestionText}>
        <Text style={[styles.suggestionDisplay, { fontSize: scale(typography.body), lineHeight: scaleLineHeight(22) }]}>
          {suggestion.display}
        </Text>
        {suggestion.hint ? (
          <Text style={[styles.suggestionHint, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
            {suggestion.hint}
          </Text>
        ) : null}
      </View>
      <Text style={styles.suggestionKind}>{suggestion.kind}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  searchActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  sectionAction: {
    color: colors.primary700,
    fontSize: typography.bodySm,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestionStack: {
    gap: spacing.md,
  },
  suggestion: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  suggestionText: {
    flex: 1,
    gap: spacing.xs,
  },
  suggestionDisplay: {
    color: colors.text,
    fontWeight: '700',
  },
  suggestionHint: {
    color: colors.textMuted,
  },
  suggestionKind: {
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textTransform: 'capitalize',
  },
  disclaimer: {
    color: colors.textMuted,
  },
});

