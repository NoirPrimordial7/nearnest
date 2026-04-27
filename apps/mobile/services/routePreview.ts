import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions } from './firebase';
import type { UserLocation } from './location';

export type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

export type RoutePreview = {
  source: 'backend' | 'fallback';
  distanceMeters?: number;
  duration?: string;
  coordinates: RouteCoordinate[];
  message?: string;
};

type RoutePreviewResponse = {
  distanceMeters?: number;
  duration?: string;
  coordinates?: RouteCoordinate[];
  encodedPolyline?: string;
  warning?: string;
};

export async function getRoutePreviewApi(
  origin: UserLocation,
  destination: UserLocation,
): Promise<RoutePreview> {
  const fallback = buildFallbackRoute(origin, destination);

  try {
    const callable = httpsCallable(firebaseFunctions, 'getRoutePreview');
    const result = await callable({
      origin,
      destination,
      travelMode: 'DRIVE',
    });
    const data = result.data as RoutePreviewResponse;
    const coordinates =
      Array.isArray(data.coordinates) && data.coordinates.length >= 2
        ? data.coordinates
        : data.encodedPolyline
          ? decodePolyline(data.encodedPolyline)
          : [];

    if (coordinates.length < 2) {
      return fallback;
    }

    return {
      source: 'backend',
      distanceMeters: data.distanceMeters,
      duration: data.duration,
      coordinates,
      message: data.warning,
    };
  } catch (error) {
    return {
      ...fallback,
      message:
        error instanceof Error
          ? 'Live route unavailable. Showing in-app preview.'
          : 'Live route unavailable. Showing in-app preview.',
    };
  }
}

export function buildFallbackRoute(origin: UserLocation, destination: UserLocation): RoutePreview {
  return {
    source: 'fallback',
    distanceMeters: estimateDistanceMeters(origin, destination),
    duration: `${Math.max(4, Math.round((estimateDistanceMeters(origin, destination) / 1000) * 8 + 3)) * 60}s`,
    coordinates: [
      { latitude: origin.lat, longitude: origin.lng },
      {
        latitude: (origin.lat + destination.lat) / 2 + 0.002,
        longitude: (origin.lng + destination.lng) / 2 - 0.002,
      },
      { latitude: destination.lat, longitude: destination.lng },
    ],
    message: 'Live route unavailable. Showing in-app preview.',
  };
}

export function formatRouteDuration(duration?: string) {
  const seconds = Number(String(duration ?? '').replace('s', ''));
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 'Route preview';
  }

  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
}

export function formatRouteDistance(distanceMeters?: number) {
  if (!distanceMeters || !Number.isFinite(distanceMeters)) {
    return 'Distance pending';
  }
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

function decodePolyline(encoded: string): RouteCoordinate[] {
  const coordinates: RouteCoordinate[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    const latResult = decodePolylineValue(encoded, index);
    index = latResult.nextIndex;
    lat += latResult.value;

    const lngResult = decodePolylineValue(encoded, index);
    index = lngResult.nextIndex;
    lng += lngResult.value;

    coordinates.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return coordinates;
}

function decodePolylineValue(encoded: string, startIndex: number) {
  let result = 0;
  let shift = 0;
  let index = startIndex;
  let byte = 0;

  do {
    byte = encoded.charCodeAt(index) - 63;
    index += 1;
    result |= (byte & 0x1f) << shift;
    shift += 5;
  } while (byte >= 0x20 && index < encoded.length);

  return {
    value: result & 1 ? ~(result >> 1) : result >> 1,
    nextIndex: index,
  };
}

function estimateDistanceMeters(origin: UserLocation, destination: UserLocation) {
  const earthRadiusMeters = 6371000;
  const lat1 = toRadians(origin.lat);
  const lat2 = toRadians(destination.lat);
  const deltaLat = toRadians(destination.lat - origin.lat);
  const deltaLng = toRadians(destination.lng - origin.lng);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
