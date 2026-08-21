'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Database,
  Search,
  Upload,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  FileJson,
} from 'lucide-react';
import {
  SAMSUNG_KB_CATEGORIES,
  SAMSUNG_KB_CATEGORY_LABELS,
  SAMSUNG_KB_DATE_WINDOW,
  SAMSUNG_KB_PRODUCTION_READY,
  DATA_STATUS,
  TRI_STATE,
} from '../../lib/samsungKb/constants';
import { createEmptyProductRecord, validateProductRecord } from '../../lib/samsungKb/schema';
import {
  deleteSamsungKbProduct,
  getSamsungKbMeta,
  importSamsungKbProducts,
  listSamsungKbConflicts,
  listSamsungKbProducts,
  searchSamsungKbProducts,
  upsertSamsungKbProduct,
  samsungKbImportParsers,
} from '../../services/samsungProductKbService';

const EMPTY_FORM = {
  marketing_name: '',
  family: '',
  category: SAMSUNG_KB_CATEGORIES.MOBILE,
  model_numbers: '',
  primary_model_number: '',
  region: '',
  release_date: '',
  DATA_STATUS: DATA_STATUS.UNVERIFIED,
  egypt_available: TRI_STATE.UNKNOWN,
  egypt_officially_sold: TRI_STATE.UNKNOWN,
  egypt_manufactured_in_egypt: TRI_STATE.UNKNOWN,
  egypt_assembled_in_egypt: TRI_STATE.UNKNOWN,
};

