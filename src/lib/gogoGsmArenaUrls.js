/**
 * Shared GSMArena URL map + page verification helpers.
 * IDs on GSMArena get recycled — never trust a URL without Samsung title check.
 */

export const KNOWN_SAMSUNG_GSM_URLS = {
  a17: 'https://www.gsmarena.com/samsung_galaxy_a17-14041.php',
  a27: 'https://www.gsmarena.com/samsung_galaxy_a27_5g-14606.php',
  a36: 'https://www.gsmarena.com/samsung_galaxy_a36-13497.php',
  a37: 'https://www.gsmarena.com/samsung_galaxy_a37_5g-14378.php',
  a56: 'https://www.gsmarena.com/samsung_galaxy_a56-13496.php',
  a57: 'https://www.gsmarena.com/samsung_galaxy_a57_5g-14379.php',
  s25: 'https://www.gsmarena.com/samsung_galaxy_s25-13610.php',
  s25plus: 'https://www.gsmarena.com/samsung_galaxy_s25+-13609.php',
  s25ultra: 'https://www.gsmarena.com/samsung_galaxy_s25_ultra-13322.php',
  s25fe: 'https://www.gsmarena.com/samsung_galaxy_s25_fe_5g-14042.php',
};

/** Priority URLs for Option A bulk ingest (verified Samsung pages). */
export const GOGO_BULK_GSM_URLS = [
  KNOWN_SAMSUNG_GSM_URLS.s25,
  KNOWN_SAMSUNG_GSM_URLS.s25plus,
  KNOWN_SAMSUNG_GSM_URLS.s25ultra,
  KNOWN_SAMSUNG_GSM_URLS.s25fe,
  KNOWN_SAMSUNG_GSM_URLS.a17,
  KNOWN_SAMSUNG_GSM_URLS.a36,
  KNOWN_SAMSUNG_GSM_URLS.a37,
  KNOWN_SAMSUNG_GSM_URLS.a57,
  'https://www.gsmarena.com/samsung_galaxy_z_fold6-13147.php',
];
