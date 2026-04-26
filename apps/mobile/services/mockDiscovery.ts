import type {
  Category,
  Composition,
  FreshnessStatus,
  Manufacturer,
  Medicine,
  MedicineAvailability,
  RecentSearch,
  ResultFilter,
  ResultGroups,
  SearchSuggestion,
  Store,
  StoreHours,
  StoreInventoryGroup,
  StoreInventoryItem,
  StockLabel,
} from '../types/discovery';

const NOW = Date.now();
const minutesAgo = (minutes: number) => NOW - minutes * 60 * 1000;
const hoursAgo = (hours: number) => NOW - hours * 60 * 60 * 1000;

export const mockManufacturers: Manufacturer[] = [
  { id: 'mfr_micro_labs', name: 'Micro Labs' },
  { id: 'mfr_gsk', name: 'GSK Consumer' },
  { id: 'mfr_cipla', name: 'Cipla' },
  { id: 'mfr_sun_pharma', name: 'Sun Pharma' },
  { id: 'mfr_zydus', name: 'Zydus' },
  { id: 'mfr_abbott', name: 'Abbott' },
];

export const mockCompositions: Composition[] = [
  {
    id: 'comp_paracetamol_500',
    name: 'Paracetamol 500 mg',
    saltKey: 'paracetamol',
    strengthMg: 500,
    form: 'tablet',
  },
  {
    id: 'comp_paracetamol_650',
    name: 'Paracetamol 650 mg',
    saltKey: 'paracetamol',
    strengthMg: 650,
    form: 'tablet',
  },
  {
    id: 'comp_ibuprofen_400',
    name: 'Ibuprofen 400 mg',
    saltKey: 'ibuprofen',
    strengthMg: 400,
    form: 'tablet',
  },
  {
    id: 'comp_diclofenac_topical',
    name: 'Diclofenac topical',
    saltKey: 'diclofenac',
    form: 'ointment',
  },
  {
    id: 'comp_cetirizine_10',
    name: 'Cetirizine 10 mg',
    saltKey: 'cetirizine',
    strengthMg: 10,
    form: 'tablet',
  },
  {
    id: 'comp_levocetirizine_5',
    name: 'Levocetirizine 5 mg',
    saltKey: 'levocetirizine',
    strengthMg: 5,
    form: 'tablet',
  },
  {
    id: 'comp_dextromethorphan_syrup',
    name: 'Dextromethorphan syrup',
    saltKey: 'dextromethorphan',
    form: 'syrup',
  },
  {
    id: 'comp_pantoprazole_40',
    name: 'Pantoprazole 40 mg',
    saltKey: 'pantoprazole',
    strengthMg: 40,
    form: 'tablet',
  },
  {
    id: 'comp_antacid_suspension',
    name: 'Antacid suspension',
    saltKey: 'antacid',
    form: 'suspension',
  },
  {
    id: 'comp_ors',
    name: 'Oral rehydration salts',
    saltKey: 'ors',
    form: 'sachet',
  },
  {
    id: 'comp_loperamide',
    name: 'Loperamide 2 mg',
    saltKey: 'loperamide',
    strengthMg: 2,
    form: 'capsule',
  },
  {
    id: 'comp_azithromycin_500',
    name: 'Azithromycin 500 mg',
    saltKey: 'azithromycin',
    strengthMg: 500,
    form: 'tablet',
  },
  {
    id: 'comp_atorvastatin_10',
    name: 'Atorvastatin 10 mg',
    saltKey: 'atorvastatin',
    strengthMg: 10,
    form: 'tablet',
  },
  {
    id: 'comp_metformin_500',
    name: 'Metformin 500 mg',
    saltKey: 'metformin',
    strengthMg: 500,
    form: 'tablet',
  },
  {
    id: 'comp_telmisartan_40',
    name: 'Telmisartan 40 mg',
    saltKey: 'telmisartan',
    strengthMg: 40,
    form: 'tablet',
  },
  {
    id: 'comp_povidone_iodine',
    name: 'Povidone iodine',
    saltKey: 'povidone_iodine',
    form: 'ointment',
  },
  {
    id: 'comp_vitamin_c',
    name: 'Vitamin C 500 mg',
    saltKey: 'vitamin_c',
    strengthMg: 500,
    form: 'tablet',
  },
];

export const mockCategories: Category[] = [
  { id: 'cat_pain_relief', name: 'Pain Relief', iconKey: 'pill', order: 1 },
  { id: 'cat_cold_cough', name: 'Cold & Cough', iconKey: 'thermometer', order: 2 },
  { id: 'cat_digestion', name: 'Digestion', iconKey: 'activity', order: 3 },
  { id: 'cat_allergy', name: 'Allergy', iconKey: 'shield', order: 4 },
  { id: 'cat_first_aid', name: 'First Aid', iconKey: 'cross', order: 5 },
  { id: 'cat_diabetes', name: 'Diabetes Care', iconKey: 'drop', order: 6 },
  { id: 'cat_heart', name: 'Heart Care', iconKey: 'heart', order: 7 },
  { id: 'cat_vitamins', name: 'Vitamins', iconKey: 'spark', order: 8 },
];

const mfr = (id: string) => {
  const manufacturer = mockManufacturers.find((candidate) => candidate.id === id);
  if (!manufacturer) {
    throw new Error(`Unknown manufacturer: ${id}`);
  }
  return manufacturer;
};

const comp = (id: string) => {
  const composition = mockCompositions.find((candidate) => candidate.id === id);
  if (!composition) {
    throw new Error(`Unknown composition: ${id}`);
  }
  return composition;
};

const tokens = (...values: Array<string | string[] | undefined>) =>
  values
    .flatMap((value) => (Array.isArray(value) ? value : value ? [value] : []))
    .join(' ')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((value) => value.length >= 2);

