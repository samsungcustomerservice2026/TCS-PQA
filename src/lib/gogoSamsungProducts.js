/**
 * Samsung Galaxy product specs for GoGo.
 * Source of truth for visitors: Samsung product data (samsung.com/eg + SCORA KB).
 * Internal fetch helpers may still use archived URL maps; never expose that name in chat.
 * Firebase path: gogo_assistant/workspace/products/{productId}
 *
 * Template fields (every product doc):
 *   id, name_en, name_ar, brand, series, variant, aliases, seriesKeys,
 *   category, gsmarenaUrl, samsungEgUrl?, specs{}, specs_ar{},
 *   summary_en, summary_ar, source, type, hitCount, updatedAt
 */

export const GOGO_PRODUCT_SOURCE = {
  name: 'Samsung data',
  url: 'https://www.samsung.com/eg/',
  eg_a_series: 'https://www.samsung.com/eg/smartphones/galaxy-a/',
  note_en: 'Specs come from Samsung product data. Do not mention external review sites unless the visitor asks.',
  note_ar: 'المواصفات من بيانات منتجات Samsung. لا تذكر مواقع خارجية إلا لو الزائر سأل.',
};

export const GOGO_PRODUCT_FIREBASE_TEMPLATE = {
  type: 'GOGO_PRODUCT_SPEC',
  brand: 'Samsung',
  source: 'gsmarena',
  fields: [
    'id',
    'name_en',
    'name_ar',
    'brand',
    'series',
    'variant', // base | plus | ultra | fe | fold | flip | a-series
    'aliases',
    'seriesKeys',
    'category',
    'gsmarenaUrl',
    'specs.processor',
    'specs.battery',
    'specs.display',
    'specs.camera',
    'specs_ar',
    'summary_en',
    'summary_ar',
    'hitCount',
    'updatedAt',
  ],
};

/** @typedef {{ id: string, name_en: string, name_ar: string, brand?: string, series: string, variant: string, aliases: string[], seriesKeys: string[], category: string, gsmarenaUrl: string, samsungEgUrl?: string, specs: Record<string, string>, specs_ar?: Record<string, string>, summary_en: string, summary_ar: string }} GoGoProduct */

function product(p) {
  return {
    brand: 'Samsung',
    source: 'gsmarena',
    type: 'GOGO_PRODUCT_SPEC',
    ...p,
  };
}

