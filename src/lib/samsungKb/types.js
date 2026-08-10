/**
 * Samsung Product Knowledge Base — TypeScript interfaces (JSDoc + .d.ts companion).
 * Model number is the business key; marketing_name is never the unique id.
 */

/**
 * @typedef {import('./constants').DataStatus} DataStatus
 * @typedef {import('./constants').Confidence} Confidence
 * @typedef {import('./constants').TriState} TriState
 */

/**
 * @typedef {Object} SpecValue
 * @property {unknown} value
 * @property {string} [unit]
 * @property {string} [source]
 * @property {Confidence} [confidence]
 * @property {string} [note]
 */

/**
 * @typedef {Object} ProductSource
 * @property {string} source
 * @property {string} [url]
 * @property {string} [accessed_date]
 * @property {string} [note]
 */

/**
 * @typedef {Object} ManufacturingEvidence
 * @property {string} [source]
 * @property {string} [source_url]
 * @property {string} [source_date]
 * @property {string} [evidence_text]
 * @property {Confidence} [confidence]
 */

/**
 * @typedef {Object} EgyptInfo
 * @property {TriState} available
 * @property {TriState} officially_sold
 * @property {TriState} manufactured_in_egypt
 * @property {TriState} assembled_in_egypt
 * @property {string} [manufacturing_location]
 * @property {string} [manufacturing_period]
 * @property {string} [evidence_source]
 * @property {ManufacturingEvidence[]} [evidence]
 */

/**
 * @typedef {Object} SpecConflict
 * @property {string} field_path
 * @property {Array<{ value: unknown, source?: string, confidence?: Confidence }>} values
 * @property {'OPEN'|'RESOLVED'} status
 * @property {string} [resolved_value]
 * @property {string} [resolved_by]
 * @property {string} [resolved_at]
 * @property {string} [note]
 */

/**
 * Flexible specs bag. Category-specific keys live under nested groups.
 * Phones/tablets/watches/buds/TVs/appliances each use their documented keys;
 * unknown keys are allowed for forward compatibility.
 *
 * @typedef {Object} ProductSpecifications
 * @property {Record<string, SpecValue|unknown>} [network]
 * @property {Record<string, SpecValue|unknown>} [body]
 * @property {Record<string, SpecValue|unknown>} [display]
 * @property {Record<string, SpecValue|unknown>} [platform]
 * @property {Record<string, SpecValue|unknown>} [memory]
 * @property {Record<string, SpecValue|unknown>} [camera]
 * @property {Record<string, SpecValue|unknown>} [sound]
 * @property {Record<string, SpecValue|unknown>} [comms]
 * @property {Record<string, SpecValue|unknown>} [features]
 * @property {Record<string, SpecValue|unknown>} [battery]
 * @property {Record<string, SpecValue|unknown>} [misc]
 * @property {Record<string, SpecValue|unknown>} [watch]
 * @property {Record<string, SpecValue|unknown>} [buds]
 * @property {Record<string, SpecValue|unknown>} [tv]
 * @property {Record<string, SpecValue|unknown>} [refrigerator]
 * @property {Record<string, SpecValue|unknown>} [washing_machine]
 * @property {Record<string, SpecValue|unknown>} [air_conditioner]
 * @property {Record<string, SpecValue|unknown>} [dryer]
 * @property {Record<string, SpecValue|unknown>} [cooking]
 * @property {Record<string, SpecValue|unknown>} [vacuum]
 * @property {Record<string, SpecValue|unknown>} [dishwasher]
 * @property {Record<string, SpecValue|unknown>} [accessory]
 * @property {Record<string, SpecValue|unknown>} [other]
 */

/**
 * @typedef {Object} SamsungProductRecord
 * @property {string} product_id
 * @property {string} marketing_name
 * @property {string} [marketing_name_ar]
 * @property {string} family
 * @property {string} category
 * @property {string[]} model_numbers
 * @property {string} [primary_model_number]
 * @property {string} [region]
 * @property {string} [release_date]
 * @property {string|null} [discontinued_date]
 * @property {string[]} [country_availability]
 * @property {ProductSpecifications} [specifications]
 * @property {EgyptInfo} egypt
 * @property {ProductSource[]} sources
 * @property {SpecConflict[]} [conflicts]
 * @property {DataStatus} DATA_STATUS
 * @property {string} [brand]
 * @property {string[]} [aliases]
 * @property {string[]} [search_tokens]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 * @property {string} [created_by]
 * @property {string} [updated_by]
 * @property {string} [schema_version]
 */

/**
 * @typedef {Object} SamsungKbCatalogMeta
 * @property {number} product_count
 * @property {string|null} last_import_at
 * @property {boolean} production_ready
 * @property {string} window_from
 * @property {string} window_to
 * @property {string} [note]
 */

/**
 * @typedef {Object} SamsungKbSearchQuery
 * @property {string} [q]
 * @property {string} [model_number]
 * @property {string} [marketing_name]
 * @property {string} [family]
 * @property {string} [category]
 * @property {number|string} [year]
 * @property {string} [region]
 * @property {TriState} [egypt_available]
 * @property {TriState} [egypt_manufactured]
 * @property {DataStatus} [DATA_STATUS]
 * @property {number} [limit]
 */

/**
 * @typedef {Object} SamsungKbCompareResult
 * @property {string[]} product_ids
 * @property {string[]} fields
 * @property {Record<string, Record<string, unknown>>} matrix
 * @property {string[]} key_differences
 * @property {string[]} missing_fields
 */

export {};
