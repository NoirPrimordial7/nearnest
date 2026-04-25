export type AvailabilityStatus =
  | 'available'
  | 'low_stock'
  | 'call_to_confirm';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type DiscoveryMedicine = {
  id: string;
  name: string;
  salt: string;
  form: string;
  strength: string;
  packSize: string;
  manufacturer: string;
  aliases: string[];
  requiresPrescription: boolean;
};

export type DiscoveryStore = {
  id: string;
  name: string;
  address: string;
  locality: string;
  distanceKm: number;
  isOpen: boolean;
  closesAt: string;
  phone: string;
  coordinates: Coordinates;
  verified: boolean;
  freshnessLabel: string;
};

export type StoreMedicineAvailability = {
  id: string;
  storeId: string;
  medicineId: string;
  status: AvailabilityStatus;
  stockLabel: string;
  priceLabel: string;
  updatedLabel: string;
};

export type StoreAvailabilityResult = {
  store: DiscoveryStore;
  availability: StoreMedicineAvailability;
};

export type MedicineSearchResult = {
  medicine: DiscoveryMedicine;
  stores: StoreAvailabilityResult[];
};