function medicine(
  base: Omit<Medicine, 'manufacturer' | 'compositions' | 'searchTokens'> & {
    manufacturerId: string;
    compositionIds: string[];
  },
): Medicine {
  const compositions = base.compositionIds.map(comp);
  const manufacturer = mfr(base.manufacturerId);
  const searchTokens = Array.from(
    new Set(
      tokens(
        base.name,
        base.aliases,
        base.hindiAliases,
        manufacturer.name,
        compositions.map((composition) => composition.name),
      ),
    ),
  );

  return {
    ...base,
    manufacturer,
    compositions,
    searchTokens,
  };
}

export const mockMedicines: Medicine[] = [
  medicine({
    id: 'med_crocin_advance',
    name: 'Crocin Advance',
    aliases: ['Crocin', 'Crocin 500', 'paracetamol'],
    hindiAliases: ['bukhar'],
    manufacturerId: 'mfr_gsk',
    compositionIds: ['comp_paracetamol_500'],
    form: 'tablet',
    packSize: '15 tablets',
    imageUrl: 'mock://medicine/crocin-advance',
    requiresPrescription: false,
    categoryIds: ['cat_pain_relief'],
    similarMedicineIds: ['med_calpol_500', 'med_dolo_650', 'med_crocin_650'],
    description: 'A common over-the-counter paracetamol medicine.',
  }),
  medicine({
    id: 'med_crocin_650',
    name: 'Crocin 650',
    aliases: ['Crocin 650', 'paracetamol 650'],
    manufacturerId: 'mfr_gsk',
    compositionIds: ['comp_paracetamol_650'],
    form: 'tablet',
    packSize: '15 tablets',
    imageUrl: 'mock://medicine/crocin-650',
    requiresPrescription: false,
    categoryIds: ['cat_pain_relief'],
    similarMedicineIds: ['med_dolo_650', 'med_crocin_advance', 'med_calpol_500'],
    variantOfMedicineId: 'med_crocin_advance',
    description: 'A paracetamol strength variant from the Crocin range.',
  }),
  medicine({
    id: 'med_dolo_650',
    name: 'Dolo 650',
    aliases: ['Dolo', 'Dolo 650', 'paracetamol 650', 'fever'],
    hindiAliases: ['bukhar'],
    manufacturerId: 'mfr_micro_labs',
    compositionIds: ['comp_paracetamol_650'],
    form: 'tablet',
    packSize: '15 tablets',
    imageUrl: 'mock://medicine/dolo-650',
    requiresPrescription: false,
    categoryIds: ['cat_pain_relief'],
    similarMedicineIds: ['med_crocin_650', 'med_crocin_advance', 'med_calpol_500'],
    description: 'A commonly stocked paracetamol tablet.',
  }),
  medicine({
    id: 'med_calpol_500',
    name: 'Calpol 500',
    aliases: ['Calpol', 'paracetamol 500'],
    manufacturerId: 'mfr_gsk',
    compositionIds: ['comp_paracetamol_500'],
    form: 'tablet',
    packSize: '15 tablets',
    imageUrl: 'mock://medicine/calpol-500',
    requiresPrescription: false,
    categoryIds: ['cat_pain_relief'],
    similarMedicineIds: ['med_crocin_advance', 'med_dolo_650', 'med_crocin_650'],
    description: 'A paracetamol 500 mg tablet from the Calpol range.',
  }),
  medicine({
    id: 'med_brufen_400',
    name: 'Brufen 400',
    aliases: ['Brufen', 'ibuprofen', 'body pain', 'headache'],
    manufacturerId: 'mfr_abbott',
    compositionIds: ['comp_ibuprofen_400'],
    form: 'tablet',
    packSize: '15 tablets',
    imageUrl: 'mock://medicine/brufen-400',
    requiresPrescription: false,
    categoryIds: ['cat_pain_relief'],
    similarMedicineIds: ['med_diclogel', 'med_crocin_advance', 'med_dolo_650'],
    description: 'An ibuprofen medicine commonly searched in pain relief.',
  }),
  medicine({
    id: 'med_diclogel',
    name: 'DicloGel',
    aliases: ['diclofenac gel', 'body pain', 'dard'],
    hindiAliases: ['dard'],
    manufacturerId: 'mfr_sun_pharma',
    compositionIds: ['comp_diclofenac_topical'],
    form: 'ointment',
    packSize: '30 g tube',
    imageUrl: 'mock://medicine/diclogel',
    requiresPrescription: false,
    categoryIds: ['cat_pain_relief', 'cat_first_aid'],
    similarMedicineIds: ['med_brufen_400', 'med_betadine_ointment'],
    description: 'A topical diclofenac product stocked in pain relief.',
  }),
  medicine({
    id: 'med_cetzine_10',
    name: 'Cetzine 10',
    aliases: ['cetirizine', 'allergy', 'cold'],
    manufacturerId: 'mfr_gsk',
    compositionIds: ['comp_cetirizine_10'],
    form: 'tablet',
    packSize: '10 tablets',
    imageUrl: 'mock://medicine/cetzine-10',
    requiresPrescription: false,
    categoryIds: ['cat_allergy', 'cat_cold_cough'],
    similarMedicineIds: ['med_levocet_5', 'med_benadryl_dry_cough'],
    description: 'A cetirizine tablet commonly stocked for allergy searches.',
  }),
  medicine({
    id: 'med_levocet_5',
    name: 'Levocet 5',
    aliases: ['levocetirizine', 'allergy', 'cold'],
    manufacturerId: 'mfr_cipla',
    compositionIds: ['comp_levocetirizine_5'],
    form: 'tablet',
    packSize: '10 tablets',
    imageUrl: 'mock://medicine/levocet-5',
    requiresPrescription: false,
    categoryIds: ['cat_allergy', 'cat_cold_cough'],
    similarMedicineIds: ['med_cetzine_10', 'med_benadryl_dry_cough'],
    description: 'A levocetirizine tablet often searched with allergy terms.',
  }),
  medicine({
    id: 'med_benadryl_dry_cough',
    name: 'Benadryl Dry Cough',
    aliases: ['benadryl', 'dextromethorphan', 'cough syrup'],
    manufacturerId: 'mfr_gsk',
    compositionIds: ['comp_dextromethorphan_syrup'],
    form: 'syrup',
    packSize: '100 ml bottle',
    imageUrl: 'mock://medicine/benadryl-dry-cough',
    requiresPrescription: false,
    categoryIds: ['cat_cold_cough'],
    similarMedicineIds: ['med_cetzine_10', 'med_levocet_5'],
    description: 'A cough syrup listed for pharmacy availability search.',
  }),
  medicine({
    id: 'med_pantocid_40',
    name: 'Pantocid 40',
    aliases: ['pantoprazole', 'acidity', 'panto'],
    manufacturerId: 'mfr_sun_pharma',
    compositionIds: ['comp_pantoprazole_40'],
    form: 'tablet',
    packSize: '15 tablets',
    imageUrl: 'mock://medicine/pantocid-40',
    requiresPrescription: false,
    categoryIds: ['cat_digestion'],
    similarMedicineIds: ['med_gelusil_suspension', 'med_loperamide_2'],
    description: 'A pantoprazole tablet used in pharmacy inventory search.',
  }),
  medicine({
    id: 'med_gelusil_suspension',
    name: 'Gelusil Suspension',
    aliases: ['gelusil', 'antacid', 'acidity'],
    manufacturerId: 'mfr_abbott',
    compositionIds: ['comp_antacid_suspension'],
    form: 'suspension',
    packSize: '200 ml bottle',
    imageUrl: 'mock://medicine/gelusil-suspension',
    requiresPrescription: false,
    categoryIds: ['cat_digestion'],
    similarMedicineIds: ['med_pantocid_40', 'med_electral_ors'],
    description: 'An antacid suspension listed for nearby-store discovery.',
  }),
  medicine({
    id: 'med_electral_ors',
    name: 'Electral ORS',
    aliases: ['ORS', 'oral rehydration salts', 'loose motion', 'diarrhea'],
    manufacturerId: 'mfr_abbott',
    compositionIds: ['comp_ors'],
    form: 'sachet',
    packSize: '21.8 g sachet',
    imageUrl: 'mock://medicine/electral-ors',
    requiresPrescription: false,
    categoryIds: ['cat_digestion', 'cat_first_aid'],
    similarMedicineIds: ['med_gelusil_suspension', 'med_loperamide_2'],
    description: 'An oral rehydration salts sachet stocked by many pharmacies.',
  }),
  medicine({
    id: 'med_loperamide_2',
    name: 'Imodium 2',
    aliases: ['loperamide', 'loose motion', 'diarrhea'],
    manufacturerId: 'mfr_gsk',
    compositionIds: ['comp_loperamide'],
    form: 'capsule',
    packSize: '4 capsules',
    imageUrl: 'mock://medicine/imodium-2',
    requiresPrescription: false,
    categoryIds: ['cat_digestion'],
    similarMedicineIds: ['med_electral_ors', 'med_gelusil_suspension'],
    description: 'A loperamide capsule listed for availability lookup.',
  }),
  medicine({
    id: 'med_vitamin_c',
    name: 'Vitamin C Chewable',
    aliases: ['vitamin c', 'immunity', 'supplement'],
    manufacturerId: 'mfr_zydus',
    compositionIds: ['comp_vitamin_c'],
    form: 'tablet',
    packSize: '30 tablets',
    imageUrl: 'mock://medicine/vitamin-c-chewable',
    requiresPrescription: false,
    categoryIds: ['cat_vitamins'],
    similarMedicineIds: ['med_electral_ors', 'med_betadine_ointment'],
    description: 'A vitamin supplement shown as a nearby-stock item.',
  }),
  medicine({
    id: 'med_betadine_ointment',
    name: 'Betadine Ointment',
    aliases: ['betadine', 'povidone iodine', 'first aid'],
    manufacturerId: 'mfr_abbott',
    compositionIds: ['comp_povidone_iodine'],
    form: 'ointment',
    packSize: '25 g tube',
    imageUrl: 'mock://medicine/betadine-ointment',
    requiresPrescription: false,
    categoryIds: ['cat_first_aid'],
    similarMedicineIds: ['med_diclogel', 'med_vitamin_c'],
    description: 'A first-aid ointment shown for store inventory discovery.',
  }),
  medicine({
    id: 'med_azithral_500',
    name: 'Azithral 500',
    aliases: ['azithral', 'azithromycin 500', 'azith 500'],
    manufacturerId: 'mfr_abbott',
    compositionIds: ['comp_azithromycin_500'],
    form: 'tablet',
    packSize: '3 tablets',
    imageUrl: 'mock://medicine/azithral-500',
    requiresPrescription: true,
    categoryIds: ['cat_cold_cough'],
    similarMedicineIds: ['med_azee_500', 'med_cetzine_10'],
    description: 'An azithromycin tablet listed for prescription-required discovery.',
  }),
  medicine({
    id: 'med_azee_500',
    name: 'Azee 500',
    aliases: ['azee', 'azithromycin 500', 'azith 500'],
    manufacturerId: 'mfr_cipla',
    compositionIds: ['comp_azithromycin_500'],
    form: 'tablet',
    packSize: '3 tablets',
    imageUrl: 'mock://medicine/azee-500',
    requiresPrescription: true,
    categoryIds: ['cat_cold_cough'],
    similarMedicineIds: ['med_azithral_500', 'med_cetzine_10'],
    description: 'An azithromycin brand option shown with Rx status.',
  }),
  medicine({
    id: 'med_atorva_10',
    name: 'Atorva 10',
    aliases: ['atorva', 'atorvastatin', 'cholesterol'],
    manufacturerId: 'mfr_zydus',
    compositionIds: ['comp_atorvastatin_10'],
    form: 'tablet',
    packSize: '15 tablets',
    imageUrl: 'mock://medicine/atorva-10',
    requiresPrescription: true,
    categoryIds: ['cat_heart'],
    similarMedicineIds: ['med_telma_40', 'med_glycomet_500'],
    description: 'An atorvastatin tablet shown as a prescription-required listing.',
  }),
  medicine({
    id: 'med_glycomet_500',
    name: 'Glycomet 500',
    aliases: ['glycomet', 'metformin', 'diabetes'],
    manufacturerId: 'mfr_zydus',
    compositionIds: ['comp_metformin_500'],
    form: 'tablet',
    packSize: '20 tablets',
    imageUrl: 'mock://medicine/glycomet-500',
    requiresPrescription: true,
    categoryIds: ['cat_diabetes'],
    similarMedicineIds: ['med_telma_40', 'med_atorva_10'],
    description: 'A metformin tablet shown with prescription-required status.',
  }),
  medicine({
    id: 'med_telma_40',
    name: 'Telma 40',
    aliases: ['telma', 'telmisartan', 'bp medicine'],
    manufacturerId: 'mfr_sun_pharma',
    compositionIds: ['comp_telmisartan_40'],
    form: 'tablet',
    packSize: '30 tablets',
    imageUrl: 'mock://medicine/telma-40',
    requiresPrescription: true,
    categoryIds: ['cat_heart'],
    similarMedicineIds: ['med_atorva_10', 'med_glycomet_500'],
    description: 'A telmisartan tablet shown for prescription-required discovery.',
  }),
];

