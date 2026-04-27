import { useEffect, useMemo, useRef, useState } from 'react';
import Constants from 'expo-constants';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { colors, radius, spacing, type as typography } from '../theme/tokens';
import type { Store } from '../types/discovery';
import { MapPlaceholder } from './MapPlaceholder';
import type { RouteCoordinate } from '../services/routePreview';
import type { UserLocation } from '../services/location';

const PUNE_FALLBACK = {
  lat: 18.559,
  lng: 73.7868,
};

type MobileExtraConfig = {
  hasAndroidMapsKey?: boolean;
};

type RealMapViewProps = {
  stores: Store[];
  selectedStore?: Store | null;
  userLocation?: UserLocation | null;
  routeCoordinates?: RouteCoordinate[];
  title?: string;
  startMode?: boolean;
};

function coordinateForStore(store: Store) {
  const lat = Number(store.location?.lat);
  const lng = Number(store.location?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
    return { latitude: lat, longitude: lng };
  }

  if (__DEV__) {
    console.warn('[RealMapView] using Pune fallback coordinates for store', {
      storeId: store.id,
    });
  }
  return { latitude: PUNE_FALLBACK.lat, longitude: PUNE_FALLBACK.lng };
}

function buildRegion(
  stores: Store[],
  selectedStore?: Store | null,
  userLocation?: UserLocation | null,
): Region {
  const selected = selectedStore ? coordinateForStore(selectedStore) : null;
  const firstStore = stores[0] ? coordinateForStore(stores[0]) : null;
  const center = selected ?? firstStore ?? {
    latitude: userLocation?.lat ?? PUNE_FALLBACK.lat,
    longitude: userLocation?.lng ?? PUNE_FALLBACK.lng,
  };

  return {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: selectedStore ? 0.035 : 0.07,
    longitudeDelta: selectedStore ? 0.035 : 0.07,
  };
}

function canRenderNativeMap() {
  if (Platform.OS !== 'android') {
    return true;
  }

  const extra = Constants.expoConfig?.extra as MobileExtraConfig | undefined;
  return extra?.hasAndroidMapsKey === true;
}

export function RealMapView({
  stores,
  selectedStore,
  userLocation,
  routeCoordinates = [],
  title = 'Pharmacies near you',
  startMode = false,
}: RealMapViewProps) {
  const mapRef = useRef<MapView | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const region = useMemo(
    () => buildRegion(stores, selectedStore, userLocation),
    [selectedStore, stores, userLocation],
  );

  useEffect(() => {
    if (!mapRef.current || !startMode || !userLocation) {
      return;
    }

    mapRef.current.animateToRegion(
      {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      },
      550,
    );
  }, [startMode, userLocation]);

  if (!canRenderNativeMap()) {
    if (__DEV__) {
      console.warn('[RealMapView] Android Maps SDK key missing; using fallback map preview.');
    }
    return <MapPlaceholder stores={stores} title={title} />;
  }

  if (mapFailed) {
    return <MapPlaceholder stores={stores} title={title} />;
  }

  return (
    <View style={styles.wrap}>
      <MapView
        ref={mapRef}
        initialRegion={region}
        loadingEnabled
        onMapReady={() => setMapFailed(false)}
        onRegionChangeComplete={() => undefined}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsCompass={false}
        showsMyLocationButton={false}
        style={styles.map}
      >
        {userLocation ? (
          <Marker
            coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }}
            title="You"
          >
            <View style={styles.userMarker}>
              <Text style={styles.userMarkerText}>You</Text>
            </View>
          </Marker>
        ) : null}

        {stores.map((store) => {
          const selected = selectedStore?.id === store.id;
          return (
            <Marker
              coordinate={coordinateForStore(store)}
              key={store.id}
              title={store.name}
              description={store.verified ? 'Verified pharmacy' : 'Call to confirm'}
            >
              <View style={[styles.storeMarker, selected && styles.selectedMarker]}>
                <View style={styles.markerCore} />
              </View>
            </Marker>
          );
        })}

        {routeCoordinates.length >= 2 ? (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colors.accent500}
            strokeWidth={5}
          />
        ) : null}
      </MapView>
      <View style={styles.overlay}>
        <Text style={styles.overlayTitle}>{title}</Text>
        <Text style={styles.overlayBody}>
          {routeCoordinates.length >= 2 ? 'Route preview active inside Medifind' : `${stores.length} nearby stores`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 300,
    overflow: 'hidden',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceAlt,
  },
  map: {
    minHeight: 300,
  },
  overlay: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    gap: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  overlayTitle: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '800',
  },
  overlayBody: {
    color: colors.textMuted,
    fontSize: typography.bodySm,
    fontWeight: '600',
  },
  userMarker: {
    minWidth: 46,
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.text,
  },
  userMarkerText: {
    color: colors.textInvert,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  storeMarker: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 3,
    borderColor: colors.surface,
    backgroundColor: colors.primary500,
  },
  selectedMarker: {
    width: 34,
    height: 34,
    backgroundColor: colors.accent500,
  },
  markerCore: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
});
