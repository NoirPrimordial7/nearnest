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

const CURRENT_LOCATION_TIMEOUT_MS = 4000;

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

    const location = await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),
      CURRENT_LOCATION_TIMEOUT_MS,
      'Location took too long to respond.',
    );

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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
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
