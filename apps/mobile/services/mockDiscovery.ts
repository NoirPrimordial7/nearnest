import type {
  AvailabilityStatus,
  DiscoveryMedicine,
  DiscoveryStore,
  MedicineSearchResult,
  StoreAvailabilityResult,
  StoreMedicineAvailability,
} from '../types/discovery';

export const mockMedicines: DiscoveryMedicine[] = [
  {
    id: 'dolo-650',
    name: 'Dolo 650',
    salt: 'Paracetamol',
    form: 'Tablet',
    strength: '650 mg',
    packSize: 'Strip of 15 tablets',
    manufacturer: 'Micro Labs',
    aliases: ['paracetamol', 'acetaminophen', 'fever tablet'],
    requiresPrescription: false,
  },
  {
    id: 'azithral-500',
    name: 'Azithral 500',
    salt: 'Azithromycin',
    form: 'Tablet',
    strength: '500 mg',
    packSize: 'Strip of 3 tablets',
    manufacturer: 'Alembic',
    aliases: ['azithromycin', 'azee', 'antibiotic'],
    requiresPrescription: true,
  },
  {
    id: 'cetirizine-10',
    name: 'Cetirizine 10',
    salt: 'Cetirizine',
    form: 'Tablet',
    strength: '10 mg',
    packSize: 'Strip of 10 tablets',
    manufacturer: 'Generic',
    aliases: ['allergy tablet', 'cetrizine', 'zyrtec'],
    requiresPrescription: false,
  },
  {
    id: 'atorva-10',
    name: 'Atorva 10',
    salt: 'Atorvastatin',
    form: 'Tablet',
    strength: '10 mg',
    packSize: 'Strip of 15 tablets',
    manufacturer: 'Zydus',
    aliases: ['atorvastatin', 'cholesterol medicine'],
    requiresPrescription: true,
  },
  {
    id: 'ors-lemon',
    name: 'ORS Lemon',
    salt: 'Oral rehydration salts',
    form: 'Powder',
    strength: '21.8 g',
    packSize: '1 sachet',
    manufacturer: 'Generic',
    aliases: ['ors', 'rehydration', 'electrolytes'],
    requiresPrescription: false,
  },
];

export const mockStores: DiscoveryStore[] = [
  {
    id: 'greenleaf-pharmacy',
    name: 'Greenleaf Pharmacy',
    address: 'Shop 8, Lakeview Market, Baner Road, Pune',
    locality: 'Baner',
    distanceKm: 0.8,
    isOpen: true,
    closesAt: '10:30 PM',
    phone: '+91 98765 43210',
    coordinates: {
      latitude: 18.559,
      longitude: 73.7868,
    },
    verified: true,
    freshnessLabel: 'Updated 8 min ago',
  },
  {
    id: 'carepoint-medicals',
    name: 'CarePoint Medicals',
    address: 'Ground Floor, Wellness Plaza, Aundh, Pune',
    locality: 'Aundh',
    distanceKm: 1.6,
    isOpen: true,
    closesAt: '11:00 PM',
    phone: '+91 98220 11445',
    coordinates: {
      latitude: 18.5589,
      longitude: 73.8078,
    },
    verified: true,
    freshnessLabel: 'Updated 18 min ago',
  },
  {
    id: 'citymed-plus',
    name: 'CityMed Plus',
    address: 'Opposite Metro Pillar 42, Balewadi High Street, Pune',
    locality: 'Balewadi',
    distanceKm: 2.4,
    isOpen: false,
    closesAt: 'Closed',
    phone: '+91 97654 22331',
    coordinates: {
      latitude: 18.5695,
      longitude: 73.7747,
    },
    verified: true,
    freshnessLabel: 'Updated 42 min ago',
  },
  {
    id: 'wellnest-chemist',
    name: 'Wellnest Chemist',
    address: 'Unit 3, Orchid Arcade, Pashan-Sus Road, Pune',
    locality: 'Pashan',
    distanceKm: 3.1,
    isOpen: true,
    closesAt: '9:45 PM',
    phone: '+91 98909 55661',
    coordinates: {
      latitude: 18.5439,
      longitude: 73.792,
    },
    verified: true,
    freshnessLabel: 'Updated 1 hr ago',
  },
];

