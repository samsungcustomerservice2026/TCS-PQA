/**
 * Samsung Product Knowledge Base — constants & enums.
 * No product rows live here. Catalog is empty until verified import.
 */

/** @typedef {'VERIFIED'|'PARTIAL'|'UNVERIFIED'} DataStatus */
/** @typedef {'VERIFIED'|'HIGH'|'MEDIUM'|'LOW'|'UNKNOWN'} Confidence */
/** @typedef {'YES'|'NO'|'UNKNOWN'} TriState */

export const DATA_STATUS = Object.freeze({
  VERIFIED: 'VERIFIED',
  PARTIAL: 'PARTIAL',
  UNVERIFIED: 'UNVERIFIED',
});

export const CONFIDENCE = Object.freeze({
  VERIFIED: 'VERIFIED',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  UNKNOWN: 'UNKNOWN',
});

export const TRI_STATE = Object.freeze({
  YES: 'YES',
  NO: 'NO',
  UNKNOWN: 'UNKNOWN',
});

/** Product categories (2015-01-01 → 2026-08-10 window). */
export const SAMSUNG_KB_CATEGORIES = Object.freeze({
  MOBILE: 'mobile_phones',
  TABLET: 'galaxy_tablets',
  WATCH: 'gear_galaxy_watch',
  BUDS: 'gear_iconx_galaxy_buds',
  ACCESSORY: 'samsung_mobile_accessories',
  TV: 'samsung_tvs',
  AIR_CONDITIONER: 'air_conditioners',
  REFRIGERATOR: 'refrigerators',
  WASHING_MACHINE: 'washing_machines',
  DRYER: 'dryers',
  COOKING: 'cooking_appliances',
  VACUUM: 'vacuum_cleaners',
  DISHWASHER: 'dishwashers',
  OTHER_HOME: 'other_samsung_home_appliances',
});

export const SAMSUNG_KB_CATEGORY_LABELS = Object.freeze({
  [SAMSUNG_KB_CATEGORIES.MOBILE]: 'Mobile phones',
  [SAMSUNG_KB_CATEGORIES.TABLET]: 'Galaxy tablets',
  [SAMSUNG_KB_CATEGORIES.WATCH]: 'Gear / Galaxy Watch',
  [SAMSUNG_KB_CATEGORIES.BUDS]: 'Gear IconX / Galaxy Buds',
  [SAMSUNG_KB_CATEGORIES.ACCESSORY]: 'Samsung mobile accessories',
  [SAMSUNG_KB_CATEGORIES.TV]: 'Samsung TVs',
  [SAMSUNG_KB_CATEGORIES.AIR_CONDITIONER]: 'Air conditioners',
  [SAMSUNG_KB_CATEGORIES.REFRIGERATOR]: 'Refrigerators',
  [SAMSUNG_KB_CATEGORIES.WASHING_MACHINE]: 'Washing machines',
  [SAMSUNG_KB_CATEGORIES.DRYER]: 'Dryers',
  [SAMSUNG_KB_CATEGORIES.COOKING]: 'Cooking appliances',
  [SAMSUNG_KB_CATEGORIES.VACUUM]: 'Vacuum cleaners',
  [SAMSUNG_KB_CATEGORIES.DISHWASHER]: 'Dishwashers',
  [SAMSUNG_KB_CATEGORIES.OTHER_HOME]: 'Other Samsung home appliances',
});

/** Inclusive catalog window requested by SCORA. */
export const SAMSUNG_KB_DATE_WINDOW = Object.freeze({
  from: '2015-01-01',
  to: '2026-08-10',
});

export const SAMSUNG_KB_FIRESTORE = Object.freeze({
  root: 'samsung_kb',
  products: 'products',
  conflicts: 'conflicts',
  imports: 'imports',
  metaDoc: 'meta',
  metaCatalogId: 'catalog',
});

/** Catalog is empty until a verified import lands. */
export const SAMSUNG_KB_PRODUCTION_READY = false;

export const SAMSUNG_KB_UNAVAILABLE_REPLY = Object.freeze({
  en: 'These product data are currently unavailable. Stay tuned for new updates.',
  ar: 'بيانات المنتج دي غير متاحة حالياً. خليك متابع للتحديثات الجديدة.',
});