/** @type {GoGoProduct[]} */
export const GOGO_PRODUCT_SEED = [
  // —— S25 family ——
  product({
    id: 'galaxy_s25',
    name_en: 'Galaxy S25',
    name_ar: 'Galaxy S25',
    series: 'S25',
    variant: 'base',
    aliases: ['s25', 'galaxy s25', 'normal s25', 'base s25', 's 25', 'اس 25'],
    seriesKeys: ['s25'],
    category: 'flagship',
    gsmarenaUrl: 'https://www.gsmarena.com/samsung_galaxy_s25-13610.php',
    specs: {
      processor: 'Qualcomm Snapdragon 8 Elite (SM8750, 3 nm) — for Galaxy',
      battery: 'Li-Ion 4,000 mAh — 25W wired / 15W wireless',
      display: '6.2-inch Dynamic AMOLED 2X',
      camera: '50 MP main camera system',
    },
    specs_ar: {
      processor: 'Qualcomm Snapdragon 8 Elite (SM8750, 3 nm) — for Galaxy',
      battery: 'Li-Ion 4,000 mAh — شحن سلكي 25W / لاسلكي 15W',
      display: 'شاشة 6.2 إنش Dynamic AMOLED 2X',
      camera: 'كاميرا رئيسية 50 ميجابكسل',
    },
    summary_en: 'Galaxy S25: Snapdragon 8 Elite (for Galaxy), 4,000 mAh battery, 6.2" display.',
    summary_ar: 'Galaxy S25: معالج Snapdragon 8 Elite (for Galaxy)، بطارية 4,000 mAh، شاشة 6.2 إنش.',
  }),
  product({
    id: 'galaxy_s25_plus',
    name_en: 'Galaxy S25+',
    name_ar: 'Galaxy S25+',
    series: 'S25',
    variant: 'plus',
    aliases: ['s25+', 's25 plus', 's25plus', 'galaxy s25+', 'اس 25 بلس'],
    seriesKeys: ['s25plus'],
    category: 'flagship',
    gsmarenaUrl: 'https://www.gsmarena.com/samsung_galaxy_s25+-13609.php',
    specs: {
      processor: 'Qualcomm Snapdragon 8 Elite (3 nm) — for Galaxy',
      battery: 'Li-Ion 4,900 mAh — 45W wired / 15W wireless',
      display: '6.7-inch Dynamic AMOLED 2X',
      camera: '50 MP main camera system',
    },
    specs_ar: {
      processor: 'Qualcomm Snapdragon 8 Elite (3 nm) — for Galaxy',
      battery: 'Li-Ion 4,900 mAh — شحن سلكي 45W / لاسلكي 15W',
      display: 'شاشة 6.7 إنش Dynamic AMOLED 2X',
      camera: 'كاميرا رئيسية 50 ميجابكسل',
    },
    summary_en: 'Galaxy S25+: Snapdragon 8 Elite (for Galaxy), 4,900 mAh battery, 6.7" display.',
    summary_ar: 'Galaxy S25+: Snapdragon 8 Elite (for Galaxy)، بطارية 4,900 mAh، شاشة 6.7 إنش.',
  }),
  product({
    id: 'galaxy_s25_ultra',
    name_en: 'Galaxy S25 Ultra',
    name_ar: 'Galaxy S25 Ultra',
    series: 'S25',
    variant: 'ultra',
    aliases: ['s25 ultra', 's25ultra', 'galaxy s25 ultra', 'اس 25 الترا'],
    seriesKeys: ['s25ultra'],
    category: 'flagship',
    gsmarenaUrl: 'https://www.gsmarena.com/samsung_galaxy_s25_ultra-13322.php',
    specs: {
      processor: 'Qualcomm Snapdragon 8 Elite (SM8750-AC, 3 nm) — for Galaxy',
      battery: 'Li-Ion 5,000 mAh — 45W wired / 15W wireless',
      display: '6.8-inch Dynamic AMOLED 2X Ultra display',
      camera: '200 MP Ultra camera system',
    },
    specs_ar: {
      processor: 'Qualcomm Snapdragon 8 Elite (SM8750-AC, 3 nm) — for Galaxy',
      battery: 'Li-Ion 5,000 mAh — شحن سلكي 45W / لاسلكي 15W',
      display: 'شاشة Ultra 6.8 إنش Dynamic AMOLED 2X',
      camera: 'نظام كاميرا Ultra 200 ميجابكسل',
    },
    summary_en: 'Galaxy S25 Ultra: Snapdragon 8 Elite (for Galaxy), 5,000 mAh battery, 200 MP camera.',
    summary_ar: 'Galaxy S25 Ultra: Snapdragon 8 Elite (for Galaxy)، بطارية 5,000 mAh، وكاميرا 200 ميجابكسل.',
  }),
  product({
    id: 'galaxy_s25_fe',
    name_en: 'Galaxy S25 FE',
    name_ar: 'Galaxy S25 FE',
    series: 'S25',
    variant: 'fe',
    aliases: ['s25 fe', 's25fe', 'galaxy s25 fe', 'اس 25 fe', 's25 fan edition'],
    seriesKeys: ['s25fe'],
    category: 'flagship',
    gsmarenaUrl: 'https://www.gsmarena.com/samsung_galaxy_s25_fe_5g-14042.php',
    specs: {
      processor:
        'Exynos 2400 (4 nm) — 10-core (1x3.2 GHz X4 & 2x2.9 + 3x2.6 GHz A720 & 4x1.95 GHz A520), Xclipse 940',
      battery: '4,900 mAh — 45W wired / 15W wireless (Qi2) / reverse wireless',
      display: '6.7" Dynamic LTPO AMOLED 2X, 120Hz, HDR10+, 1080×2340, Gorilla Glass Victus+ (1900 nits peak)',
      camera:
        'Triple main: 50 MP f/1.8 wide (OIS) + 8 MP f/2.4 tele 3x (OIS) + 12 MP f/2.2 ultrawide; video up to 8K. Selfie: 12 MP',
    },
    specs_ar: {
      processor: 'Exynos 2400 (4 nm) — عشر أنوية، GPU Xclipse 940',
      battery: '4,900 mAh — شحن سلكي 45W / لاسلكي 15W',
      display: 'شاشة 6.7 إنش Dynamic LTPO AMOLED 2X، 120Hz، 1080×2340',
      camera:
        'كاميرا خلفية ثلاثية: 50 ميجابكسل واسعة + 8 ميجابكسل تليفوتو 3x + 12 ميجابكسل واسعة جداً؛ سيلفي 12 ميجابكسل',
    },
    summary_en:
      'Galaxy S25 FE: Exynos 2400, 4,900 mAh (45W), 6.7" AMOLED 120Hz, triple camera 50+8+12 MP + 12 MP selfie.',
    summary_ar:
      'Galaxy S25 FE: معالج Exynos 2400، بطارية 4,900 mAh (45W)، شاشة 6.7 إنش 120Hz، وكاميرا ثلاثية 50+8+12.',
  }),

  // —— S26 family ——
  product({
    id: 'galaxy_s26',
    name_en: 'Galaxy S26',
    name_ar: 'Galaxy S26',
    series: 'S26',
    variant: 'base',
    aliases: ['s26', 'galaxy s26', 'normal s26', 'base s26', 'اس 26'],
    seriesKeys: ['s26'],
    category: 'flagship',
    gsmarenaUrl: 'https://www.gsmarena.com/',
    specs: {
      processor: 'Exynos 2600 (regional variants may differ)',
      battery: '4,300 mAh',
      display: '6.3-inch Dynamic AMOLED 2X',
      camera: '50 MP camera',
    },
    specs_ar: {
      processor: 'Exynos 2600 (قد تختلف حسب المنطقة)',
      battery: '4,300 mAh',
      display: 'شاشة 6.3 إنش Dynamic AMOLED 2X',
      camera: 'كاميرا 50 ميجابكسل',
    },
    summary_en: 'Galaxy S26: Exynos 2600 (region-dependent), 4,300 mAh, 6.3" display.',
    summary_ar: 'Galaxy S26: Exynos 2600 (حسب المنطقة)، بطارية 4,300 mAh، شاشة 6.3 إنش.',
  }),
  product({
    id: 'galaxy_s26_plus',
    name_en: 'Galaxy S26+',
    name_ar: 'Galaxy S26+',
    series: 'S26',
    variant: 'plus',
    aliases: ['s26+', 's26 plus', 's26plus', 'galaxy s26+', 'اس 26 بلس'],
    seriesKeys: ['s26plus'],
    category: 'flagship',
    gsmarenaUrl: 'https://www.gsmarena.com/',
    specs: {
      processor: 'Exynos 2600 (regional variants may differ)',
      battery: '4,900 mAh',
      display: '6.7-inch Dynamic AMOLED 2X',
      camera: '50 MP camera',
    },
    specs_ar: {
      processor: 'Exynos 2600 (قد تختلف حسب المنطقة)',
      battery: '4,900 mAh',
      display: 'شاشة 6.7 إنش Dynamic AMOLED 2X',
      camera: 'كاميرا 50 ميجابكسل',
    },
    summary_en: 'Galaxy S26+: Exynos 2600 (region-dependent), 4,900 mAh, 6.7" display.',
    summary_ar: 'Galaxy S26+: Exynos 2600 (حسب المنطقة)، بطارية 4,900 mAh، شاشة 6.7 إنش.',
  }),
  product({
    id: 'galaxy_s26_ultra',
    name_en: 'Galaxy S26 Ultra',
    name_ar: 'Galaxy S26 Ultra',
    series: 'S26',
    variant: 'ultra',
    aliases: ['s26 ultra', 's26ultra', 'galaxy s26 ultra', 'اس 26 الترا'],
    seriesKeys: ['s26ultra'],
    category: 'flagship',
    gsmarenaUrl: 'https://www.gsmarena.com/samsung_galaxy_s26_ultra-14320.php',
    specs: {
      processor: 'Qualcomm Snapdragon 8 Elite Gen 5 (SM8850-1-AD, 3 nm) — for Galaxy',
      battery: 'Li-Ion 5,000 mAh — 60W wired / 25W wireless',
      display: '6.9-inch Dynamic AMOLED 2X with Privacy Display',
      camera: '200 MP camera system',
      launch: 'Launched early 2026 (around March 2026)',
    },
    specs_ar: {
      processor: 'Qualcomm Snapdragon 8 Elite Gen 5 (SM8850-1-AD, 3 nm) — for Galaxy',
      battery: 'Li-Ion 5,000 mAh — شحن سلكي 60W / لاسلكي 25W',
      display: 'شاشة 6.9 إنش Dynamic AMOLED 2X مع Privacy Display',
      camera: 'نظام كاميرا 200 ميجابكسل',
      launch: 'انطلق مطلع 2026 (حوالي مارس 2026)',
    },
    summary_en:
      'Galaxy S26 Ultra: Snapdragon 8 Elite Gen 5 (for Galaxy), 5,000 mAh, Privacy Display, 200 MP camera.',
    summary_ar:
      'Galaxy S26 Ultra: Snapdragon 8 Elite Gen 5 (for Galaxy)، بطارية 5,000 mAh، Privacy Display، وكاميرا 200 ميجابكسل.',
  }),

  // —— Z foldables ——
  product({
    id: 'galaxy_z_fold8',
    name_en: 'Galaxy Z Fold8',
    name_ar: 'Galaxy Z Fold8',
    series: 'Z Fold8',
    variant: 'fold',
    aliases: ['fold 8', 'fold8', 'z fold8', 'z fold 8', 'galaxy fold 8', 'فولد 8'],
    seriesKeys: ['fold8'],
    category: 'foldable',
    gsmarenaUrl: 'https://www.gsmarena.com/samsung_galaxy_z_fold8-14801.php',
    specs: {
      processor: 'Snapdragon 8 Elite Gen 5 (for Galaxy) — regional variants may differ',
      battery: '4,800 mAh',
      display: 'Foldable main display + cover display',
    },
    specs_ar: {
      processor: 'Snapdragon 8 Elite Gen 5 (for Galaxy) — قد تختلف حسب المنطقة',
      battery: '4,800 mAh',
      display: 'شاشة قابلة للطي + شاشة غطاء',
    },
    summary_en: 'Galaxy Z Fold8: Snapdragon 8 Elite Gen 5 (for Galaxy), 4,800 mAh.',
    summary_ar: 'Galaxy Z Fold8: Snapdragon 8 Elite Gen 5 (for Galaxy)، بطارية 4,800 mAh.',
  }),
  product({
    id: 'galaxy_z_fold8_ultra',
    name_en: 'Galaxy Z Fold8 Ultra',
    name_ar: 'Galaxy Z Fold8 Ultra',
    series: 'Z Fold8',
    variant: 'ultra',
    aliases: ['fold 8 ultra', 'fold8 ultra', 'z fold8 ultra', 'z fold 8 ultra', 'فولد 8 الترا'],
    seriesKeys: ['fold8ultra'],
    category: 'foldable',
    gsmarenaUrl: 'https://www.gsmarena.com/samsung_galaxy_z_fold8_ultra_5g-14802.php',
    specs: {
      processor: 'Qualcomm Snapdragon 8 Elite Gen 5 (SM8850-1-AD, 3 nm)',
      battery: 'Si/C Li-Ion 5,000 mAh — 45W wired / 20W wireless',
      display: 'Foldable Ultra cover + main display',
    },
    specs_ar: {
      processor: 'Qualcomm Snapdragon 8 Elite Gen 5 (SM8850-1-AD, 3 nm)',
      battery: 'Si/C Li-Ion 5,000 mAh — شحن سلكي 45W / لاسلكي 20W',
      display: 'شاشة Ultra قابلة للطي + شاشة غطاء',
    },
    summary_en: 'Galaxy Z Fold8 Ultra: Snapdragon 8 Elite Gen 5, 5,000 mAh.',
    summary_ar: 'Galaxy Z Fold8 Ultra: Snapdragon 8 Elite Gen 5، بطارية 5,000 mAh.',
  }),
  product({
    id: 'galaxy_z_flip8',
    name_en: 'Galaxy Z Flip8',
    name_ar: 'Galaxy Z Flip8',
    series: 'Z Flip8',
    variant: 'flip',
    aliases: ['flip 8', 'flip8', 'z flip8', 'z flip 8', 'فليب 8'],
    seriesKeys: ['flip8'],
    category: 'foldable',
    gsmarenaUrl: 'https://www.gsmarena.com/samsung_galaxy_z_flip8_5g-14803.php',
    specs: {
      processor: 'Snapdragon 8 Elite Gen 5 (US/CA/CN) or Exynos 2600 (ROW)',
      battery: 'Si/C Li-Ion 4,300 mAh — 25W wired / 15W wireless',
      display: '6.9" inner display + cover display',
    },
    specs_ar: {
      processor: 'Snapdragon 8 Elite Gen 5 (أمريكا/كندا/الصين) أو Exynos 2600 (باقي المناطق)',
      battery: 'Si/C Li-Ion 4,300 mAh — شحن سلكي 25W / لاسلكي 15W',
      display: 'شاشة داخلية 6.9 إنش + شاشة غطاء',
    },
    summary_en: 'Galaxy Z Flip8: Snapdragon 8 Elite Gen 5 or Exynos 2600 by region, 4,300 mAh.',
    summary_ar: 'Galaxy Z Flip8: Snapdragon 8 Elite Gen 5 أو Exynos 2600 حسب المنطقة، بطارية 4,300 mAh.',
  }),

  // —— Galaxy A (Egypt lineup / GSMArena) ——
  product({
    id: 'galaxy_a17',
    name_en: 'Galaxy A17',
    name_ar: 'Galaxy A17',
    series: 'A17',
    variant: 'a-series',
    aliases: ['a17', 'galaxy a17', 'a 17', 'ايه 17'],
    seriesKeys: ['a17'],
    category: 'a-series',
    gsmarenaUrl: 'https://www.gsmarena.com/samsung_galaxy_a17-14041.php',
    samsungEgUrl: 'https://www.samsung.com/eg/smartphones/galaxy-a/',
    specs: {
      processor: 'Exynos 1330 (5 nm) — Octa-core (2x2.4 GHz A78 & 6x2.0 GHz A55), Mali-G68 MP2',
      battery: '5,000 mAh — 25W wired',
      display: '6.7" Super AMOLED, 90Hz, 1080×2340, Gorilla Glass Victus (~800 nits HBM)',
      camera:
        'Triple main: 50 MP f/1.8 wide (AF, OIS) + 5 MP f/2.2 ultrawide + 2 MP macro; LED flash; 1080p@30fps. Selfie: 13 MP f/2.0',
    },
    specs_ar: {
      processor: 'Exynos 1330 (5 nm) — ثماني النواة، GPU Mali-G68 MP2',
      battery: '5,000 mAh — شحن سلكي 25W',
      display: 'شاشة 6.7 إنش Super AMOLED، 90Hz، 1080×2340، Gorilla Glass Victus',
      camera:
        'كاميرا خلفية ثلاثية: 50 ميجابكسل واسعة f/1.8 (AF + OIS) + 5 ميجابكسل واسعة جداً + 2 ميجابكسل ماكرو؛ سيلفي 13 ميجابكسل؛ فيديو 1080p@30',
    },
    summary_en:
      'Galaxy A17: Exynos 1330, 5,000 mAh (25W), 6.7" Super AMOLED 90Hz, triple camera 50+5+2 MP + 13 MP selfie.',
    summary_ar:
      'Galaxy A17: معالج Exynos 1330، بطارية 5,000 mAh (25W)، شاشة 6.7 إنش Super AMOLED 90Hz، وكاميرا ثلاثية 50+5+2 ميجابكسل مع سيلفي 13.',
  }),
  product({
    id: 'galaxy_a27',
    name_en: 'Galaxy A27',
    name_ar: 'Galaxy A27',
    series: 'A27',
    variant: 'a-series',
    aliases: ['a27', 'galaxy a27', 'a 27', 'ايه 27'],
    seriesKeys: ['a27'],
    category: 'a-series',
    gsmarenaUrl: 'https://www.gsmarena.com/samsung_galaxy_a27_5g-14606.php',
    samsungEgUrl: 'https://www.samsung.com/eg/smartphones/galaxy-a/',
    specs: {
      processor: 'Qualcomm Snapdragon 6 Gen 3 (SM6475-AB, 4 nm)',
      battery: '5,000 mAh — 25W wired',
      display: '6.7-inch ~1080×2340',
      camera: '50 MP main',
    },
    specs_ar: {
      processor: 'Qualcomm Snapdragon 6 Gen 3 (SM6475-AB, 4 nm)',
      battery: '5,000 mAh — شحن سلكي 25W',
      display: 'شاشة 6.7 إنش تقريباً 1080×2340',
      camera: 'كاميرا رئيسية 50 ميجابكسل',
    },
    summary_en: 'Galaxy A27: Snapdragon 6 Gen 3, 5,000 mAh, 50 MP camera.',
    summary_ar: 'Galaxy A27: Snapdragon 6 Gen 3، بطارية 5,000 mAh، وكاميرا 50 ميجابكسل.',
  }),
  product({
    id: 'galaxy_a36',
    name_en: 'Galaxy A36',
    name_ar: 'Galaxy A36',
    series: 'A36',
    variant: 'a-series',
    aliases: ['a36', 'galaxy a36', 'a 36', 'ايه 36', 'a36 5g'],
    seriesKeys: ['a36'],
    category: 'a-series',
    gsmarenaUrl: 'https://www.gsmarena.com/samsung_galaxy_a36-13497.php',
    samsungEgUrl: 'https://www.samsung.com/eg/smartphones/galaxy-a/',
    specs: {
      processor:
        'Qualcomm SM6475-AB Snapdragon 6 Gen 3 (4 nm) — Octa-core (4x2.4 GHz A78 & 4x1.8 GHz A55), Adreno 710',
      battery: '5,000 mAh — 45W wired',
      display: '6.7" Super AMOLED, 120Hz, 1080×2340, Gorilla Glass Victus+ (1200 nits HBM / 1900 nits peak)',
      camera:
        'Triple main: 50 MP f/1.8 wide (PDAF, OIS) + 8 MP f/2.2 ultrawide + 5 MP f/2.4 macro; video 4K@30. Selfie: 12 MP',
    },
    specs_ar: {
      processor: 'Snapdragon 6 Gen 3 (4 nm) — ثماني النواة، GPU Adreno 710',
      battery: '5,000 mAh — شحن سلكي 45W',
      display: 'شاشة 6.7 إنش Super AMOLED، 120Hz، 1080×2340',
      camera:
        'كاميرا خلفية ثلاثية: 50 ميجابكسل واسعة (OIS) + 8 ميجابكسل واسعة جداً + 5 ميجابكسل ماكرو؛ سيلفي 12 ميجابكسل',
    },
    summary_en:
      'Galaxy A36: Snapdragon 6 Gen 3, 5,000 mAh (45W), 6.7" Super AMOLED 120Hz, triple camera 50+8+5 MP + 12 MP selfie.',
    summary_ar:
      'Galaxy A36: معالج Snapdragon 6 Gen 3، بطارية 5,000 mAh (45W)، شاشة 6.7 إنش 120Hz، وكاميرا ثلاثية 50+8+5.',
  }),
  product({
    id: 'galaxy_a37',
    name_en: 'Galaxy A37',
    name_ar: 'Galaxy A37',
    series: 'A37',
    variant: 'a-series',
    aliases: ['a37', 'galaxy a37', 'a 37', 'ايه 37', 'a37 5g'],
    seriesKeys: ['a37'],
    category: 'a-series',
    gsmarenaUrl: 'https://www.gsmarena.com/samsung_galaxy_a37_5g-14378.php',
    samsungEgUrl: 'https://www.samsung.com/eg/smartphones/galaxy-a/',
    specs: {
      processor: 'Exynos 1480 (4 nm) — Octa-core (4x2.75 GHz A78 & 4x2.0 GHz A55), Xclipse 530',
      battery: '5,000 mAh — 45W wired',
      display: '6.7" Super AMOLED, 120Hz, 1080×2340, Gorilla Glass Victus+ (up to ~1900 nits peak)',
      camera:
        'Triple main: 50 MP f/1.8 wide (PDAF, OIS) + 8 MP f/2.2 ultrawide + 5 MP f/2.4 macro; LED flash; video 4K@30 / 1080p@30/60. Selfie: 12 MP f/2.2 (4K@30)',
    },
    specs_ar: {
      processor: 'Exynos 1480 (4 nm) — ثماني النواة، GPU Xclipse 530',
      battery: '5,000 mAh — شحن سلكي 45W',
      display: 'شاشة 6.7 إنش Super AMOLED، 120Hz، 1080×2340، Gorilla Glass Victus+',
      camera:
        'كاميرا خلفية ثلاثية: 50 ميجابكسل واسعة f/1.8 (PDAF + OIS) + 8 ميجابكسل واسعة جداً + 5 ميجابكسل ماكرو؛ فيديو 4K@30. سيلفي 12 ميجابكسل',
    },
    summary_en:
      'Galaxy A37: Exynos 1480, 5,000 mAh (45W), 6.7" Super AMOLED 120Hz, triple camera 50+8+5 MP + 12 MP selfie.',
    summary_ar:
      'Galaxy A37: معالج Exynos 1480، بطارية 5,000 mAh (45W)، شاشة 6.7 إنش 120Hz، وكاميرا ثلاثية 50+8+5 مع سيلفي 12.',
  }),
  product({
    id: 'galaxy_a57',
    name_en: 'Galaxy A57',
    name_ar: 'Galaxy A57',
    series: 'A57',
    variant: 'a-series',
    aliases: ['a57', 'galaxy a57', 'a 57', 'ايه 57'],
    seriesKeys: ['a57'],
    category: 'a-series',
    gsmarenaUrl: 'https://www.gsmarena.com/samsung_galaxy_a57_5g-14379.php',
    samsungEgUrl: 'https://www.samsung.com/eg/smartphones/galaxy-a/',
    specs: {
      processor:
        'Exynos 1680 (4 nm) — Octa-core (1x2.9 + 4x2.6 GHz Cortex-720 & 3x1.95 GHz Cortex-520), Xclipse 550',
      battery: '5,000 mAh — 45W wired',
      display:
        '6.7" Super AMOLED+, 120Hz, HDR10+, 1080×2340, Gorilla Glass Victus+ (1200 nits HBM / 1900 nits peak)',
      camera:
        'Triple main: 50 MP f/1.8 wide (1/1.56", PDAF, OIS) + 12 MP f/2.2 ultrawide 13mm + 5 MP f/2.4 macro; LED flash; video 4K@30 / 1080p@30/60. Selfie: 12 MP f/2.2 (4K@30, 10-bit HDR)',
    },
    specs_ar: {
      processor: 'Exynos 1680 (4 nm) — ثماني النواة، GPU Xclipse 550',
      battery: '5,000 mAh — شحن سلكي 45W',
      display: 'شاشة 6.7 إنش Super AMOLED+، 120Hz، HDR10+، 1080×2340، Gorilla Glass Victus+',
      camera:
        'كاميرا خلفية ثلاثية: 50 ميجابكسل واسعة f/1.8 (PDAF + OIS) + 12 ميجابكسل واسعة جداً + 5 ميجابكسل ماكرو؛ فيديو 4K@30. سيلفي 12 ميجابكسل',
    },
    summary_en:
      'Galaxy A57: Exynos 1680, 5,000 mAh (45W), 6.7" Super AMOLED+ 120Hz, triple camera 50+12+5 MP + 12 MP selfie.',
    summary_ar:
      'Galaxy A57: معالج Exynos 1680، بطارية 5,000 mAh (45W)، شاشة 6.7 إنش 120Hz، وكاميرا ثلاثية 50+12+5 مع سيلفي 12.',
  }),
];