export const mockAvailability: StoreMedicineAvailability[] = [
  {
    id: 'greenleaf-dolo',
    storeId: 'greenleaf-pharmacy',
    medicineId: 'dolo-650',
    status: 'available',
    stockLabel: 'Available',
    priceLabel: 'MRP Rs 33',
    updatedLabel: 'Updated 8 min ago',
  },
  {
    id: 'carepoint-dolo',
    storeId: 'carepoint-medicals',
    medicineId: 'dolo-650',
    status: 'low_stock',
    stockLabel: 'Low stock',
    priceLabel: 'MRP Rs 34',
    updatedLabel: 'Updated 18 min ago',
  },
  {
    id: 'citymed-dolo',
    storeId: 'citymed-plus',
    medicineId: 'dolo-650',
    status: 'call_to_confirm',
    stockLabel: 'Call to confirm',
    priceLabel: 'Price on call',
    updatedLabel: 'Updated 42 min ago',
  },
  {
    id: 'greenleaf-azithral',
    storeId: 'greenleaf-pharmacy',
    medicineId: 'azithral-500',
    status: 'low_stock',
    stockLabel: 'Low stock',
    priceLabel: 'MRP Rs 119',
    updatedLabel: 'Updated 8 min ago',
  },
  {
    id: 'wellnest-azithral',
    storeId: 'wellnest-chemist',
    medicineId: 'azithral-500',
    status: 'call_to_confirm',
    stockLabel: 'Call to confirm',
    priceLabel: 'Price on call',
    updatedLabel: 'Updated 1 hr ago',
  },
  {
    id: 'carepoint-cetirizine',
    storeId: 'carepoint-medicals',
    medicineId: 'cetirizine-10',
    status: 'available',
    stockLabel: 'Available',
    priceLabel: 'MRP Rs 21',
    updatedLabel: 'Updated 18 min ago',
  },
  {
    id: 'wellnest-cetirizine',
    storeId: 'wellnest-chemist',
    medicineId: 'cetirizine-10',
    status: 'available',
    stockLabel: 'Available',
    priceLabel: 'MRP Rs 20',
    updatedLabel: 'Updated 1 hr ago',
  },
  {
    id: 'citymed-atorva',
    storeId: 'citymed-plus',
    medicineId: 'atorva-10',
    status: 'available',
    stockLabel: 'Available',
    priceLabel: 'MRP Rs 96',
    updatedLabel: 'Updated 42 min ago',
  },
  {
    id: 'greenleaf-atorva',
    storeId: 'greenleaf-pharmacy',
    medicineId: 'atorva-10',
    status: 'call_to_confirm',
    stockLabel: 'Call to confirm',
    priceLabel: 'Price on call',
    updatedLabel: 'Updated 8 min ago',
  },
  {
    id: 'carepoint-ors',
    storeId: 'carepoint-medicals',
    medicineId: 'ors-lemon',
    status: 'available',
    stockLabel: 'Available',
    priceLabel: 'MRP Rs 22',
    updatedLabel: 'Updated 18 min ago',
  },
  {
    id: 'wellnest-ors',
    storeId: 'wellnest-chemist',
    medicineId: 'ors-lemon',
    status: 'low_stock',
    stockLabel: 'Low stock',
    priceLabel: 'MRP Rs 22',
    updatedLabel: 'Updated 1 hr ago',
  },
];

export const popularMedicineIds = [
  'dolo-650',
  'cetirizine-10',
  'ors-lemon',
  'azithral-500',
];

export const recentMedicineQueries = [
  'Dolo 650',
  'Cetirizine',
  'ORS',
];

const statusRank: Record<AvailabilityStatus, number> = {
  available: 0,
  low_stock: 1,
  call_to_confirm: 2,
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function medicineMatchesQuery(medicine: DiscoveryMedicine, query: string) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return true;
  }

  const searchableText = [
    medicine.name,
    medicine.salt,
    medicine.form,
    medicine.strength,
    medicine.manufacturer,
    ...medicine.aliases,
  ]
    .join(' ')
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

function getStore(storeId: string) {
  return mockStores.find((store) => store.id === storeId);
}

function getMedicineAvailability(medicineId: string): StoreAvailabilityResult[] {
  return mockAvailability
    .filter((availability) => availability.medicineId === medicineId)
    .map((availability) => {
      const store = getStore(availability.storeId);
      return store ? { store, availability } : null;
    })
    .filter((result): result is StoreAvailabilityResult => Boolean(result))
    .sort((a, b) => {
      const statusDelta =
        statusRank[a.availability.status] - statusRank[b.availability.status];

      if (statusDelta !== 0) {
        return statusDelta;
      }

      return a.store.distanceKm - b.store.distanceKm;
    });
}

export function searchMockMedicines(query: string): MedicineSearchResult[] {
  return mockMedicines
    .filter((medicine) => medicineMatchesQuery(medicine, query))
    .map((medicine) => ({
      medicine,
      stores: getMedicineAvailability(medicine.id),
    }))
    .filter((result) => result.stores.length > 0);
}

export function getMockMedicineById(medicineId: string) {
  return mockMedicines.find((medicine) => medicine.id === medicineId) ?? null;
}

export function getMockStoreById(storeId: string) {
  return mockStores.find((store) => store.id === storeId) ?? null;
}

export function getNearbyStoresPreview() {
  return [...mockStores].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 3);
}

export function getPopularMedicines() {
  return popularMedicineIds
    .map((medicineId) => getMockMedicineById(medicineId))
    .filter((medicine): medicine is DiscoveryMedicine => Boolean(medicine));
}

export function getStoreInventory(storeId: string) {
  return mockAvailability
    .filter((availability) => availability.storeId === storeId)
    .map((availability) => {
      const medicine = getMockMedicineById(availability.medicineId);
      return medicine ? { medicine, availability } : null;
    })
    .filter(
      (
        result,
      ): result is {
        medicine: DiscoveryMedicine;
        availability: StoreMedicineAvailability;
      } => Boolean(result),
    )
    .sort((a, b) => a.medicine.name.localeCompare(b.medicine.name));
}

export function getMedicineStoreAvailability(medicineId: string) {
  return getMedicineAvailability(medicineId);
}

export function formatDistance(distanceKm: number) {
  return `${distanceKm.toFixed(1)} km`;
}

export function getStatusLabel(status: AvailabilityStatus) {
  switch (status) {
    case 'available':
      return 'Available';
    case 'low_stock':
      return 'Low stock';
    case 'call_to_confirm':
      return 'Call to confirm';
  }
}

export function getMapsUrl(store: DiscoveryStore) {
  const { latitude, longitude } = store.coordinates;
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export function getPhoneUrl(store: DiscoveryStore) {
  return `tel:${store.phone.replace(/[^\d+]/g, '')}`;
}
