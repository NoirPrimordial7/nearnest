import { httpsCallable } from 'firebase/functions';

import type {
  Category,
  Medicine,
  MedicineAvailability,
  ResultFilter,
  ResultGroups,
  StockLabel,
  Store,
  StoreInventoryGroup,
  StoreInventoryItem,
} from '../types/discovery';
import { firebaseFunctions } from './firebase';
import {
  getAvailabilityForMedicine,
  getCategoryById,
  getFreshnessStatus,
  getInventoryForStore,
  getMedicineById,
  getMedicinesByCategory,
  getResultGroups,
  getSimilarMedicines,
  getStoreById,
  getStoresByDistance,
} from './mockDiscovery';

export const DEFAULT_DISCOVERY_LOCATION = {
  lat: 18.559,
  lng: 73.7868,
};

type ApiSource = 'backend' | 'mock';

type DiscoveryResponse<T> = T & {
  source: ApiSource;
  error?: string;
};

type SearchMedicinesPayload = {
  q: string;
  radiusKm?: number;
  filter?: ResultFilter;
};

type SearchMedicinesResponse = {
  query?: string;
  items?: Array<{
    medicine?: Medicine;
    availability?: Array<{
      store?: Store;
      item?: StoreInventoryItem;
    }>;
  }>;
};

type NearbyStoresResponse = {
  stores?: Array<Store & { availableMedicines?: StoreInventoryItem[] }>;
};

type MedicineDetailResponse = {
  medicine?: Medicine | null;
  availability?: Array<{
    store?: Store;
    item?: StoreInventoryItem;
  }>;
  similar?: Medicine[];
};

type StoreDetailResponse = {
  store?: Store | null;
  groups?: StoreInventoryGroup[];
};

type CategoryMedicinesResponse = {
  category?: Category | null;
  medicines?: Medicine[];
};

export async function searchMedicinesApi({
  q,
  radiusKm = 5,
  filter = 'all',
}: SearchMedicinesPayload): Promise<
  DiscoveryResponse<{
    groups: ResultGroups;
    availabilityByMedicine: Record<string, MedicineAvailability[]>;
  }>
> {
  try {
    const callable = httpsCallable(firebaseFunctions, 'searchMedicines');
    const result = await callable({
      q,
      radiusKm,
      location: DEFAULT_DISCOVERY_LOCATION,
      filters: filterToBackend(filter),
    });
    const data = result.data as SearchMedicinesResponse;
    const items = Array.isArray(data.items) ? data.items : [];
    const medicines = items
      .map((item) => ensureMedicine(item.medicine))
      .filter((medicine): medicine is Medicine => Boolean(medicine));
    const availabilityByMedicine: Record<string, MedicineAvailability[]> = {};

    items.forEach((item) => {
      const medicine = ensureMedicine(item.medicine);
      if (!medicine) {
        return;
      }

      availabilityByMedicine[medicine.id] = (item.availability ?? [])
        .map((availability) => {
          const store = ensureStore(availability.store);
          const inventoryItem = ensureInventoryItem(availability.item, store?.id, medicine.id);
          if (!store || !inventoryItem) {
            return null;
          }

          return {
            medicine,
            store,
            item: inventoryItem,
            freshnessStatus: getFreshnessStatus(inventoryItem.updatedAt),
          };
        })
        .filter((row): row is MedicineAvailability => Boolean(row));
    });

    return {
      source: 'backend',
      groups: buildResultGroups(q, medicines, filter),
      availabilityByMedicine,
    };
  } catch (error) {
    const fallbackGroups = getResultGroups(q, filter);
    return {
      source: 'mock',
      groups: fallbackGroups,
      availabilityByMedicine: buildMockAvailabilityMap(fallbackGroups),
      error: getErrorMessage(error),
    };
  }
}

export async function getNearbyStoresApi(
  medicineId?: string,
  radiusKm = 5,
): Promise<
  DiscoveryResponse<{
    stores: Store[];
    availableItemsByStore: Record<string, StoreInventoryItem | undefined>;
  }>
