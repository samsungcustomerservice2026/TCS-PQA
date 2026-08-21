'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { RefreshCw, Download, Filter, X } from 'lucide-react';
import { getSamsungAcademySurveys } from '../../services/firestoreService';
import {
  buildSamsungAcademySurveyAnalytics,
  filterSamsungAcademySurveys,
  getSurveyFilterOptions,
  SURVEY_RATING_FIELDS,
} from '../../lib/samsungAcademySurveyAnalytics';
import { downloadSamsungAcademySurveyWorkbook } from '../../lib/samsungAcademySurveyExport';
import {
  StudioStatGrid,
  StudioPanel,
  StudioHBars,
  StudioWave,
  StudioDonut,
  StudioEgyptGeoMap,
  StudioRadar,
} from './reportStudio/ReportStudio';

const DEFAULT_FILTERS = {
  dateFrom: '',
  dateTo: '',
  location: 'ALL',
  product: 'ALL',
};

const selectClass =
  'w-full bg-black border border-white/10 rounded-xl p-2.5 text-[11px] font-black text-white outline-none focus:border-emerald-500/50';

const datePickerClass = 'w-full [&_.ant-picker]:w-full [&_.ant-picker]:rounded-xl [&_.ant-picker]:border-white/10 [&_.ant-picker]:bg-black [&_.ant-picker-input>input]:text-[11px] [&_.ant-picker-input>input]:font-bold';

function BandStack({ bands, answered }) {
  const total = answered || bands.Dissatisfied + bands.Neutral + bands.Satisfied;
  if (!total) return <p className="text-[9px] text-zinc-600">—</p>;
  const pct = (n) => `${Math.round((n / total) * 100)}%`;
  return (
    <div className="flex h-2 rounded-full overflow-hidden border border-white/5">
      <div className="bg-zinc-600 report-studio-hbar" style={{ width: pct(bands.Dissatisfied) }} title={`Dissatisfied: ${bands.Dissatisfied}`} />
      <div className="bg-zinc-400 report-studio-hbar" style={{ width: pct(bands.Neutral) }} title={`Neutral: ${bands.Neutral}`} />
      <div className="bg-zinc-200 report-studio-hbar" style={{ width: pct(bands.Satisfied) }} title={`Satisfied: ${bands.Satisfied}`} />
    </div>
  );
}