const everydayHours: StoreHours = {
  0: [['09:00', '22:00']],
  1: [['08:30', '22:30']],
  2: [['08:30', '22:30']],
  3: [['08:30', '22:30']],
  4: [['08:30', '22:30']],
  5: [['08:30', '22:30']],
  6: [['09:00', '22:00']],
};

export const mockStores: Store[] = [
  {
    id: 'store_greenleaf',
    name: 'Greenleaf Pharmacy',
    verified: true,
    licenseNumber: 'MH-PUNE-1287/2024',
    licenseAuthority: 'Maharashtra Food and Drug Administration',
    address: {
      line1: 'Shop 8, Lakeview Market, Baner Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411045',
    },
    location: { lat: 18.559, lng: 73.7868, geohash: 'te7u2h3' },
    contact: { publicPhoneE164: '+919876543210', whatsapp: '+919876543210' },
    hours: everydayHours,
    distanceKm: 0.8,
    isOpenNow: true,
    closesAtLabel: 'Open until 10:30 PM',
    freshnessLabel: 'Inventory updated 8 min ago',
    freshnessUpdatedAt: minutesAgo(8),
  },
  {
    id: 'store_carepoint',
    name: 'CarePoint Medicals',
    verified: true,
    licenseNumber: 'MH-PUNE-2041/2024',
    licenseAuthority: 'Maharashtra Food and Drug Administration',
    address: {
      line1: 'Ground Floor, Wellness Plaza',
      line2: 'Aundh',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411007',
    },
    location: { lat: 18.5589, lng: 73.8078, geohash: 'te7u2jh' },
    contact: { publicPhoneE164: '+919822011445' },
    hours: everydayHours,
    distanceKm: 1.6,
    isOpenNow: true,
    closesAtLabel: 'Open until 11:00 PM',
    freshnessLabel: 'Inventory updated 18 min ago',
    freshnessUpdatedAt: minutesAgo(18),
  },
  {
    id: 'store_citymed',
    name: 'CityMed Plus',
    verified: true,
    licenseNumber: 'MH-PUNE-3388/2024',
    licenseAuthority: 'Maharashtra Food and Drug Administration',
    address: {
      line1: 'Opposite Metro Pillar 42',
      line2: 'Balewadi High Street',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411045',
    },
    location: { lat: 18.5695, lng: 73.7747, geohash: 'te7u28p' },
    contact: { publicPhoneE164: '+919765422331' },
    hours: everydayHours,
    distanceKm: 2.4,
    isOpenNow: false,
    closesAtLabel: 'Closed now',
    freshnessLabel: 'Inventory updated 42 min ago',
    freshnessUpdatedAt: minutesAgo(42),
  },
  {
    id: 'store_wellnest',
    name: 'Wellnest Chemist',
    verified: true,
    licenseNumber: 'MH-PUNE-4410/2024',
    licenseAuthority: 'Maharashtra Food and Drug Administration',
    address: {
      line1: 'Unit 3, Orchid Arcade',
      line2: 'Pashan-Sus Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411021',
    },
    location: { lat: 18.5439, lng: 73.792, geohash: 'te7u20q' },
    contact: { publicPhoneE164: '+919890955661' },
    hours: everydayHours,
    distanceKm: 3.1,
    isOpenNow: true,
    closesAtLabel: 'Open until 9:45 PM',
    freshnessLabel: 'Inventory updated 1 hr ago',
    freshnessUpdatedAt: hoursAgo(1),
  },
  {
    id: 'store_sunrise',
    name: 'Sunrise Pharmacy',
    verified: true,
    licenseNumber: 'MH-PUNE-5122/2024',
    licenseAuthority: 'Maharashtra Food and Drug Administration',
    address: {
      line1: 'Shop 2, Sai Chowk',
      line2: 'Pimple Saudagar',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411027',
    },
    location: { lat: 18.597, lng: 73.795, geohash: 'te7u8b2' },
    contact: { publicPhoneE164: '+919822233410' },
    hours: everydayHours,
    distanceKm: 4.0,
    isOpenNow: true,
    closesAtLabel: 'Open until 10:00 PM',
    freshnessLabel: 'Inventory updated 3 hr ago',
    freshnessUpdatedAt: hoursAgo(3),
  },
  {
    id: 'store_familycare',
    name: 'FamilyCare Meds',
    verified: true,
    licenseNumber: 'MH-PUNE-6751/2024',
    licenseAuthority: 'Maharashtra Food and Drug Administration',
    address: {
      line1: 'Kunal Icon Road',
      line2: 'Pimple Saudagar',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411027',
    },
    location: { lat: 18.594, lng: 73.808, geohash: 'te7u8c0' },
    contact: { publicPhoneE164: '+919130145577' },
    hours: everydayHours,
    distanceKm: 4.5,
    isOpenNow: true,
    closesAtLabel: 'Open until 11:30 PM',
    freshnessLabel: 'Inventory updated 9 hr ago',
    freshnessUpdatedAt: hoursAgo(9),
  },
  {
    id: 'store_metro_health',
    name: 'Metro Health Pharmacy',
    verified: true,
    licenseNumber: 'MH-PUNE-7225/2024',
    licenseAuthority: 'Maharashtra Food and Drug Administration',
    address: {
      line1: 'Hinjewadi Phase 1 Main Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411057',
    },
    location: { lat: 18.591, lng: 73.739, geohash: 'te7u0dr' },
    contact: { publicPhoneE164: '+919766112204' },
    hours: everydayHours,
    distanceKm: 5.2,
    isOpenNow: false,
    closesAtLabel: 'Closed now',
    freshnessLabel: 'Inventory updated 26 hr ago',
    freshnessUpdatedAt: hoursAgo(26),
  },
  {
    id: 'store_trustwell',
    name: 'TrustWell Medicals',
    verified: true,
    licenseNumber: 'MH-PUNE-8391/2024',
    licenseAuthority: 'Maharashtra Food and Drug Administration',
    address: {
      line1: 'Opposite Rajiv Gandhi IT Park',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411057',
    },
    location: { lat: 18.586, lng: 73.734, geohash: 'te7u0b9' },
    contact: { publicPhoneE164: '+919560700881' },
    hours: everydayHours,
    distanceKm: 6.1,
    isOpenNow: true,
    closesAtLabel: 'Open until 10:15 PM',
    freshnessLabel: 'Inventory updated 2 days ago',
    freshnessUpdatedAt: hoursAgo(50),
  },
  {
    id: 'store_corner_health',
    name: 'Corner Health Shop',
    verified: false,
    address: {
      line1: 'Near Wakad Bridge',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411057',
    },
    location: { lat: 18.604, lng: 73.767, geohash: 'te7u2wm' },
    contact: { publicPhoneE164: '+919833210004' },
    hours: everydayHours,
    distanceKm: 6.8,
    isOpenNow: true,
    closesAtLabel: 'Open until 9:30 PM',
    freshnessLabel: 'Inventory updated 4 days ago',
    freshnessUpdatedAt: hoursAgo(88),
  },
  {
    id: 'store_quickmeds',
    name: 'QuickMeds Counter',
    verified: false,
    address: {
      line1: 'Shop 19, Old Mumbai Pune Highway',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411033',
    },
    location: { lat: 18.63, lng: 73.79, geohash: 'te7u9m1' },
    contact: { publicPhoneE164: '+919900441188' },
    hours: everydayHours,
    distanceKm: 7.4,
    isOpenNow: false,
    closesAtLabel: 'Closed now',
    freshnessLabel: 'Inventory updated 5 days ago',
    freshnessUpdatedAt: hoursAgo(124),
  },
];

