export type LocaleCode = 'en' | 'hi' | 'mr';

export type MedicineForm =
  | 'tablet'
  | 'capsule'
  | 'syrup'
  | 'suspension'
  | 'injection'
  | 'ointment'
  | 'cream'
  | 'drops'
  | 'inhaler'
  | 'powder'
  | 'sachet';

export type Composition = {
  id: string;
  name: string;
  saltKey: string;
  strengthMg?: number;
  form: MedicineForm;
};

export type Manufacturer = {
  id: string;
  name: string;
};

export type Category = {
  id: string;
  name: string;
  iconKey: string;
  order: number;
};

export type Medicine = {
  id: string;
  name: string;
  nameLocalised?: Partial<Record<LocaleCode, string>>;
  aliases: string[];
  hindiAliases?: string[];
  manufacturer: Manufacturer;
  compositions: Composition[];
  form: MedicineForm;
  packSize: string;
  imageUrl: string;
  requiresPrescription: boolean;
  categoryIds: string[];
  searchTokens: string[];
  similarMedicineIds: string[];
  variantOfMedicineId?: string;
  description?: string;
};

export type StoreContact = {
  publicPhoneE164: string;
  whatsapp?: string;
};

export type StoreHours = {
  [day: number]: Array<[string, string]>;
};

export type Store = {
  id: string;
  name: string;
  ownerName?: string;
  verified: boolean;
  licenseNumber?: string;
  licenseAuthority?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  location: {
    lat: number;
    lng: number;
    geohash: string;
  };
  contact: StoreContact;
  hours: StoreHours;
  distanceKm: number;
  isOpenNow: boolean;
  closesAtLabel?: string;
  freshnessLabel: string;
  freshnessUpdatedAt: number;
};

export type StockLabel = 'in_stock' | 'low' | 'out';

export type StoreInventoryItem = {
  storeId: string;
  medicineId: string;
  inStock: boolean;
  stockLabel: StockLabel;
  priceInr?: number;
  updatedAt: number;
};

export type SearchSuggestion = {
  kind: 'medicine' | 'composition' | 'symptom' | 'category';
  id: string;
  display: string;
  hint?: string;
  routeHint:
    | { kind: 'medicine'; medicineId: string }
    | { kind: 'composition'; compositionId: string }
    | { kind: 'symptom'; symptomKey: string }
    | { kind: 'category'; categoryId: string };
};

export type RecentSearch = {
  query: string;
  ts: number;
  resolvedTo?: SearchSuggestion['routeHint'];
};

export type DiscoveryMode = 'medicine' | 'stores';

export type ResultFilter = 'all' | 'otc' | 'rx';

export type FreshnessStatus = 'fresh' | 'stale' | 'very_stale';

export type MedicineAvailability = {
  medicine: Medicine;
  store: Store;
  item: StoreInventoryItem;
  freshnessStatus: FreshnessStatus;
};

export type ResultGroups = {
  query: string;
  framingCopy?: string;
  bestMatch: Medicine | null;
  brandVariants: Medicine[];
  sameComposition: Medicine[];
  similarByCategory: Medicine[];
};

export type StoreInventoryGroup = {
  category: Category;
  items: Array<{
    medicine: Medicine;
    item: StoreInventoryItem;
    freshnessStatus: FreshnessStatus;
  }>;
};