export default function SamsungAcademySurveyDashboard({ message, onExported, allowExport = true }) {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [surveys, setSurveys] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getSamsungAcademySurveys();
      setSurveys(data);
    } catch (e) {
      console.error(e);
      message?.error?.('Failed to load survey responses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filterOptions = useMemo(() => getSurveyFilterOptions(surveys), [surveys]);

  const filteredSurveys = useMemo(
    () => filterSamsungAcademySurveys(surveys, filters),
    [surveys, filters]
  );

  const analytics = useMemo(
    () => buildSamsungAcademySurveyAnalytics(filteredSurveys),
    [filteredSurveys]
  );

  const hasActiveFilters =
    !!filters.dateFrom ||
    !!filters.dateTo ||
    filters.location !== 'ALL' ||
    filters.product !== 'ALL';

  const toDayKey = (d) => (d && d.isValid() ? d.format('YYYY-MM-DD') : '');

  const handleExport = async () => {
    if (!filteredSurveys.length) {
      message?.warning?.('No responses match the current filters.');
      return;
    }
    setExporting(true);
    try {
      const { fileName, count } = downloadSamsungAcademySurveyWorkbook(
        filteredSurveys,
        filters,
        surveys.length
      );
      message?.success?.(`Exported ${count} responses to ${fileName}`);
      onExported?.({
        count,
        totalLoaded: surveys.length,
        filters: { ...filters },
        fileName,
      });
    } catch (e) {
      console.error(e);
      message?.error?.('Failed to export survey.');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-emerald-500/90">Samsung Academy</p>
          <h3 className="text-lg font-black text-white uppercase tracking-tight">Survey analysis</h3>
          <p className="text-[10px] text-zinc-500 font-medium mt-1">
            Egypt regions include Cairo, Alexandria, Assiut, and Tanta. Charts, geo map, and export use the same filters.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-white hover:bg-white/5 disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {allowExport && (
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || loading || !filteredSurveys.length}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest text-emerald-200 hover:bg-emerald-600/30 disabled:opacity-40"
          >
            {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export filtered Excel
          </button>
          )}
        </div>
      </div>

      {!loading && surveys.length > 0 && (
        <div className="rounded-[1.5rem] border border-white/10 bg-zinc-900/50 p-4 md:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" /> Filters
            </p>
            <p className="text-[10px] font-bold text-zinc-400">
              Showing <span className="text-white">{filteredSurveys.length}</span> of{' '}
              <span className="text-zinc-300">{surveys.length}</span> responses
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className={`space-y-1.5 ${datePickerClass}`}>
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">From date</label>
              <DatePicker
                value={filters.dateFrom ? dayjs(filters.dateFrom) : null}
                onChange={(d) => updateFilter('dateFrom', toDayKey(d))}
                format="DD MMM YYYY"
                placeholder="Pick start date"
                allowClear
                className="w-full"
                disabledDate={(current) => {
                  if (!filters.dateTo || !current) return false;
                  return current.format('YYYY-MM-DD') > filters.dateTo;
                }}
              />
            </div>
            <div className={`space-y-1.5 ${datePickerClass}`}>
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">To date</label>
              <DatePicker
                value={filters.dateTo ? dayjs(filters.dateTo) : null}
                onChange={(d) => updateFilter('dateTo', toDayKey(d))}
                format="DD MMM YYYY"
                placeholder="Pick end date"
                allowClear
                className="w-full"
                disabledDate={(current) => {
                  if (!filters.dateFrom || !current) return false;
                  return current.format('YYYY-MM-DD') < filters.dateFrom;
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Location</label>
              <select
                value={filters.location}
                onChange={(e) => updateFilter('location', e.target.value)}
                className={selectClass}
              >
                <option value="ALL">All locations</option>
                {filterOptions.locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Product</label>
              <select
                value={filters.product}
                onChange={(e) => updateFilter('product', e.target.value)}
                className={selectClass}
              >
                <option value="ALL">All products</option>
                {filterOptions.products.map((prod) => (
                  <option key={prod} value={prod}>
                    {prod}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-[10px] font-black uppercase tracking-widest text-zinc-600">Loading survey data…</div>
      ) : surveys.length === 0 ? (
        <div className="py-16 text-center rounded-[2rem] border border-white/10 bg-zinc-900/40">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">No survey responses yet</p>
          <p className="text-[10px] text-zinc-600 mt-2">Share the public survey link to collect feedback.</p>
        </div>
      ) : filteredSurveys.length === 0 ? (
        <div className="py-16 text-center rounded-[2rem] border border-amber-500/20 bg-amber-950/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-300">No responses match these filters</p>
          <p className="text-[10px] text-zinc-500 mt-2">Adjust dates, location, or product and try again.</p>
        </div>
      ) : (
        <>
          <div className="report-studio space-y-5">
            <StudioStatGrid
              items={[
                { label: 'Responses', value: analytics.total },
                {
                  label: 'Avg score',
                  text: analytics.overallAverage != null ? String(analytics.overallAverage) : '—',
                },
                { label: 'Fully satisfied', value: analytics.satisfiedRate, suffix: '%' },
                {
                  label: 'Egypt cities',
                  text: String((analytics.geo?.pins || []).filter((p) => p.count > 0).length || 0),
                },
              ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <StudioPanel title="Egypt activity map · academy cities">
                <StudioEgyptGeoMap
                  pins={analytics.geo?.pins || []}
                  other={analytics.geo?.other || 0}
                  countryLabel="Egypt"
                />
              </StudioPanel>
              <StudioPanel title="Score radar (1–10)">
                <StudioRadar
                  axes={(analytics.questionStats || []).map((q) => ({
                    key: q.key,
                    label: q.label,
                    value: q.average,
                  }))}
                  maxValue={10}
                />
              </StudioPanel>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <StudioPanel title="By academy location">
                <StudioHBars
                  items={
                    analytics.byLocationEn?.length
                      ? analytics.byLocationEn.map((r) => ({
                          name: `${r.name}${r.ar ? ` · ${r.ar}` : ''}`,
                          count: r.count,
                        }))
                      : analytics.byLocation
                  }
                />
              </StudioPanel>
              <StudioPanel title="By product">
                <StudioHBars items={analytics.byProduct} />
              </StudioPanel>
            </div>

            {analytics.byDay.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <StudioPanel title="Submissions wave">
                  <StudioWave
                    primary={analytics.byDay.slice(-14).map((d) => d.count)}
                    primaryLabel="Responses"
                  />
                </StudioPanel>
                <StudioPanel title="Satisfaction bands">
                  <StudioDonut
                    centerValue={analytics.total}
                    centerLabel="Responses"
                    segments={(() => {
                      const bands = (analytics.questionStats || []).reduce(
                        (acc, q) => {
                          acc.Satisfied += q.bands?.Satisfied || 0;
                          acc.Neutral += q.bands?.Neutral || 0;
                          acc.Dissatisfied += q.bands?.Dissatisfied || 0;
                          return acc;
                        },
                        { Satisfied: 0, Neutral: 0, Dissatisfied: 0 },
                      );
                      return [
                        { label: 'Satisfied', value: bands.Satisfied, color: '#d4d4d8' },
                        { label: 'Neutral', value: bands.Neutral, color: '#71717a' },
                        { label: 'Dissatisfied', value: bands.Dissatisfied, color: '#52525b' },
                      ];
                    })()}
                  />
                </StudioPanel>
              </div>
            )}

            {analytics.byDay.length > 0 && (
              <StudioPanel title="Submissions over time">
                <StudioHBars
                  items={analytics.byDay.map((d) => ({ name: d.day, count: d.count }))}
                  maxBars={14}
                />
              </StudioPanel>
            )}
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-zinc-950/70 p-6 space-y-5 relative overflow-hidden report-studio-panel">
            <div className="report-studio-grid" aria-hidden />
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 relative z-[1]">Question scores (1–10)</p>
            <div className="space-y-4 relative z-[1]">
              {analytics.questionStats.map((q) => (
                <div key={q.key} className="space-y-2 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-[10px] font-bold text-zinc-300">{q.label}</span>
                    <span className="text-sm font-black text-white italic">{q.average ?? '—'}</span>
                  </div>
                  <BandStack bands={q.bands} answered={q.answered} />
                  <div className="flex gap-3 text-[8px] font-black uppercase tracking-widest">
                    <span className="text-red-400">Dissatisfied {q.bands.Dissatisfied}</span>
                    <span className="text-amber-300">Neutral {q.bands.Neutral}</span>
                    <span className="text-emerald-400">Satisfied {q.bands.Satisfied}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-zinc-900/40 p-6 overflow-x-auto">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-4">
              Filtered submissions ({Math.min(filteredSurveys.length, 50)} shown)
            </p>
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="text-zinc-500 uppercase tracking-widest border-b border-white/5">
                  <th className="pb-2 pr-3">Name</th>
                  <th className="pb-2 pr-3">Location</th>
                  <th className="pb-2 pr-3">Product</th>
                  {SURVEY_RATING_FIELDS.map((f) => (
                    <th key={f.key} className="pb-2 pr-2 text-center" title={f.label}>
                      {f.label.split(' ')[0]}
                    </th>
                  ))}
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredSurveys
                  .slice()
                  .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
                  .slice(0, 50)
                  .map((r) => (
                    <tr key={r.id} className="border-b border-white/5 text-zinc-300">
                      <td className="py-2 pr-3 font-bold text-white">{r.fullName || '—'}</td>
                      <td className="py-2 pr-3">{r.academyLocation || '—'}</td>
                      <td className="py-2 pr-3">{r.product || '—'}</td>
                      {SURVEY_RATING_FIELDS.map((f) => (
                        <td key={f.key} className="py-2 pr-2 text-center font-black">
                          {r[f.key] || '—'}
                        </td>
                      ))}
                      <td className="py-2 text-zinc-500">{String(r.createdAt || '').slice(0, 10)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
