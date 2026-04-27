import * as Location from 'expo-location';

export type UserLocation = {
  lat: number;
  lng: number;
  accuracy?: number | null;
};

export type LocationResult =
  | { status: 'granted'; location: UserLocation }
  | { status: 'denied'; message: string }
  | { status: 'unavailable'; message: string };

export type LocationWatcher = {
  remove: () => void;
};

function toUserLocation(location: Location.LocationObject): UserLocation {
  return {
    lat: location.coords.latitude,
    lng: location.coords.longitude,
    accuracy: location.coords.accuracy,
  };
}

export async function requestCurrentLocation(): Promise<LocationResult> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== Location.PermissionStatus.GRANTED) {
      return {
        status: 'denied',
        message: 'Location permission was not granted.',
      };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      status: 'granted',
      location: toUserLocation(location),
    };
  } catch (error) {
    return {
      status: 'unavailable',
      message: error instanceof Error ? error.message : 'Location is unavailable.',
    };
  }
}

export async function watchUserLocation(
  onLocation: (location: UserLocation) => void,
  onError?: (message: string) => void,
): Promise<LocationWatcher | null> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== Location.PermissionStatus.GRANTED) {
      onError?.('Location permission was not granted.');
      return null;
    }

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 25,
        timeInterval: 8000,
      },
      (location) => onLocation(toUserLocation(location)),
    );

    return {
      remove: () => subscription.remove(),
    };
  } catch (error) {
    onError?.(error instanceof Error ? error.message : 'Location is unavailable.');
    return null;
  }
}