const inventoryMatrix: Record<string, string[]> = {
  store_greenleaf: [
    'med_crocin_advance',
    'med_dolo_650',
    'med_calpol_500',
    'med_cetzine_10',
    'med_pantocid_40',
    'med_electral_ors',
    'med_azithral_500',
    'med_atorva_10',
    'med_vitamin_c',
  ],
  store_carepoint: [
    'med_dolo_650',
    'med_crocin_650',
    'med_brufen_400',
    'med_levocet_5',
    'med_benadryl_dry_cough',
    'med_gelusil_suspension',
    'med_electral_ors',
    'med_glycomet_500',
    'med_betadine_ointment',
  ],
  store_citymed: [
    'med_crocin_advance',
    'med_brufen_400',
    'med_diclogel',
    'med_cetzine_10',
    'med_pantocid_40',
    'med_loperamide_2',
    'med_azee_500',
    'med_telma_40',
    'med_vitamin_c',
  ],
  store_wellnest: [
    'med_dolo_650',
    'med_calpol_500',
    'med_diclogel',
    'med_levocet_5',
    'med_benadryl_dry_cough',
    'med_gelusil_suspension',
    'med_electral_ors',
    'med_azithral_500',
    'med_betadine_ointment',
  ],
  store_sunrise: [
    'med_crocin_650',
    'med_brufen_400',
    'med_cetzine_10',
    'med_pantocid_40',
    'med_loperamide_2',
    'med_atorva_10',
    'med_glycomet_500',
    'med_telma_40',
    'med_vitamin_c',
  ],
  store_familycare: [
    'med_crocin_advance',
    'med_dolo_650',
    'med_diclogel',
    'med_cetzine_10',
    'med_gelusil_suspension',
    'med_electral_ors',
    'med_azee_500',
    'med_glycomet_500',
    'med_betadine_ointment',
  ],
  store_metro_health: [
    'med_dolo_650',
    'med_calpol_500',
    'med_brufen_400',
    'med_levocet_5',
    'med_pantocid_40',
    'med_loperamide_2',
    'med_azithral_500',
    'med_atorva_10',
    'med_vitamin_c',
  ],
  store_trustwell: [
    'med_crocin_650',
    'med_brufen_400',
    'med_diclogel',
    'med_benadryl_dry_cough',
    'med_gelusil_suspension',
    'med_electral_ors',
    'med_azee_500',
    'med_telma_40',
    'med_betadine_ointment',
  ],
  store_corner_health: [
    'med_crocin_advance',
    'med_calpol_500',
    'med_cetzine_10',
    'med_levocet_5',
    'med_pantocid_40',
    'med_electral_ors',
    'med_azithral_500',
    'med_glycomet_500',
    'med_betadine_ointment',
  ],
  store_quickmeds: [
    'med_dolo_650',
    'med_brufen_400',
    'med_diclogel',
    'med_benadryl_dry_cough',
    'med_loperamide_2',
    'med_atorva_10',
    'med_telma_40',
    'med_vitamin_c',
    'med_betadine_ointment',
  ],
};