export default function SamsungProductKbPanel({ actor = 'admin' }) {
  const [meta, setMeta] = useState(null);
  const [rows, setRows] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [importText, setImportText] = useState('');

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const [m, list, open] = await Promise.all([
        getSamsungKbMeta(),
        listSamsungKbProducts({ force: true }),
        listSamsungKbConflicts(),
      ]);
      setMeta(m);
      setRows(list);
      setConflicts(open);
      setMessage(
        list.length
          ? `Loaded ${list.length} product record(s). production_ready=${!!m.production_ready}`
          : 'Catalog empty — import verified Samsung product data before production use.',
      );
    } catch (err) {
      setMessage(err?.message || 'Failed to load Samsung KB');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const visible = useMemo(() => {
    if (!q.trim()) return rows.slice(0, 100);
    return rows;
  }, [rows, q]);

  async function runSearch() {
    setBusy(true);
    try {
      const hits = await searchSamsungKbProducts({ q, limit: 100 });
      setRows(hits);
      setMessage(`Search returned ${hits.length} hit(s)`);
    } catch (err) {
      setMessage(err?.message || 'Search failed');
    } finally {
      setBusy(false);
    }
  }

  async function onAdd(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const models = String(form.model_numbers || '')
        .split(/[|;,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const draft = createEmptyProductRecord({
        marketing_name: form.marketing_name,
        family: form.family,
        category: form.category,
        model_numbers: models,
        primary_model_number: form.primary_model_number || models[0],
        region: form.region,
        release_date: form.release_date,
        DATA_STATUS: form.DATA_STATUS,
        egypt: {
          available: form.egypt_available,
          officially_sold: form.egypt_officially_sold,
          manufactured_in_egypt: form.egypt_manufactured_in_egypt,
          assembled_in_egypt: form.egypt_assembled_in_egypt,
        },
        sources: [],
        specifications: {},
      });
      const v = validateProductRecord(draft);
      if (!v.ok) throw new Error(v.errors.join('; '));
      await upsertSamsungKbProduct(draft, { actor });
      setForm(EMPTY_FORM);
      await refresh();
      setMessage(`Saved ${draft.product_id}`);
    } catch (err) {
      setMessage(err?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id) {
    if (!id || !window.confirm(`Delete ${id}?`)) return;
    setBusy(true);
    try {
      await deleteSamsungKbProduct(id);
      await refresh();
    } catch (err) {
      setMessage(err?.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  async function onImportJson() {
    setBusy(true);
    try {
      let payload;
      try {
        payload = JSON.parse(importText);
      } catch {
        throw new Error('Import text is not valid JSON');
      }
      const parsed = samsungKbImportParsers.json(payload);
      if (parsed.errors?.length) {
        setMessage(`Import validation errors: ${parsed.errors.slice(0, 3).map((e) => e.error).join(' | ')}`);
      }
      if (!parsed.products.length) throw new Error('No valid products to import');
      const result = await importSamsungKbProducts(parsed.products, { actor, mode: 'merge' });
      setImportText('');
      await refresh();
      setMessage(`Imported ${result.written} record(s). Total now ${result.product_count}.`);
    } catch (err) {
      setMessage(err?.message || 'Import failed');
    } finally {
      setBusy(false);
    }
  }

  async function onImportFile(file) {
    if (!file) return;
    setBusy(true);
    try {
      const name = file.name.toLowerCase();
      let parsed;
      if (name.endsWith('.csv')) {
        parsed = samsungKbImportParsers.csv(await file.text());
      } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        parsed = await samsungKbImportParsers.excel(await file.arrayBuffer());
      } else {
        parsed = samsungKbImportParsers.json(JSON.parse(await file.text()));
      }
      if (!parsed.products.length) throw new Error('No valid products in file');
      const result = await importSamsungKbProducts(parsed.products, { actor, mode: 'merge' });
      await refresh();
      setMessage(`File import wrote ${result.written} record(s).`);
    } catch (err) {
      setMessage(err?.message || 'File import failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500 flex items-center gap-2">
              <Database className="w-3.5 h-3.5" /> Product Information
            </p>
            <h2 className="text-lg font-black mt-1">Samsung product specs for GOGO</h2>
            <p className="text-xs text-zinc-500 mt-2 max-w-3xl leading-relaxed">
              Window {SAMSUNG_KB_DATE_WINDOW.from} → {SAMSUNG_KB_DATE_WINDOW.to}. Model number is the primary
              identifier. Sold in Egypt ≠ Made in Egypt. production_ready flag stays{' '}
              <span className="text-amber-400">{String(SAMSUNG_KB_PRODUCTION_READY)}</span> until you flip it after
              verified data lands.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:border-green-600"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-black uppercase tracking-widest">
          <div className="rounded-xl bg-black/40 border border-white/5 p-3">
            <p className="text-zinc-600">Products</p>
            <p className="text-xl text-white mt-1">{meta?.product_count ?? rows.length ?? 0}</p>
          </div>
          <div className="rounded-xl bg-black/40 border border-white/5 p-3">
            <p className="text-zinc-600">Open conflicts</p>
            <p className="text-xl text-amber-400 mt-1">{conflicts.length}</p>
          </div>
          <div className="rounded-xl bg-black/40 border border-white/5 p-3">
            <p className="text-zinc-600">Last import</p>
            <p className="text-[11px] text-zinc-300 mt-2 normal-case tracking-normal font-medium">
              {meta?.last_import_at || '—'}
            </p>
          </div>
          <div className="rounded-xl bg-black/40 border border-white/5 p-3">
            <p className="text-zinc-600">Production ready</p>
            <p className="text-xl mt-1">{meta?.production_ready ? 'YES' : 'NO'}</p>
          </div>
        </div>
        {message ? (
          <p className="mt-3 text-xs text-zinc-400 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-amber-500 shrink-0" />
            {message}
          </p>
        ) : null}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={onAdd} className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" /> Add product shell (no invented specs)
          </p>
          <input
            required
            placeholder="Marketing name"
            value={form.marketing_name}
            onChange={(e) => setForm((f) => ({ ...f, marketing_name: e.target.value }))}
            className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-green-600"
          />
          <input
            required
            placeholder="Family (e.g. Galaxy S24)"
            value={form.family}
            onChange={(e) => setForm((f) => ({ ...f, family: e.target.value }))}
            className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-green-600"
          />
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full bg-black border border-white/10 rounded-xl p-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-green-600"
          >
            {Object.entries(SAMSUNG_KB_CATEGORY_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <input
            required
            placeholder="Model numbers (SM-S928B|SM-S928U)"
            value={form.model_numbers}
            onChange={(e) => setForm((f) => ({ ...f, model_numbers: e.target.value }))}
            className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-green-600"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Region"
              value={form.region}
              onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
              className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-green-600"
            />
            <input
              type="date"
              value={form.release_date}
              onChange={(e) => setForm((f) => ({ ...f, release_date: e.target.value }))}
              className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-green-600"
            />
          </div>
          <select
            value={form.DATA_STATUS}
            onChange={(e) => setForm((f) => ({ ...f, DATA_STATUS: e.target.value }))}
            className="w-full bg-black border border-white/10 rounded-xl p-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-green-600"
          >
            {Object.values(DATA_STATUS).map((s) => (
              <option key={s} value={s}>
                DATA_STATUS: {s}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-500">
            {[
              ['egypt_available', 'Egypt available'],
              ['egypt_officially_sold', 'Officially sold'],
              ['egypt_manufactured_in_egypt', 'Made in Egypt'],
              ['egypt_assembled_in_egypt', 'Assembled in Egypt'],
            ].map(([key, label]) => (
              <label key={key} className="space-y-1">
                <span>{label}</span>
                <select
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-black border border-white/10 rounded-xl p-2 text-[10px] text-white outline-none"
                >
                  {Object.values(TRI_STATE).map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-green-700 hover:bg-green-600 py-3 text-[10px] font-black uppercase tracking-widest"
          >
            Save shell record
          </button>
        </form>

        <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Upload className="w-3.5 h-3.5" /> Import JSON / CSV / Excel
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='Paste {"products":[...]} from verified export'
            rows={10}
            className="w-full bg-black border border-white/10 rounded-xl p-3 text-[11px] font-mono outline-none focus:border-green-600"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void onImportJson()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:border-green-600"
            >
              <FileJson className="w-3.5 h-3.5" /> Import pasted JSON
            </button>
            <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:border-green-600 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> File
              <input
                type="file"
                accept=".json,.csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => void onImportFile(e.target.files?.[0])}
              />
            </label>
          </div>
          <p className="text-[10px] text-zinc-600 leading-relaxed">
            Templates: <code className="text-zinc-400">src/data/samsungKb/import-template.json</code> and{' '}
            <code className="text-zinc-400">import-template.csv</code>. Never invent specs in the UI.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search marketing name, SM-…, family, Egypt…"
              className="w-full bg-black border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs outline-none focus:border-green-600"
            />
          </div>
          <button
            type="button"
            onClick={() => void runSearch()}
            className="rounded-xl bg-white/5 border border-white/10 px-4 text-[10px] font-black uppercase tracking-widest"
          >
            Search
          </button>
        </div>

        <div className="overflow-auto max-h-[420px] rounded-xl border border-white/5">
          <table className="w-full text-left text-[11px]">
            <thead className="sticky top-0 bg-black text-[9px] uppercase tracking-widest text-zinc-500">
              <tr>
                <th className="p-2">product_id</th>
                <th className="p-2">Name</th>
                <th className="p-2">Models</th>
                <th className="p-2">Status</th>
                <th className="p-2">Egypt mfg</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.product_id} className="border-t border-white/5">
                  <td className="p-2 font-mono text-zinc-400">{r.product_id}</td>
                  <td className="p-2">{r.marketing_name}</td>
                  <td className="p-2 text-zinc-400">{(r.model_numbers || []).join(', ')}</td>
                  <td className="p-2">{r.DATA_STATUS}</td>
                  <td className="p-2">{r.egypt?.manufactured_in_egypt || 'UNKNOWN'}</td>
                  <td className="p-2">
                    <button
                      type="button"
                      onClick={() => void onDelete(r.product_id)}
                      className="text-red-400 hover:text-red-300"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {!visible.length ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-zinc-600">
                    No products yet. Import a verified dataset.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {conflicts.length ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-100/90 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Open spec conflicts</p>
            {conflicts.slice(0, 20).map((c, i) => (
              <p key={`${c.product_id}-${c.field_path}-${i}`}>
                {c.product_id} · {c.field_path} · {(c.values || []).map((v) => String(v.value)).join(' vs ')}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
