import { useEffect, useMemo, useRef, useState } from 'react';
import Constants from 'expo-constants';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  type MapStyleElement,
  type Region,
} from 'react-native-maps';

import { colors, radius, spacing, type as typography } from '../theme/tokens';
import type { Store } from '../types/discovery';
import { MapPlaceholder } from './MapPlaceholder';
import type { RouteCoordinate } from '../services/routePreview';
import type { UserLocation } from '../services/location';

const PUNE_FALLBACK = {
  lat: 18.559,
  lng: 73.7868,
};

const MAP_PADDING = {
  top: 84,
  right: 36,
  bottom: 42,
  left: 36,
};

const MEDICAL_MAP_STYLE: MapStyleElement[] = [
  {
    featureType: 'administrative',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#5C6570' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#F4F7F3' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.medical',
    elementType: 'labels',
    stylers: [{ visibility: 'on' }, { color: '#2F9E7E' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#DCEFE7' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#FFFFFF' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#7A858F' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#E8EEE9' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#D6EDE6' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#D7EAF4' }],
  },
];

type MobileExtraConfig = {
  hasAndroidMapsKey?: boolean;
};

type RealMapViewProps = {
  stores: Store[];
  selectedStore?: Store | null;
  userLocation?: UserLocation | null;
  routeCoordinates?: RouteCoordinate[];
  title?: string;
  subtitle?: string;
  startMode?: boolean;
  height?: number;
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
  subtitle,
  startMode = false,
  height = 340,
}: RealMapViewProps) {
  const mapRef = useRef<MapView | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const region = useMemo(
    () => buildRegion(stores, selectedStore, userLocation),
    [selectedStore, stores, userLocation],
  );
  const storeCoordinates = useMemo(() => stores.map(coordinateForStore), [stores]);
  const selectedCoordinate = useMemo(
    () => (selectedStore ? coordinateForStore(selectedStore) : null),
    [selectedStore],
  );
  const userCoordinate = useMemo(
    () =>
      userLocation
        ? { latitude: userLocation.lat, longitude: userLocation.lng }
        : null,
    [userLocation],
  );
  const overlaySubtitle =
    subtitle ??
    (routeCoordinates.length >= 2
      ? 'Route preview active inside Medifind'
      : `${stores.length} nearby ${stores.length === 1 ? 'store' : 'stores'}`);

  useEffect(() => {
    if (!mapRef.current || !mapReady) {
      return;
    }

    if (startMode && userLocation) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        },
        550,
      );
      return;
    }

    const fitCoordinates =
      routeCoordinates.length >= 2
        ? routeCoordinates
        : userCoordinate && selectedCoordinate
          ? [userCoordinate, selectedCoordinate]
          : storeCoordinates.length > 0
            ? storeCoordinates
            : [{ latitude: PUNE_FALLBACK.lat, longitude: PUNE_FALLBACK.lng }];

    if (fitCoordinates.length >= 2) {
      mapRef.current.fitToCoordinates(fitCoordinates, {
        animated: true,
        edgePadding: MAP_PADDING,
      });
    } else {
      mapRef.current.animateToRegion(region, 550);
    }
  }, [
    mapReady,
    region,
    routeCoordinates,
    selectedCoordinate,
    startMode,
    storeCoordinates,
    userCoordinate,
    userLocation,
  ]);

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
    <View style={[styles.wrap, { height, minHeight: height }]}>
      <MapView
        ref={mapRef}
        customMapStyle={MEDICAL_MAP_STYLE}
        initialRegion={region}
        loadingEnabled
        mapPadding={MAP_PADDING}
        onMapReady={() => {
          setMapFailed(false);
          setMapReady(true);
        }}
        onRegionChangeComplete={() => undefined}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsBuildings={false}
        showsCompass={false}
        showsMyLocationButton={false}
        showsPointsOfInterest={false}
        toolbarEnabled={false}
        style={StyleSheet.absoluteFill}
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
              <View
                style={[
                  styles.storeMarker,
                  !store.verified && styles.unverifiedMarker,
                  selected && styles.selectedMarker,
                ]}
              >
                <View style={styles.markerCore} />
              </View>
            </Marker>
          );
        })}

        {routeCoordinates.length >= 2 ? (
          <Polyline
            coordinates={routeCoordinates}
            lineCap="round"
            lineJoin="round"
            strokeColor={colors.accent500}
            strokeWidth={6}
          />
        ) : null}
      </MapView>
      <View style={styles.overlay}>
        <Text style={styles.overlayTitle}>{title}</Text>
        <Text style={styles.overlayBody}>{overlaySubtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceAlt,
  },
  overlay: {
    position: 'absolute',
    left: spacing.lg,
    right: '24%',
    top: spacing.lg,
    gap: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
    minWidth: 42,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.accent500,
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
  unverifiedMarker: {
    backgroundColor: colors.warning,
  },
  selectedMarker: {
    width: 40,
    height: 40,
    backgroundColor: colors.accent500,
  },
  markerCore: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
});
