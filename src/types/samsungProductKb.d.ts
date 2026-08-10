/**
 * TypeScript interfaces for the Samsung Product Knowledge Base.
 * Runtime validation lives in src/lib/samsungKb/schema.js.
 */

export type DataStatus = 'VERIFIED' | 'PARTIAL' | 'UNVERIFIED';
export type Confidence = 'VERIFIED' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
export type TriState = 'YES' | 'NO' | 'UNKNOWN';

export interface SpecValue {
  value: unknown;
  unit?: string;
  source?: string;
  confidence?: Confidence;
  note?: string;
}

export interface ProductSource {
  source: string;
  url?: string;
  accessed_date?: string;
  note?: string;
}

export interface ManufacturingEvidence {
  source?: string;
  source_url?: string;
  source_date?: string;
  evidence_text?: string;
  confidence?: Confidence;
}

export interface EgyptInfo {
  available: TriState;
  officially_sold: TriState;
  manufactured_in_egypt: TriState;
  assembled_in_egypt: TriState;
  manufacturing_location?: string;
  manufacturing_period?: string;
  evidence_source?: string;
  evidence?: ManufacturingEvidence[];
}

export interface SpecConflict {
  field_path: string;
  values: Array<{ value: unknown; source?: string; confidence?: Confidence }>;
  status: 'OPEN' | 'RESOLVED';
  resolved_value?: string;
  resolved_by?: string;
  resolved_at?: string;
  note?: string;
}

export interface ProductSpecifications {
  network?: Record<string, SpecValue | unknown>;
  body?: Record<string, SpecValue | unknown>;
  display?: Record<string, SpecValue | unknown>;
  platform?: Record<string, SpecValue | unknown>;
  memory?: Record<string, SpecValue | unknown>;
  camera?: Record<string, SpecValue | unknown>;
  sound?: Record<string, SpecValue | unknown>;
  comms?: Record<string, SpecValue | unknown>;
  features?: Record<string, SpecValue | unknown>;
  battery?: Record<string, SpecValue | unknown>;
  misc?: Record<string, SpecValue | unknown>;
  watch?: Record<string, SpecValue | unknown>;
  buds?: Record<string, SpecValue | unknown>;
  tv?: Record<string, SpecValue | unknown>;
  refrigerator?: Record<string, SpecValue | unknown>;
  washing_machine?: Record<string, SpecValue | unknown>;
  air_conditioner?: Record<string, SpecValue | unknown>;
  dryer?: Record<string, SpecValue | unknown>;
  cooking?: Record<string, SpecValue | unknown>;
  vacuum?: Record<string, SpecValue | unknown>;
  dishwasher?: Record<string, SpecValue | unknown>;
  accessory?: Record<string, SpecValue | unknown>;
  other?: Record<string, SpecValue | unknown>;
}

export interface SamsungProductRecord {
  product_id: string;
  marketing_name: string;
  marketing_name_ar?: string;
  family: string;
  category: string;
  model_numbers: string[];
  primary_model_number?: string;
  region?: string;
  release_date?: string;
  discontinued_date?: string | null;
  country_availability?: string[];
  specifications?: ProductSpecifications;
  egypt: EgyptInfo;
  sources: ProductSource[];
  conflicts?: SpecConflict[];
  DATA_STATUS: DataStatus;
  brand?: string;
  aliases?: string[];
  search_tokens?: string[];
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  schema_version?: string;
}

export interface SamsungKbCatalogMeta {
  product_count: number;
  last_import_at: string | null;
  production_ready: boolean;
  window_from: string;
  window_to: string;
  note?: string;
}

export interface SamsungKbSearchQuery {
  q?: string;
  model_number?: string;
  marketing_name?: string;
  family?: string;
  category?: string;
  year?: number | string;
  region?: string;
  egypt_available?: TriState;
  egypt_manufactured?: TriState;
  DATA_STATUS?: DataStatus;
  limit?: number;
}

export interface SamsungKbCompareResult {
  product_ids: string[];
  fields: string[];
  matrix: Record<string, Record<string, unknown>>;
  key_differences: string[];
  missing_fields: string[];
}
