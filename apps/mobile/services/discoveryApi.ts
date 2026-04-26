import { httpsCallable } from 'firebase/functions';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import type {
  Category,
  FreshnessStatus,
  Medicine,
  MedicineAvailability,
  ResultFilter,
  ResultGroups,
  StockLabel,
  Store,
  StoreInventoryGroup,
  StoreInventoryItem,
} from '../types/discovery';
import { db, firebaseFunctions } from './firebase';
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
  mockCategories,
  normalize,
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
    const callable = httpsCallable(firebaseFunctions, 'nearbyStores');
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
    const medicineSnap = await getDoc(doc(db, 'medicines', medicineId));
    if (!medicineSnap.exists()) {
      return {
        source: 'backend',
        medicine: null,
        availability: [],
        similar: [],
      };
    }

    const medicine = mapMedicineDoc(medicineSnap.id, medicineSnap.data());
    const availability = await fetchAvailabilityForMedicine(medicine);
    const similar = await fetchSimilarMedicines(medicine);

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
    const storeSnap = await getDoc(doc(db, 'stores', storeId));
    if (!storeSnap.exists()) {
      return {
        source: 'backend',
        store: null,
        groups: [],
      };
    }

    const store = mapStoreDoc(storeSnap.id, storeSnap.data());
    const groups = await fetchInventoryGroupsForStore(store.id, q, filter);

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
    const medicinesSnap = await getDocs(query(collection(db, 'medicines'), limit(100)));
    const medicines = medicinesSnap.docs
      .map((snapshot) => mapMedicineDoc(snapshot.id, snapshot.data()))
      .filter((medicine) => medicine.categoryIds.includes(categoryId))
      .filter((medicine) => filterMedicine(medicine, filter));

    return {
      source: 'backend',
      category: resolveCategory(categoryId),
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

async function fetchAvailabilityForMedicine(medicine: Medicine) {
  const nearby = await getNearbyStoresApi(medicine.id);
  return nearby.stores
    .map((store) => {
      const item = nearby.availableItemsByStore[store.id];
      if (!item?.inStock) {
        return null;
      }

      return {
        medicine,
        store,
        item,
        freshnessStatus: getFreshnessStatus(item.updatedAt),
      };
    })
    .filter((row): row is MedicineAvailability => Boolean(row))
    .sort((a, b) => a.store.distanceKm - b.store.distanceKm);
}

async function fetchSimilarMedicines(medicine: Medicine) {
  const similarIds = medicine.similarMedicineIds.slice(0, 6);
  const rows: Medicine[] = [];

  for (const similarId of similarIds) {
    const snapshot = await getDoc(doc(db, 'medicines', similarId));
    if (snapshot.exists()) {
      rows.push(mapMedicineDoc(snapshot.id, snapshot.data()));
    }
  }

  return rows;
}

async function fetchInventoryGroupsForStore(
  storeId: string,
  q: string,
  filter: ResultFilter,
) {
  const inventorySnap = await getDocs(query(collection(db, 'stores', storeId, 'inventory'), limit(100)));
  const normalizedQuery = normalize(q);
  const rows: StoreInventoryGroup['items'] = [];

  for (const inventoryDoc of inventorySnap.docs) {
    const item = mapInventoryDoc(inventoryDoc, storeId);
    if (!item.inStock) {
      continue;
    }

    const medicineSnap = await getDoc(doc(db, 'medicines', item.medicineId));
    if (!medicineSnap.exists()) {
      continue;
    }

    const medicine = mapMedicineDoc(medicineSnap.id, medicineSnap.data());
    if (!filterMedicine(medicine, filter)) {
      continue;
    }
    if (normalizedQuery && !medicineMatchesQuery(medicine, normalizedQuery)) {
      continue;
    }

    rows.push({
      medicine,
      item,
      freshnessStatus: getFreshnessStatus(item.updatedAt),
    });
  }

  return mockCategories
    .map((category) => ({
      category,
      items: rows.filter(({ medicine }) => medicine.categoryIds.includes(category.id)),
    }))
    .filter((group) => group.items.length > 0);
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

function mapMedicineDoc(id: string, data: DocumentData): Medicine {
  const manufacturerName = String(
    data.manufacturerName ?? data.manufacturer ?? data.brand ?? 'Unknown manufacturer',
  );
  const saltValues = asStringArray(data.salt);
  const compositions =
    Array.isArray(data.compositions) && data.compositions.length > 0
      ? data.compositions.map((composition: DocumentData | string, index: number) =>
          typeof composition === 'string'
            ? {
                id: `${id}_composition_${index}`,
                name: composition,
                saltKey: normalize(composition).replace(/\s+/g, '_'),
                form: data.form ?? 'tablet',
              }
            : {
                id: composition.id ?? `${id}_composition_${index}`,
                name: composition.name ?? composition.salt ?? 'Composition',
                saltKey:
                  composition.saltKey ??
                  normalize(composition.name ?? composition.salt ?? '').replace(/\s+/g, '_'),
                strengthMg: composition.strengthMg,
                form: composition.form ?? data.form ?? 'tablet',
              },
        )
      : saltValues.map((salt, index) => ({
          id: `${id}_composition_${index}`,
          name: salt,
          saltKey: normalize(salt).replace(/\s+/g, '_'),
          form: data.form ?? 'tablet',
        }));
  const therapeuticCategory = normalize(data.therapeuticCategory);
  const categoryIds = asStringArray(data.categoryIds);

  return {
    id,
    name: data.name ?? data.brand ?? 'Unnamed medicine',
    nameLocalised: data.nameLocalised,
    aliases: asStringArray(data.aliases),
    hindiAliases: asStringArray(data.hindiAliases),
    manufacturer: {
      id: normalize(manufacturerName).replace(/\s+/g, '_') || 'unknown',
      name: manufacturerName,
    },
    compositions,
    form: data.form ?? 'tablet',
    packSize: data.packSize ?? '',
    imageUrl: data.imageUrl ?? '',
    requiresPrescription: Boolean(data.requiresPrescription),
    categoryIds: categoryIds.length > 0 ? categoryIds : [therapeuticCategory].filter(Boolean),
    searchTokens: asStringArray(data.searchTokens),
    similarMedicineIds: asStringArray(data.similarMedicineIds),
    variantOfMedicineId: data.variantOfMedicineId,
    description: data.description,
  };
}

function mapStoreDoc(id: string, data: DocumentData): Store {
  const location = data.location ?? {};
  const address = data.address ?? data;
  const updatedAt = timestampToMillis(data.inventoryUpdatedAt ?? data.freshnessUpdatedAt ?? data.updatedAt);

  return {
    id,
    name: data.name ?? data.storeName ?? 'Unnamed pharmacy',
    ownerName: data.ownerName,
    verified: Boolean(data.isVerified ?? data.verified ?? data.verification?.status === 'approved'),
    licenseNumber: data.licenseNumber ?? data.license?.number,
    licenseAuthority: data.licenseAuthority ?? data.license?.issuingAuthority,
    address: {
      line1: address.line1 ?? address.addressLine1 ?? address.address ?? '',
      line2: address.line2 ?? address.area ?? '',
      city: address.city ?? '',
      state: address.state ?? '',
      pincode: address.pincode ?? address.pinCode ?? '',
    },
    location: {
      lat: Number(location.lat ?? data.lat ?? 0),
      lng: Number(location.lng ?? data.lng ?? 0),
      geohash: location.geohash ?? data.geohash ?? '',
    },
    contact: {
      publicPhoneE164:
        data.contact?.publicPhoneE164 ?? data.publicPhoneE164 ?? data.publicPhone ?? data.phone ?? '',
      whatsapp: data.contact?.whatsapp ?? data.whatsapp,
    },
    hours: data.hours ?? {},
    distanceKm: Number(data.distanceKm ?? 0),
    isOpenNow: Boolean(data.isOpenNow ?? data.isOpen ?? true),
    closesAtLabel: data.closesAtLabel ?? data.openStatusLabel,
    freshnessLabel: data.freshnessLabel ?? formatFreshness(updatedAt),
    freshnessUpdatedAt: updatedAt,
  };
}

function mapInventoryDoc(
  snapshot: QueryDocumentSnapshot<DocumentData>,
  storeId: string,
  fallbackMedicineId?: string,
): StoreInventoryItem {
  return ensureInventoryItem(
    {
      ...snapshot.data(),
      sku: snapshot.id,
    },
    storeId,
    fallbackMedicineId,
  ) as StoreInventoryItem;
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

function filterMedicine(medicine: Medicine, filter: ResultFilter) {
  if (filter === 'rx') {
    return medicine.requiresPrescription;
  }
  if (filter === 'otc') {
    return !medicine.requiresPrescription;
  }
  return true;
}

function medicineMatchesQuery(medicine: Medicine, queryText: string) {
  const haystack = [
    medicine.name,
    medicine.aliases.join(' '),
    medicine.hindiAliases?.join(' ') ?? '',
    medicine.manufacturer.name,
    medicine.compositions.map((composition) => composition.name).join(' '),
    medicine.categoryIds.join(' '),
    medicine.searchTokens.join(' '),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(queryText);
}

function resolveCategory(categoryId: string): Category | null {
  return getCategoryById(categoryId) ?? {
    id: categoryId,
    name: categoryId
      .replace(/^cat_/, '')
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' '),
    iconKey: 'pill',
    order: 999,
  };
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

function formatFreshness(updatedAt: number) {
  const ageMinutes = Math.max(1, Math.round((Date.now() - updatedAt) / 60000));
  if (ageMinutes < 60) {
    return `Inventory updated ${ageMinutes} min ago`;
  }
  const ageHours = Math.round(ageMinutes / 60);
  if (ageHours <= 24) {
    return `Inventory updated ${ageHours} hr ago`;
  }
  return `Inventory updated ${Math.round(ageHours / 24)} days ago`;
}

function timestampToMillis(value: unknown) {
  if (!value) {
    return Date.now();
  }
  if (typeof value === 'object' && value && 'toMillis' in value) {
    const timestampValue = value as { toMillis?: () => number };
    if (typeof timestampValue.toMillis === 'function') {
      return timestampValue.toMillis();
    }
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : Date.now();
  }
  return Date.now();
}

function asStringArray(value: unknown) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  return [String(value).trim()].filter(Boolean);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Discovery backend unavailable.';
}