const stockPattern: StockLabel[] = ['in_stock', 'in_stock', 'low', 'in_stock', 'low', 'out'];
const priceBase = 22;

export const mockInventoryItems: StoreInventoryItem[] = Object.entries(inventoryMatrix).flatMap(
  ([storeId, medicineIds], storeIndex) =>
    medicineIds.map((medicineId, itemIndex) => {
      const patternIndex = (storeIndex + itemIndex) % stockPattern.length;
      const stockLabel = stockPattern[patternIndex];
      const store = mockStores.find((candidate) => candidate.id === storeId);
      const updatedAt =
        store?.freshnessUpdatedAt ?? hoursAgo((storeIndex + 1) * (itemIndex + 1));

      return {
        storeId,
        medicineId,
        inStock: stockLabel !== 'out',
        stockLabel,
        priceInr: stockLabel === 'out' ? undefined : priceBase + ((storeIndex + itemIndex) % 9) * 11,
        updatedAt,
      };
    }),
);

export const mockRecentSearches: RecentSearch[] = [
  { query: 'Dolo 650', ts: minutesAgo(12), resolvedTo: { kind: 'medicine', medicineId: 'med_dolo_650' } },
  { query: 'ORS', ts: hoursAgo(2), resolvedTo: { kind: 'medicine', medicineId: 'med_electral_ors' } },
  { query: 'Cetirizine', ts: hoursAgo(5), resolvedTo: { kind: 'composition', compositionId: 'comp_cetirizine_10' } },
  { query: 'Azith 500', ts: hoursAgo(8), resolvedTo: { kind: 'composition', compositionId: 'comp_azithromycin_500' } },
  { query: 'Fever', ts: hoursAgo(18), resolvedTo: { kind: 'symptom', symptomKey: 'fever' } },
  { query: 'Pantoprazole', ts: hoursAgo(24), resolvedTo: { kind: 'composition', compositionId: 'comp_pantoprazole_40' } },
  { query: 'Betadine', ts: hoursAgo(27), resolvedTo: { kind: 'medicine', medicineId: 'med_betadine_ointment' } },
  { query: 'Pain Relief', ts: hoursAgo(40), resolvedTo: { kind: 'category', categoryId: 'cat_pain_relief' } },
  { query: 'Allergy', ts: hoursAgo(44), resolvedTo: { kind: 'symptom', symptomKey: 'allergy' } },
  { query: 'Vitamin C', ts: hoursAgo(50), resolvedTo: { kind: 'medicine', medicineId: 'med_vitamin_c' } },
];

