/**
 * Firestore-backed Samsung Product Knowledge Base service.
 * Collection: samsung_kb / products / {product_id}
 * Meta: samsung_kb / meta / catalog
 *
 * Catalog starts empty. Do not seed invented products.
 */

import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  limit,
  writeBatch,
} from 'firebase/firestore';
import {
  SAMSUNG_KB_FIRESTORE,
  SAMSUNG_KB_PRODUCTION_READY,
} from '../lib/samsungKb/constants';
import { emptyCatalogMeta, validateProductRecord } from '../lib/samsungKb/schema';
import { buildSearchTokens } from '../lib/samsungKb/normalize';
import { searchSamsungKb, findByProductId, findByExactModelNumber } from '../lib/samsungKb/search';
import { compareSamsungProducts } from '../lib/samsungKb/compare';
import { listOpenConflicts } from '../lib/samsungKb/conflicts';
import { retrieveSamsungKbForQuestion } from '../lib/samsungKb/retrieval';
import {
  importProductsFromCsv,
  importProductsFromExcel,
  importProductsFromJson,
} from '../lib/samsungKb/importParse';

const { root, imports: IMPORTS_SUB } = SAMSUNG_KB_FIRESTORE;

let catalogCache = null;
let catalogCacheAt = 0;
const CACHE_MS = 30_000;

const WORKSPACE = 'workspace';

function productsCollection() {
  return collection(db, root, WORKSPACE, 'products');
}

function metaRef() {
  return doc(db, root, 'catalog_meta');
}

function importsCollection() {
  return collection(db, root, WORKSPACE, IMPORTS_SUB);
}

export async function getSamsungKbMeta() {
  try {
    const snap = await getDoc(metaRef());
    if (snap.exists()) return { ...emptyCatalogMeta(), ...snap.data() };
  } catch {
    /* offline / rules */
  }
  return emptyCatalogMeta();
}

async function writeMeta(patch) {
  const current = await getSamsungKbMeta();
  const next = {
    ...current,
    ...patch,
    production_ready: SAMSUNG_KB_PRODUCTION_READY && Number(patch.product_count ?? current.product_count) > 0,
    updated_at: new Date().toISOString(),
  };
  await setDoc(metaRef(), next, { merge: true });
  return next;
}

/**
 * Load all products (paginated soft-cap). Empty until import.
 * @param {{ force?: boolean, max?: number }} [opts]
 */
export async function listSamsungKbProducts({ force = false, max = 5000 } = {}) {
  const now = Date.now();
  if (!force && catalogCache && now - catalogCacheAt < CACHE_MS) return catalogCache;

  try {
    const snap = await getDocs(query(productsCollection(), limit(max)));
    const rows = snap.docs.map((d) => ({ ...d.data(), product_id: d.id }));
    catalogCache = rows;
    catalogCacheAt = now;
    return rows;
  } catch (err) {
    console.warn('Samsung KB list failed:', err?.message || err);
    catalogCache = [];
    catalogCacheAt = now;
    return [];
  }
}

export async function getSamsungKbProduct(productId) {
  if (!productId) return null;
  const snap = await getDoc(doc(productsCollection(), productId));
  if (!snap.exists()) return null;
  return { product_id: snap.id, ...snap.data() };
}

export async function upsertSamsungKbProduct(record, { actor = '' } = {}) {
  const v = validateProductRecord(record);
  if (!v.ok) {
    const err = new Error(v.errors.join('; '));
    err.validation = v;
    throw err;
  }
  const now = new Date().toISOString();
  const next = {
    ...record,
    search_tokens: buildSearchTokens(record),
    updated_at: now,
    updated_by: actor || record.updated_by || '',
    created_at: record.created_at || now,
    brand: 'Samsung',
  };
  await setDoc(doc(productsCollection(), next.product_id), next, { merge: true });
  catalogCache = null;
  const all = await listSamsungKbProducts({ force: true });
  await writeMeta({ product_count: all.length, last_import_at: now });
  return next;
}

export async function deleteSamsungKbProduct(productId) {
  if (!productId) return false;
  await deleteDoc(doc(productsCollection(), productId));
  catalogCache = null;
  const all = await listSamsungKbProducts({ force: true });
  await writeMeta({ product_count: all.length });
  return true;
}

export async function searchSamsungKbProducts(query) {
  const catalog = await listSamsungKbProducts();
  return searchSamsungKb(catalog, query);
}

export async function compareSamsungKbByIds(productIds = [], opts = {}) {
  const catalog = await listSamsungKbProducts();
  const products = productIds.map((id) => findByProductId(catalog, id)).filter(Boolean);
  return compareSamsungProducts(products, opts);
}

export async function compareSamsungKbByModels(modelNumbers = [], opts = {}) {
  const catalog = await listSamsungKbProducts();
  const products = modelNumbers.map((m) => findByExactModelNumber(catalog, m)).filter(Boolean);
  return compareSamsungProducts(products, opts);
}

export async function listSamsungKbConflicts() {
  const catalog = await listSamsungKbProducts();
  return listOpenConflicts(catalog);
}

export async function retrieveFromSamsungKb(question, opts = {}) {
  const catalog = await listSamsungKbProducts();
  return retrieveSamsungKbForQuestion(question, catalog, opts);
}

/**
 * Bulk import validated products. Does not invent rows.
 */
export async function importSamsungKbProducts(products, { actor = '', mode = 'merge' } = {}) {
  const batchSize = 400;
  let written = 0;
  for (let i = 0; i < products.length; i += batchSize) {
    const chunk = products.slice(i, i + batchSize);
    const batch = writeBatch(db);
    chunk.forEach((p) => {
      const v = validateProductRecord(p);
      if (!v.ok) return;
      const next = {
        ...p,
        search_tokens: buildSearchTokens(p),
        updated_at: new Date().toISOString(),
        updated_by: actor,
        brand: 'Samsung',
      };
      batch.set(doc(productsCollection(), next.product_id), next, { merge: mode !== 'replace' });
      written += 1;
    });
    await batch.commit();
  }
  catalogCache = null;
  const all = await listSamsungKbProducts({ force: true });
  const meta = await writeMeta({
    product_count: all.length,
    last_import_at: new Date().toISOString(),
  });
  await setDoc(doc(importsCollection(), `import_${Date.now()}`), {
    actor,
    mode,
    attempted: products.length,
    written,
    at: new Date().toISOString(),
  });
  return { written, product_count: all.length, meta };
}

export const samsungKbImportParsers = {
  json: importProductsFromJson,
  csv: importProductsFromCsv,
  excel: importProductsFromExcel,
};

export function getSamsungKbEmptyMeta() {
  return emptyCatalogMeta();
}
