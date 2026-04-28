export type MedifindTelemetryEvent =
  | 'medifind.app.launch'
  | 'medifind.home.mode_toggle'
  | 'medifind.search.submitted'
  | 'medifind.search.no_results'
  | 'medifind.search.suggestion_tapped'
  | 'medifind.results.medicine_viewed'
  | 'medifind.results.similar_tapped'
  | 'medifind.results.find_stores_tapped'
  | 'medifind.stores.list_view_open'
  | 'medifind.stores.map_view_open'
  | 'medifind.stores.store_card_tapped'
  | 'medifind.stores.store_call_clicked'
  | 'medifind.stores.store_navigate_clicked'
  | 'medifind.navigation.store_fallback_used'
  | 'medifind.store.in_store_search_used'
  | 'medifind.category.opened'
  | 'medifind.profile.large_type_toggled'
  | 'medifind.error.shown'
  | 'medifind.offline.shown';

export const medifindTelemetry = {
  emit(name: MedifindTelemetryEvent, payload: Record<string, unknown> = {}) {
    if (__DEV__) {
      console.log('[medifind.telemetry]', name, payload);
    }
  },
};