> {
  try {
    const callable = httpsCallable(
      firebaseFunctions,
      medicineId ? 'getMedicineStores' : 'nearbyStores',
    );
    const result = await callable({
      medicineId,
      radiusKm,
      location: DEFAULT_DISCOVERY_LOCATION,
    });
    const data = result.data as NearbyStoresResponse;
    const stores = (data.stores ?? [])
      .map((store) => ensureStore(store))
      .filter((store): store is Store => Boolean(store));
    const availableItemsByStore: Record<string, StoreInventoryItem | undefined> = {};

    (data.stores ?? []).forEach((store) => {
      const normalizedStore = ensureStore(store);
      if (!normalizedStore) {
        return;
      }
      const firstItem = store.availableMedicines?.[0];
      availableItemsByStore[normalizedStore.id] = ensureInventoryItem(
        firstItem,
        normalizedStore.id,
        medicineId,
      ) ?? undefined;
    });

    return {
      source: 'backend',
      stores,
      availableItemsByStore,
    };
  } catch (error) {
    const stores = medicineId
      ? getAvailabilityForMedicine(medicineId).map((row) => row.store)
      : getStoresByDistance();
    const availableItemsByStore = Object.fromEntries(
      stores.map((store) => [
        store.id,
        medicineId
          ? getAvailabilityForMedicine(medicineId).find((row) => row.store.id === store.id)?.item
          : undefined,
      ]),
    );

    return {
      source: 'mock',
      stores,
      availableItemsByStore,
      error: getErrorMessage(error),
    };
  }
}

export async function getMedicineDetailApi(
  medicineId: string,
): Promise<
  DiscoveryResponse<{
    medicine: Medicine | null;
    availability: MedicineAvailability[];
    similar: Medicine[];
  }>
> {
  try {
    const callable = httpsCallable(firebaseFunctions, 'getMedicineDetail');
    const result = await callable({
      medicineId,
      radiusKm: 5,
      location: DEFAULT_DISCOVERY_LOCATION,
    });
    const data = result.data as MedicineDetailResponse;
    const medicine = ensureMedicine(data.medicine);

    if (!medicine) {
      return {
        source: 'backend',
        medicine: null,
        availability: [],
        similar: [],
      };
    }

    const availability = (data.availability ?? [])
      .map((row) => {
        const store = ensureStore(row.store);
        const item = ensureInventoryItem(row.item, store?.id, medicine.id);
        if (!store || !item) {
          return null;
        }

        return {
          medicine,
          store,
          item,
          freshnessStatus: getFreshnessStatus(item.updatedAt),
        };
      })
      .filter((row): row is MedicineAvailability => Boolean(row));
    const similar = (data.similar ?? [])
      .map((row) => ensureMedicine(row))
      .filter((row): row is Medicine => Boolean(row));

    return {
      source: 'backend',
      medicine,
      availability,
      similar,
    };
  } catch (error) {
    const medicine = getMedicineById(medicineId);
    return {
      source: 'mock',
      medicine,
      availability: medicine ? getAvailabilityForMedicine(medicine.id) : [],
      similar: medicine ? getSimilarMedicines(medicine.id) : [],
      error: getErrorMessage(error),
    };
  }
}

export async function getStoreDetailApi(
  storeId: string,
  q = '',
  filter: ResultFilter = 'all',
): Promise<
  DiscoveryResponse<{
    store: Store | null;
    groups: StoreInventoryGroup[];
  }>
> {
  try {
    const callable = httpsCallable(firebaseFunctions, 'getStoreDetail');
    const result = await callable({
      storeId,
      q,
      filters: filterToBackend(filter),
    });
    const data = result.data as StoreDetailResponse;
    const store = ensureStore(data.store);

    if (!store) {
      return {
        source: 'backend',
        store: null,
        groups: [],
      };
    }

    const groups = (data.groups ?? [])
      .map((group) => ensureStoreInventoryGroup(group))
      .filter((group): group is StoreInventoryGroup => Boolean(group));

    return {
      source: 'backend',
      store,
      groups,
    };
  } catch (error) {
    return {
      source: 'mock',
      store: getStoreById(storeId),
      groups: getInventoryForStore(storeId, q, filter),
      error: getErrorMessage(error),
    };
  }
}