const symptomMap: Record<
  string,
  {
    display: string;
    compositionIds: string[];
    framingCopy: string;
  }
> = {
  fever: {
    display: 'fever',
    compositionIds: ['comp_paracetamol_500', 'comp_paracetamol_650'],
    framingCopy: 'Searches for fever usually look at:',
  },
  headache: {
    display: 'headache',
    compositionIds: ['comp_paracetamol_500', 'comp_ibuprofen_400'],
    framingCopy: 'Searches for headache usually look at:',
  },
  'body pain': {
    display: 'body pain',
    compositionIds: ['comp_diclofenac_topical', 'comp_ibuprofen_400'],
    framingCopy: 'Searches for body pain usually look at:',
  },
  dard: {
    display: 'body pain',
    compositionIds: ['comp_diclofenac_topical', 'comp_ibuprofen_400'],
    framingCopy: 'Searches for body pain usually look at:',
  },
  cold: {
    display: 'cold and cough',
    compositionIds: ['comp_cetirizine_10', 'comp_levocetirizine_5', 'comp_dextromethorphan_syrup'],
    framingCopy: 'Searches for cold and cough usually look at:',
  },
  cough: {
    display: 'cold and cough',
    compositionIds: ['comp_cetirizine_10', 'comp_levocetirizine_5', 'comp_dextromethorphan_syrup'],
    framingCopy: 'Searches for cold and cough usually look at:',
  },
  acidity: {
    display: 'acidity',
    compositionIds: ['comp_pantoprazole_40', 'comp_antacid_suspension'],
    framingCopy: 'Searches for acidity usually look at:',
  },
  diarrhea: {
    display: 'loose motion',
    compositionIds: ['comp_ors', 'comp_loperamide'],
    framingCopy: 'Searches for loose motion usually look at:',
  },
  'loose motion': {
    display: 'loose motion',
    compositionIds: ['comp_ors', 'comp_loperamide'],
    framingCopy: 'Searches for loose motion usually look at:',
  },
  allergy: {
    display: 'allergy',
    compositionIds: ['comp_cetirizine_10', 'comp_levocetirizine_5'],
    framingCopy: 'Searches for allergy usually look at:',
  },
};

export const mockPopularSuggestions: SearchSuggestion[] = [
  { kind: 'medicine', id: 'sug_crocin', display: 'Crocin Advance', hint: 'Brand', routeHint: { kind: 'medicine', medicineId: 'med_crocin_advance' } },
  { kind: 'medicine', id: 'sug_dolo', display: 'Dolo 650', hint: 'Brand', routeHint: { kind: 'medicine', medicineId: 'med_dolo_650' } },
  { kind: 'composition', id: 'sug_para', display: 'Paracetamol 500 mg', hint: 'Composition', routeHint: { kind: 'composition', compositionId: 'comp_paracetamol_500' } },
  { kind: 'symptom', id: 'sug_fever', display: 'Fever', hint: 'Search routing', routeHint: { kind: 'symptom', symptomKey: 'fever' } },
  { kind: 'symptom', id: 'sug_cold', display: 'Cold and cough', hint: 'Search routing', routeHint: { kind: 'symptom', symptomKey: 'cold' } },
  { kind: 'medicine', id: 'sug_ors', display: 'Electral ORS', hint: 'Brand', routeHint: { kind: 'medicine', medicineId: 'med_electral_ors' } },
  { kind: 'medicine', id: 'sug_cetzine', display: 'Cetzine 10', hint: 'Brand', routeHint: { kind: 'medicine', medicineId: 'med_cetzine_10' } },
  { kind: 'medicine', id: 'sug_azithral', display: 'Azithral 500', hint: 'Rx medicine', routeHint: { kind: 'medicine', medicineId: 'med_azithral_500' } },
  { kind: 'composition', id: 'sug_panto', display: 'Pantoprazole 40 mg', hint: 'Composition', routeHint: { kind: 'composition', compositionId: 'comp_pantoprazole_40' } },
  { kind: 'category', id: 'sug_pain', display: 'Pain Relief', hint: 'Category', routeHint: { kind: 'category', categoryId: 'cat_pain_relief' } },
  { kind: 'category', id: 'sug_diabetes', display: 'Diabetes Care', hint: 'Category', routeHint: { kind: 'category', categoryId: 'cat_diabetes' } },
  { kind: 'category', id: 'sug_first_aid', display: 'First Aid', hint: 'Category', routeHint: { kind: 'category', categoryId: 'cat_first_aid' } },
];

