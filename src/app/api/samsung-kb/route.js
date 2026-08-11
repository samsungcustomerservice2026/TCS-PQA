import { NextResponse } from 'next/server';
import { SAMSUNG_PRODUCT_JSON_SCHEMA, emptyCatalogMeta } from '../../../lib/samsungKb/schema';
import {
  DATA_STATUS,
  SAMSUNG_KB_CATEGORIES,
  SAMSUNG_KB_CATEGORY_LABELS,
  SAMSUNG_KB_DATE_WINDOW,
  SAMSUNG_KB_PRODUCTION_READY,
} from '../../../lib/samsungKb/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET catalog contract / empty status (no invented products). */
export async function GET() {
  return NextResponse.json({
    production_ready: SAMSUNG_KB_PRODUCTION_READY,
    window: SAMSUNG_KB_DATE_WINDOW,
    categories: SAMSUNG_KB_CATEGORIES,
    category_labels: SAMSUNG_KB_CATEGORY_LABELS,
    DATA_STATUS,
    schema: SAMSUNG_PRODUCT_JSON_SCHEMA,
    meta: emptyCatalogMeta(),
    note: 'Product rows live in Firestore samsung_kb/workspace/products. This endpoint does not invent catalog data.',
    endpoints: {
      'GET /api/samsung-kb/products': 'List / schema note (client Firestore preferred for large sets)',
      'POST /api/samsung-kb/products': 'Validate + return normalized record (persist via admin client)',
      'POST /api/samsung-kb/search': 'Search over posted catalog or empty',
      'POST /api/samsung-kb/import': 'Parse JSON/CSV payload → validated products (no auto-fake)',
      'POST /api/samsung-kb/compare': 'Compare product records by id/model',
    },
  });
}