export async function getCategoryMedicinesApi(
  categoryId: string,
  filter: ResultFilter = 'all',
): Promise<
  DiscoveryResponse<{
    category: Category | null;
    medicines: Medicine[];
  }>
> {
  try {
    const callable = httpsCallable(firebaseFunctions, 'getCategoryMedicines');
    const result = await callable({
      categoryId,
      filters: filterToBackend(filter),
    });
    const data = result.data as CategoryMedicinesResponse;
    const medicines = (data.medicines ?? [])
      .map((medicine) => ensureMedicine(medicine))
      .filter((medicine): medicine is Medicine => Boolean(medicine))
      .filter((medicine) => filterMedicine(medicine, filter));

    return {
      source: 'backend',
      category: ensureCategory(data.category) ?? getCategoryById(categoryId),
      medicines,
    };
  } catch (error) {
    return {
      source: 'mock',
      category: getCategoryById(categoryId),
      medicines: getMedicinesByCategory(categoryId, filter),
      error: getErrorMessage(error),
    };
  }
}

function buildResultGroups(
  queryText: string,
  medicines: Medicine[],
  filter: ResultFilter,
): ResultGroups {
  const matches = medicines.filter((medicine) => filterMedicine(medicine, filter));
  const bestMatch = matches[0] ?? null;
  const brandVariants = bestMatch
    ? matches.filter(
        (medicine) =>
          medicine.id !== bestMatch.id && medicine.manufacturer.id === bestMatch.manufacturer.id,
      )
    : [];
  const bestCompositionKeys = new Set(
    bestMatch?.compositions.map((composition) => composition.saltKey || composition.id) ?? [],
  );
  const sameComposition = bestMatch
    ? matches.filter(
        (medicine) =>
          medicine.id !== bestMatch.id &&
          medicine.compositions.some((composition) =>
            bestCompositionKeys.has(composition.saltKey || composition.id),
          ),
      )
    : [];
  const bestCategoryIds = new Set(bestMatch?.categoryIds ?? []);
  const similarByCategory = matches
    .filter(
      (medicine) =>
        medicine.id !== bestMatch?.id &&
        !brandVariants.some((variant) => variant.id === medicine.id) &&
        !sameComposition.some((same) => same.id === medicine.id) &&
        medicine.categoryIds.some((categoryId) => bestCategoryIds.has(categoryId)),
    )
    .slice(0, 6);

  return {
    query: queryText,
    bestMatch,
    brandVariants,
    sameComposition,
    similarByCategory,
  };
}

function buildMockAvailabilityMap(groups: ResultGroups) {
  const medicines = [
    groups.bestMatch,
    ...groups.brandVariants,
    ...groups.sameComposition,
    ...groups.similarByCategory,
  ].filter(Boolean) as Medicine[];

  return Object.fromEntries(
    medicines.map((medicine) => [medicine.id, getAvailabilityForMedicine(medicine.id)]),
  );
}

function ensureMedicine(value: unknown): Medicine | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const data = value as Partial<Medicine>;
  if (!data.id || !data.name) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    nameLocalised: data.nameLocalised,
    aliases: data.aliases ?? [],
    hindiAliases: data.hindiAliases,
    manufacturer: data.manufacturer ?? { id: 'unknown', name: 'Unknown manufacturer' },
    compositions: data.compositions ?? [],
    form: data.form ?? 'tablet',
    packSize: data.packSize ?? '',
    imageUrl: data.imageUrl ?? '',
    requiresPrescription: Boolean(data.requiresPrescription),
    categoryIds: data.categoryIds ?? [],
    searchTokens: data.searchTokens ?? [],
    similarMedicineIds: data.similarMedicineIds ?? [],
    variantOfMedicineId: data.variantOfMedicineId,
    description: data.description,
  };
}

