import { NextResponse } from 'next/server';
import { compareSamsungProducts } from '../../../../lib/samsungKb/compare';
import { findByExactModelNumber, findByProductId } from '../../../../lib/samsungKb/search';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST {
 *   catalog: Product[],
 *   product_ids?: string[],
 *   model_numbers?: string[],
 *   fields?: string[]
 * }
 */
export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const catalog = Array.isArray(body.catalog) ? body.catalog : [];
  let products = [];
  if (Array.isArray(body.products) && body.products.length) {
    products = body.products;
  } else if (Array.isArray(body.product_ids) && body.product_ids.length) {
    products = body.product_ids.map((id) => findByProductId(catalog, id)).filter(Boolean);
  } else if (Array.isArray(body.model_numbers) && body.model_numbers.length) {
    products = body.model_numbers.map((m) => findByExactModelNumber(catalog, m)).filter(Boolean);
  }

  if (products.length < 2) {
    return NextResponse.json(
      {
        error: 'Need at least two resolved products to compare',
        resolved: products.map((p) => p.product_id),
        catalog_size: catalog.length,
      },
      { status: 422 },
    );
  }

  const result = compareSamsungProducts(products, { fields: body.fields });
  return NextResponse.json(result);
}