export function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function getCategories() {
  return [...mockCategories].sort((a, b) => a.order - b.order);
}

export function getCategoryById(categoryId: string) {
  return mockCategories.find((category) => category.id === categoryId) ?? null;
}

export function getMedicineById(medicineId: string) {
  return mockMedicines.find((medicine) => medicine.id === medicineId) ?? null;
}

export function getStoreById(storeId: string) {
  return mockStores.find((store) => store.id === storeId) ?? null;
}

export function getStoresByDistance() {
  return [...mockStores].sort((a, b) => a.distanceKm - b.distanceKm);
}

export function getRecentSearches() {
  return [...mockRecentSearches].sort((a, b) => b.ts - a.ts);
}

export function getPopularSuggestions() {
  return mockPopularSuggestions;
}

export function getSuggestions(query: string) {
  const q = normalize(query);

  if (!q) {
    return mockPopularSuggestions;
  }

  const suggestions: SearchSuggestion[] = [];
  const matchingMedicines = mockMedicines
    .filter((medicineItem) => medicineMatchesQuery(medicineItem, q))
    .slice(0, 6)
    .map<SearchSuggestion>((medicineItem) => ({
      kind: 'medicine',
      id: `medicine_${medicineItem.id}`,
      display: medicineItem.name,
      hint: medicineItem.requiresPrescription ? 'Rx medicine' : 'Brand',
      routeHint: { kind: 'medicine', medicineId: medicineItem.id },
    }));

  const matchingCompositions = mockCompositions
    .filter((composition) => normalize(composition.name).includes(q) || composition.saltKey.includes(q))
    .slice(0, 4)
    .map<SearchSuggestion>((composition) => ({
      kind: 'composition',
      id: `composition_${composition.id}`,
      display: composition.name,
      hint: 'Composition',
      routeHint: { kind: 'composition', compositionId: composition.id },
    }));

  const matchingCategories = mockCategories
    .filter((category) => normalize(category.name).includes(q))
    .slice(0, 2)
    .map<SearchSuggestion>((category) => ({
      kind: 'category',
      id: `category_${category.id}`,
      display: category.name,
      hint: 'Category',
      routeHint: { kind: 'category', categoryId: category.id },
    }));

  const symptom = Object.entries(symptomMap).find(([key, value]) => key.includes(q) || normalize(value.display).includes(q));
  if (symptom) {
    suggestions.push({
      kind: 'symptom',
      id: `symptom_${symptom[0]}`,
      display: symptom[1].display,
      hint: 'Search routing',
      routeHint: { kind: 'symptom', symptomKey: symptom[0] },
    });
  }

  return [...suggestions, ...matchingMedicines, ...matchingCompositions, ...matchingCategories].slice(0, 12);
}

export function getResultGroups(query: string, filter: ResultFilter = 'all'): ResultGroups {
  const q = normalize(query);
  const symptom = findSymptom(q);
  const allMatches = symptom
    ? mockMedicines.filter((medicineItem) =>
        medicineItem.compositions.some((composition) =>
          symptom.compositionIds.includes(composition.id),
        ) && !medicineItem.requiresPrescription,
      )
    : mockMedicines.filter((medicineItem) => medicineMatchesQuery(medicineItem, q));

  const matches = applyMedicineFilter(allMatches, filter);
  const bestMatch = matches[0] ?? null;
  const brandVariants = bestMatch
    ? matches.filter(
        (medicineItem) =>
          medicineItem.id !== bestMatch.id &&
          medicineItem.manufacturer.id === bestMatch.manufacturer.id,
      )
    : [];
  const bestCompositionIds = new Set(bestMatch?.compositions.map((composition) => composition.id) ?? []);
  const sameComposition = bestMatch
    ? matches.filter(
        (medicineItem) =>
          medicineItem.id !== bestMatch.id &&
          medicineItem.compositions.some((composition) => bestCompositionIds.has(composition.id)),
      )
    : [];
  const bestCategoryIds = new Set(bestMatch?.categoryIds ?? []);
  const similarByCategory = matches
    .filter(
      (medicineItem) =>
        medicineItem.id !== bestMatch?.id &&
        !brandVariants.some((variant) => variant.id === medicineItem.id) &&
        !sameComposition.some((same) => same.id === medicineItem.id) &&
        medicineItem.categoryIds.some((categoryId) => bestCategoryIds.has(categoryId)),
    )
    .slice(0, 6);

  return {
    query,
    framingCopy: symptom?.framingCopy,
    bestMatch,
    brandVariants,
    sameComposition,
    similarByCategory,
  };
}

export function getAvailabilityForMedicine(medicineId: string): MedicineAvailability[] {
  const medicineItem = getMedicineById(medicineId);
  if (!medicineItem) {
    return [];
  }

  return mockInventoryItems
    .filter((item) => item.medicineId === medicineId && item.inStock)
    .map((item) => {
      const store = getStoreById(item.storeId);
      if (!store) {
        return null;
      }

      return {
        medicine: medicineItem,
        store,
        item,
        freshnessStatus: getFreshnessStatus(item.updatedAt),
      };
    })
    .filter((result): result is MedicineAvailability => Boolean(result))
    .sort((a, b) => {
      const stockDelta = stockRank(a.item.stockLabel) - stockRank(b.item.stockLabel);
      if (stockDelta !== 0) {
        return stockDelta;
      }
      return a.store.distanceKm - b.store.distanceKm;
    });
}