const TYPO_FIXES = [
  [/pr9ocessor/gi, 'processor'],
  [/pross?esor/gi, 'processor'],
  [/proccessor/gi, 'processor'],
  [/\bs255\b/gi, 's25'],
  [/s255(?=ultra|\b)/gi, 's25'],
  [/\bs266\b/gi, 's26'],
  [/s266(?=ultra|\b)/gi, 's26'],
  [/foldd/gi, 'fold'],
  [/flipp/gi, 'flip'],
];

export function normalizeProductQuery(text) {
  let s = String(text || '').toLowerCase();
  TYPO_FIXES.forEach(([re, to]) => {
    s = s.replace(re, to);
  });
  return s
    .replace(/[^\p{L}\p{N}\s+]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactKey(text) {
  return normalizeProductQuery(text).replace(/\s+/g, '');
}

function wantsNonUltra(query) {
  return /not\s+ultra|non[\s-]?ultra|normal|base|standard|بدون\s*الترا|مش\s*الترا|ليس\s*الترا|العادي|العادية/i.test(
    String(query || ''),
  );
}

function wantsPlus(query) {
  return /\+|plus|بلس/i.test(String(query || ''));
}

function wantsFe(query) {
  return /\bfe\b|fan\s*edition/i.test(String(query || ''));
}

/**
 * Resolve exact variant intent: ultra | plus | fe | base | fold8ultra | fold8 | flip8 | aXX
 */
export function extractModelHints(query) {
  const q = normalizeProductQuery(query);
  const compact = compactKey(query);
  const hints = new Set();
  const excludeUltra = wantsNonUltra(query);

  // A-series (include common Egypt / recent models)
  const aHit =
    compact.match(/\ba(1[0-9]|2[0-9]|3[0-9]|5[0-9]|7[0-9])\b/) ||
    compact.match(/a(17|27|36|37|55|56|57|35|25|16|15|14)/);
  if (aHit) hints.add(`a${aHit[1]}`);

  // Fold / Flip
  if (/fold\s*8\s*ultra|fold8ultra|zfold8ultra/i.test(compact) || /fold\s*8\s*ultra/i.test(q)) {
    if (!excludeUltra) hints.add('fold8ultra');
  } else if (/fold\s*8|fold8|zfold8/i.test(compact) || /fold\s*8/i.test(q)) {
    hints.add('fold8');
  }
  if (/flip\s*8|flip8|zflip8/i.test(compact) || /flip\s*8/i.test(q)) hints.add('flip8');

  // S-series with explicit variant
  const sNumMatch = compact.match(/s(2[3-9]|30)/g);
  const sNums = sNumMatch ? [...new Set(sNumMatch.map((x) => x.slice(1)))] : [];

  for (const num of sNums) {
    const hasUltra = compact.includes(`s${num}ultra`) || new RegExp(`s\\s*${num}\\s*ultra`, 'i').test(q);
    const hasPlus = compact.includes(`s${num}plus`) || compact.includes(`s${num}+`) || new RegExp(`s\\s*${num}\\s*(\\+|plus)`, 'i').test(q);
    const hasFe = compact.includes(`s${num}fe`) || new RegExp(`s\\s*${num}\\s*fe`, 'i').test(q);

    if (excludeUltra) {
      if (hasPlus || wantsPlus(query)) hints.add(`s${num}plus`);
      else if (hasFe || wantsFe(query)) hints.add(`s${num}fe`);
      else hints.add(`s${num}`);
      continue;
    }

    if (hasUltra) hints.add(`s${num}ultra`);
    else if (hasPlus || wantsPlus(query)) hints.add(`s${num}plus`);
    else if (hasFe || wantsFe(query)) hints.add(`s${num}fe`);
    else if (new RegExp(`(?:galaxy\\s*)?s\\s*${num}\\b`, 'i').test(q) || compact.includes(`s${num}`) || compact.includes(`galaxys${num}`)) {
      // bare s25 / galaxy s25 → base, NEVER ultra
      hints.add(`s${num}`);
    }
  }

  return [...hints];
}

export function findGoGoProduct(query, catalog = GOGO_PRODUCT_SEED) {
  const q = normalizeProductQuery(query);
  if (!q) return null;
  const hints = extractModelHints(query);

  const looksLikeProductAsk =
    /galaxy|samsung|ultra|fold|flip|\bs2[3-9]\b|\ba\d{2}\b|معالج|processor|chipset|battery|بطارية|شاشة|display|camera|كاميرا|normal|base/i.test(
      q,
    );

  if (!hints.length) {
    return looksLikeProductAsk ? null : null;
  }

  // Prefer exact seriesKey match; never let ultra steal base.
  const ranked = [...catalog].sort((a, b) => {
    const as = Math.max(0, ...(a.seriesKeys || []).map((k) => k.length));
    const bs = Math.max(0, ...(b.seriesKeys || []).map((k) => k.length));
    return bs - as;
  });

  let best = null;
  let bestScore = 0;
  for (const product of ranked) {
    const keys = product.seriesKeys || [];
    const hitKeys = keys.filter((k) => hints.includes(k));
    if (!hitKeys.length) continue;

    // If user wants base and product is ultra, skip
    if (wantsNonUltra(query) && product.variant === 'ultra') continue;
    // If hint is exactly s25 and product is s25ultra only, skip (ultra keys no longer include s25)
    if (hints.includes('s25') && !hints.includes('s25ultra') && product.variant === 'ultra' && product.series === 'S25') continue;
    if (hints.includes('s26') && !hints.includes('s26ultra') && product.variant === 'ultra' && product.series === 'S26') continue;

    let score = 40 + Math.max(...hitKeys.map((k) => k.length));
    if (product.variant === 'base' && hints.some((h) => /^s2\d$/.test(h) || /^a\d+$/.test(h))) score += 15;
    if (product.variant === 'ultra' && hints.some((h) => h.endsWith('ultra'))) score += 20;

    if (score > bestScore) {
      bestScore = score;
      best = product;
    }
  }

  if (!best || bestScore < 20) return null;
  return best;
}

export function detectSpecFocus(query) {
  const q = normalizeProductQuery(query);
  if (/processor|chipset|ap\b|snapdragon|exynos|معالج|بروسيسور|شريحة|cpu/i.test(q)) return 'processor';
  if (/battery|mah|بطارية|شحن/i.test(q)) return 'battery';
  if (/camera|megapixel|\bmp\b|كاميرا/i.test(q)) return 'camera';
  if (/display|screen|resolution|شاشة|دقة/i.test(q)) return 'display';
  if (/color|colour|لون/i.test(q)) return 'colors';
  if (/launch|released|announced|انطلق|صدر|اطلق/i.test(q)) return 'launch';
  return 'all';
}

function specValue(specs, focus) {
  if (!specs) return '';
  if (focus === 'display') return specs.display || specs.cover_display || '';
  return specs[focus] || '';
}

export function isGsmArenaSourceQuestion(text) {
  const s = String(text || '');
  if (/gsm\s*arena|gsmarena|جي\s*اس\s*ام\s*ارينا|isit\s*gsm|is\s*it\s*gsm/i.test(s)) return true;
  if (/^(is\s*it\s*)?(from\s*)?(the\s*)?source\??$/i.test(s.trim())) return true;
  if (/هل\s*(من|المصدر)?\s*(gsm|جي)|المصدر\s*(gsm|جي|إيه|ايه)|منين\s*المعلومة/i.test(s)) return true;
  return false;
}

export function getGsmArenaConfirmReply(lang = 'en') {
  return lang === 'ar'
    ? 'مصدرنا بيانات منتجات Samsung المعتمدة في SCORA. المواصفات بتتجاب من قاعدة بيانات Samsung لما تكون متاحة.'
    : 'Our source is Samsung product data in SCORA. Specs come from the Samsung knowledge base when available.';
}

/** Visitor-facing reply when Samsung product data is not in the KB yet. */
export function getSamsungDataUnavailableReply(lang = 'en') {
  return lang === 'ar'
    ? 'بيانات المنتج دي غير متاحة حالياً. خليك متابع للتحديثات الجديدة.'
    : 'These product data are currently unavailable. Stay tuned for new updates.';
}

export function getUnknownProductReply(lang = 'en', query = '') {
  return getSamsungDataUnavailableReply(lang);
}

export function formatGoGoProductAnswer(product, lang = 'en', focus = 'all') {
  if (!product) return '';
  const L = lang === 'ar' ? 'ar' : 'en';
  const specs = L === 'ar' ? product.specs_ar || product.specs : product.specs;

  if (focus && focus !== 'all' && focus !== 'colors') {
    const value = specValue(specs, focus);
    if (value && !isWeakInline(value)) {
      if (focus === 'processor') {
        return L === 'ar'
          ? `${product.name_ar} بيستخدم معالج ${value}.`
          : `${product.name_en} uses the ${value} processor.`;
      }
      if (focus === 'battery') {
        return L === 'ar'
          ? `بطارية ${product.name_ar}: ${value}.`
          : `${product.name_en} battery: ${value}.`;
      }
      if (focus === 'display') {
        return L === 'ar'
          ? `شاشة ${product.name_ar}: ${value}.`
          : `${product.name_en} display: ${value}.`;
      }
      if (focus === 'camera') {
        return L === 'ar'
          ? `كاميرا ${product.name_ar}: ${value}.`
          : `${product.name_en} camera: ${value}.`;
      }
      return L === 'ar' ? `${product.name_ar}: ${value}.` : `${product.name_en}: ${value}.`;
    }
    return '';
  }

  return (L === 'ar' ? product.summary_ar : product.summary_en) || '';
}

function isWeakInline(value) {
  const s = String(value || '').trim();
  if (!s) return true;
  if (/^[a-z0-9+.\s-]{0,12}\s*camera\s*system\.?$/i.test(s)) return true;
  if (/^كاميرا\s*a?\d{0,2}\.?$/i.test(s)) return true;
  if (/galaxy a\d{2} display|see gsmarena/i.test(s)) return true;
  if (s.length < 18) return true;
  return false;
}

export function buildGoGoProductCatalogContext(catalog = GOGO_PRODUCT_SEED) {
  const lines = catalog.map((p) => {
    const specs = Object.entries(p.specs || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');
    return `- ${p.name_en} [${p.variant}]: ${specs}`;
  });
  return [
    '## Samsung product specs (Samsung data knowledge base)',
    GOGO_PRODUCT_SOURCE.note_en,
    `Egypt A-series hub: ${GOGO_PRODUCT_SOURCE.eg_a_series}`,
    ...lines,
    'HARD RULES:',
    '- Galaxy S25 = base model. Galaxy S25 Ultra = ultra only. Never swap them.',
    '- If user says “normal / base / not ultra”, answer the base model.',
    '- Answer the asked spec first. Never dodge.',
    '- Never mention GSMArena or external review sites to the visitor. Source is Samsung data.',
    '- If specs are missing, say data is currently unavailable and to stay tuned for updates. Do not invent.',
    '- Product memory lives in Firebase samsung_kb / gogo products with model-number identity.',
  ].join('\n');
}

/** Shape used when writing/updating Firebase product docs. */
export function toFirebaseProductDoc(product) {
  return {
    type: 'GOGO_PRODUCT_SPEC',
    brand: product.brand || 'Samsung',
    id: product.id,
    name_en: product.name_en,
    name_ar: product.name_ar,
    series: product.series,
    variant: product.variant,
    aliases: product.aliases || [],
    seriesKeys: product.seriesKeys || [],
    category: product.category,
    gsmarenaUrl: product.gsmarenaUrl || GOGO_PRODUCT_SOURCE.url,
    samsungEgUrl: product.samsungEgUrl || '',
    specs: product.specs || {},
    specs_ar: product.specs_ar || {},
    summary_en: product.summary_en || '',
    summary_ar: product.summary_ar || '',
    source: 'gsmarena',
    templateVersion: 2,
    updatedAt: new Date().toISOString(),
  };
}