function ensureStore(value: unknown): Store | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const data = value as Partial<Store>;
  if (!data.id || !data.name) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    ownerName: data.ownerName,
    verified: Boolean(data.verified),
    licenseNumber: data.licenseNumber,
    licenseAuthority: data.licenseAuthority,
    address: data.address ?? { line1: '', city: '', state: '', pincode: '' },
    location: data.location ?? { lat: 0, lng: 0, geohash: '' },
    contact: data.contact ?? { publicPhoneE164: '' },
    hours: data.hours ?? {},
    distanceKm: Number(data.distanceKm ?? 0),
    isOpenNow: Boolean(data.isOpenNow),
    closesAtLabel: data.closesAtLabel,
    freshnessLabel: data.freshnessLabel ?? 'Inventory freshness unavailable',
    freshnessUpdatedAt: Number(data.freshnessUpdatedAt ?? Date.now()),
  };
}

function ensureInventoryItem(
  value: unknown,
  storeId?: string,
  medicineId?: string,
): StoreInventoryItem | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const data = value as Partial<StoreInventoryItem> & {
    stock?: number;
    quantity?: number;
    price?: { mrp?: number; sellingPrice?: number };
    priceInr?: number;
    sku?: string;
  };
  const stockLabel = normalizeStockLabel(data);

  return {
    storeId: data.storeId ?? storeId ?? '',
    medicineId: data.medicineId ?? medicineId ?? '',
    inStock: data.inStock ?? stockLabel !== 'out',
    stockLabel,
    priceInr: data.priceInr ?? normalizePrice(data),
    updatedAt: Number(data.updatedAt ?? Date.now()),
  };
}

function ensureCategory(value: unknown): Category | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const data = value as Partial<Category>;
  if (!data.id || !data.name) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    iconKey: data.iconKey ?? 'pill',
    order: Number(data.order ?? 999),
  };
}

function ensureStoreInventoryGroup(value: unknown): StoreInventoryGroup | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const data = value as Partial<StoreInventoryGroup>;
  const category = ensureCategory(data.category);
  if (!category || !Array.isArray(data.items)) {
    return null;
  }

  const items = data.items
    .map((row) => {
      const medicine = ensureMedicine(row.medicine);
      const item = ensureInventoryItem(row.item, undefined, medicine?.id);
      if (!medicine || !item) {
        return null;
      }

      return {
        medicine,
        item,
        freshnessStatus: row.freshnessStatus ?? getFreshnessStatus(item.updatedAt),
      };
    })
    .filter((row): row is StoreInventoryGroup['items'][number] => Boolean(row));

  return {
    category,
    items,
  };
}

function filterMedicine(medicine: Medicine, filter: ResultFilter) {
  if (filter === 'rx') {
    return medicine.requiresPrescription;
  }
  if (filter === 'otc') {
    return !medicine.requiresPrescription;
  }
  return true;
}

function filterToBackend(filter: ResultFilter) {
  return {
    rxOnly: filter === 'rx',
    otcOnly: filter === 'otc',
  };
}

function normalizeStockLabel(data: {
  stockLabel?: StockLabel;
  stock?: number;
  quantity?: number;
  inStock?: boolean;
}): StockLabel {
  if (data.stockLabel === 'in_stock' || data.stockLabel === 'low' || data.stockLabel === 'out') {
    return data.stockLabel;
  }
  const stock = Number(data.stock ?? data.quantity ?? 0);
  if (data.inStock === false || stock <= 0) {
    return 'out';
  }
  return stock <= 3 ? 'low' : 'in_stock';
}

function normalizePrice(data: { price?: { mrp?: number; sellingPrice?: number } }) {
  if (typeof data.price?.sellingPrice === 'number') {
    return Math.round(data.price.sellingPrice / 100);
  }
  if (typeof data.price?.mrp === 'number') {
    return Math.round(data.price.mrp / 100);
  }
  return undefined;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Discovery backend unavailable.';
}