export function getAvailabilityCount(medicineId: string) {
  return getAvailabilityForMedicine(medicineId).length;
}

export function getSimilarMedicines(medicineId: string) {
  const medicineItem = getMedicineById(medicineId);
  if (!medicineItem) {
    return [];
  }

  return medicineItem.similarMedicineIds
    .map(getMedicineById)
    .filter((candidate): candidate is Medicine => Boolean(candidate));
}

export function getMedicinesByCategory(categoryId: string, filter: ResultFilter = 'all') {
  return applyMedicineFilter(
    mockMedicines.filter((medicineItem) => medicineItem.categoryIds.includes(categoryId)),
    filter,
  ).sort((a, b) => a.manufacturer.name.localeCompare(b.manufacturer.name));
}

export function getInventoryForStore(
  storeId: string,
  query = '',
  filter: ResultFilter = 'all',
): StoreInventoryGroup[] {
  const q = normalize(query);
  const items = mockInventoryItems
    .filter((item) => item.storeId === storeId && item.inStock)
    .map((item) => {
      const medicineItem = getMedicineById(item.medicineId);
      if (!medicineItem) {
        return null;
      }

      return {
        medicine: medicineItem,
        item,
        freshnessStatus: getFreshnessStatus(item.updatedAt),
      };
    })
    .filter(
      (
        result,
      ): result is {
        medicine: Medicine;
        item: StoreInventoryItem;
        freshnessStatus: FreshnessStatus;
      } => Boolean(result),
    )
    .filter(({ medicine: medicineItem }) => {
      if (filter === 'rx' && !medicineItem.requiresPrescription) {
        return false;
      }
      if (filter === 'otc' && medicineItem.requiresPrescription) {
        return false;
      }
      return q ? medicineMatchesQuery(medicineItem, q) : true;
    });

  return getCategories()
    .map((category) => ({
      category,
      items: items
        .filter(({ medicine: medicineItem }) => medicineItem.categoryIds.includes(category.id))
        .sort((a, b) => a.medicine.name.localeCompare(b.medicine.name)),
    }))
    .filter((group) => group.items.length > 0);
}

export function getFreshnessStatus(updatedAt: number): FreshnessStatus {
  const ageHours = (NOW - updatedAt) / (60 * 60 * 1000);
  if (ageHours > 72) {
    return 'very_stale';
  }
  if (ageHours > 24) {
    return 'stale';
  }
  return 'fresh';
}

export function hasStaleDataForMedicine(medicineId: string) {
  return getAvailabilityForMedicine(medicineId).some(
    ({ freshnessStatus }) => freshnessStatus !== 'fresh',
  );
}

export function formatFreshness(updatedAt: number) {
  const ageMinutes = Math.max(1, Math.round((NOW - updatedAt) / (60 * 1000)));
  if (ageMinutes < 60) {
    return `updated ${ageMinutes} min ago`;
  }
  const ageHours = Math.round(ageMinutes / 60);
  if (ageHours <= 24) {
    return `updated ${ageHours} hr ago`;
  }
  const ageDays = Math.round(ageHours / 24);
  return `last updated ${ageDays} days ago`;
}

export function formatDistance(distanceKm: number) {
  return `${distanceKm.toFixed(1)} km`;
}

export function formatPrice(item: StoreInventoryItem) {
  return item.priceInr ? `MRP Rs ${item.priceInr}` : 'Price on call';
}

export function formatComposition(medicineItem: Medicine) {
  return medicineItem.compositions.map((composition) => composition.name).join(' + ');
}

export function formatStoreAddress(store: Store) {
  return [store.address.line1, store.address.line2, store.address.city, store.address.state, store.address.pincode]
    .filter(Boolean)
    .join(', ');
}

export function getStockLabel(item: StoreInventoryItem) {
  switch (item.stockLabel) {
    case 'in_stock':
      return 'In stock';
    case 'low':
      return 'Low stock';
    case 'out':
      return 'Call to confirm';
  }
}

export function getMapsUrl(store: Store) {
  return `https://www.google.com/maps/search/?api=1&query=${store.location.lat},${store.location.lng}`;
}

export function getGeoUrl(store: Store) {
  return `geo:${store.location.lat},${store.location.lng}?q=${encodeURIComponent(store.name)}`;
}

export function getPhoneUrl(store: Store) {
  return `tel:${store.contact.publicPhoneE164}`;
}

function applyMedicineFilter(medicines: Medicine[], filter: ResultFilter) {
  if (filter === 'rx') {
    return medicines.filter((medicineItem) => medicineItem.requiresPrescription);
  }
  if (filter === 'otc') {
    return medicines.filter((medicineItem) => !medicineItem.requiresPrescription);
  }
  return medicines;
}

function medicineMatchesQuery(medicineItem: Medicine, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [
    medicineItem.name,
    medicineItem.aliases.join(' '),
    medicineItem.hindiAliases?.join(' ') ?? '',
    medicineItem.manufacturer.name,
    medicineItem.compositions.map((composition) => composition.name).join(' '),
    medicineItem.categoryIds
      .map((categoryId) => getCategoryById(categoryId)?.name ?? '')
      .join(' '),
    medicineItem.searchTokens.join(' '),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

function findSymptom(query: string) {
  if (!query) {
    return null;
  }

  const match = Object.entries(symptomMap).find(([key, value]) => {
    return key === query || key.includes(query) || normalize(value.display).includes(query);
  });

  return match?.[1] ?? null;
}

function stockRank(stockLabel: StockLabel) {
  switch (stockLabel) {
    case 'in_stock':
      return 0;
    case 'low':
      return 1;
    case 'out':
      return 2;
  }
}
