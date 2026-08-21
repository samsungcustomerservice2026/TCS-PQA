'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { RefreshCw, Download, Filter, X, MessageSquare } from 'lucide-react';
import { getFeedbacks } from '../../services/firestoreService';
import {
  buildArabicFeedbackAnalytics,
  filterArabicFeedbacks,
  getFeedbackFilterOptions,
} from '../../lib/arabicFeedbackAnalytics';
import { downloadArabicFeedbackWorkbook } from '../../lib/arabicFeedbackExport';
import {
  StudioStatGrid,
  StudioPanel,
  StudioHBars,
  StudioWave,
  StudioDonut,
} from './reportStudio/ReportStudio';

const DEFAULT_FILTERS = {
  dateFrom: '',
  dateTo: '',
  product: 'ALL',
  company: 'ALL',
};

const selectClass =
  'w-full bg-black border border-white/10 rounded-xl p-2.5 text-[11px] font-black text-white outline-none focus:border-purple-500/50';

const datePickerClass =
  'w-full [&_.ant-picker]:w-full [&_.ant-picker]:rounded-xl [&_.ant-picker]:border-white/10 [&_.ant-picker]:bg-black [&_.ant-picker-input>input]:text-[11px] [&_.ant-picker-input>input]:font-bold';

export default function ArabicFeedbackDashboard({ message, onExported, allowExport = true }) {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getFeedbacks();
      setFeedbacks(data);
    } catch (e) {
      console.error(e);
      message?.error?.('Failed to load feedback responses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filterOptions = useMemo(() => getFeedbackFilterOptions(feedbacks), [feedbacks]);

  const filteredFeedbacks = useMemo(
    () => filterArabicFeedbacks(feedbacks, filters),
    [feedbacks, filters]
  );

  const analytics = useMemo(
    () => buildArabicFeedbackAnalytics(filteredFeedbacks),
    [filteredFeedbacks]
  );

  const hasActiveFilters =
    !!filters.dateFrom ||
    !!filters.dateTo ||
    filters.product !== 'ALL' ||
    filters.company !== 'ALL';

  const toDayKey = (d) => (d && d.isValid() ? d.format('YYYY-MM-DD') : '');

  const handleExport = async () => {
    if (!filteredFeedbacks.length) {
      message?.warning?.('No responses match the current filters.');
      return;
    }
    setExporting(true);
    try {
      const { fileName, count } = downloadArabicFeedbackWorkbook(
        filteredFeedbacks,
        filters,
        feedbacks.length
      );
      message?.success?.(`Exported ${count} responses to ${fileName}`);
      onExported?.({
        count,
        totalLoaded: feedbacks.length,
        filters: { ...filters },
        fileName,
      });
    } catch (e) {
      console.error(e);
      message?.error?.('Failed to export feedback.');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => setFilters(DEFAULT_FILTERS);
  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-purple-400/90">TCS Feedback</p>
          <h3 className="text-lg font-black text-white uppercase tracking-tight">Feedback analysis</h3>
          <p className="text-[10px] text-zinc-500 font-medium mt-1">
            Public form is Arabic; admin UI is English. Charts and export use the same filters.
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
            disabled={exporting || loading || !filteredFeedbacks.length}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-[10px] font-black uppercase tracking-widest text-purple-200 hover:bg-purple-600/30 disabled:opacity-40"
          >
            {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export filtered Excel
          </button>
          )}
        </div>
      </div>

      {!loading && feedbacks.length > 0 && (
        <div className="rounded-[1.5rem] border border-white/10 bg-zinc-900/50 p-4 md:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" /> Filters
            </p>
            <p className="text-[10px] font-bold text-zinc-400">
              Showing <span className="text-white">{filteredFeedbacks.length}</span> of{' '}
              <span className="text-zinc-300">{feedbacks.length}</span> responses
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
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Product</label>
              <select value={filters.product} onChange={(e) => updateFilter('product', e.target.value)} className={selectClass}>
                <option value="ALL">All products</option>
                {filterOptions.products.map((prod) => (
                  <option key={prod} value={prod}>
                    {prod}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Company</label>
              <select value={filters.company} onChange={(e) => updateFilter('company', e.target.value)} className={selectClass}>
                <option value="ALL">All companies</option>
                {filterOptions.companies.map((co) => (
                  <option key={co} value={co}>
                    {co}
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
        <div className="py-16 text-center text-[10px] font-black uppercase tracking-widest text-zinc-600">
          Loading feedback…
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="py-16 text-center rounded-[2rem] border border-white/10 bg-zinc-900/40">
          <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">No feedback yet</p>
          <p className="text-[10px] text-zinc-600 mt-2">
            Enable the form under Display; visitors submit in Arabic on the public portal.
          </p>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="py-16 text-center rounded-[2rem] border border-amber-500/20 bg-amber-950/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-300">No responses match these filters</p>
          <p className="text-[10px] text-zinc-500 mt-2">Adjust dates, product, or company and try again.</p>
        </div>
      ) : (
        <>
          <div className="report-studio space-y-5">
            <StudioStatGrid
              cols="grid-cols-2 md:grid-cols-4"
              items={[
                { label: 'Responses', value: analytics.total },
                { label: 'Products', value: analytics.byProduct.length },
                { label: 'Companies', value: analytics.byCompany.length },
                { label: 'Filtered of total', text: `${filteredFeedbacks.length}/${feedbacks.length}` },
              ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <StudioPanel title="By product">
                <StudioHBars items={analytics.byProduct} />
              </StudioPanel>
              <StudioPanel title="By company">
                <StudioHBars items={analytics.byCompany} maxBars={10} />
              </StudioPanel>
            </div>

            {(analytics.byDay || []).length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <StudioPanel title="Submissions wave">
                  <StudioWave
                    primary={analytics.byDay.slice(-14).map((d) => d.count)}
                    primaryLabel="Feedback"
                  />
                </StudioPanel>
                <StudioPanel title="Mix">
                  <StudioDonut
                    centerValue={analytics.total}
                    centerLabel="Total"
                    segments={[
                      {
                        label: 'Top product',
                        value: analytics.byProduct[0]?.count || 0,
                        color: '#d4d4d8',
                      },
                      {
                        label: 'Other products',
                        value: Math.max(
                          0,
                          analytics.total - (analytics.byProduct[0]?.count || 0),
                        ),
                        color: '#71717a',
                      },
                    ]}
                  />
                </StudioPanel>
              </div>
            )}
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-zinc-950/70 p-5 overflow-x-auto relative overflow-hidden report-studio-panel">
            <div className="report-studio-grid" aria-hidden />
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-4 relative z-[1]">Latest responses (Arabic content)</p>
            <table className="w-full text-left text-[10px] relative z-[1]">
              <thead>
                <tr className="text-zinc-500 border-b border-white/10">
                  <th className="py-2 px-2 font-black">Name</th>
                  <th className="py-2 px-2 font-black">Company</th>
                  <th className="py-2 px-2 font-black">Product</th>
                  <th className="py-2 px-2 font-black">Date</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recent.map((row) => (
                  <tr key={row.id || `${row.createdAt}-${row.fullName}`} className="border-b border-white/5 text-zinc-300">
                    <td className="py-2 px-2 font-bold text-white" dir="auto">
                      {row.fullName || '—'}
                    </td>
                    <td className="py-2 px-2" dir="auto">
                      {row.company || '—'}
                    </td>
                    <td className="py-2 px-2" dir="auto">
                      {row.product || '—'}
                    </td>
                    <td className="py-2 px-2 text-zinc-500">{String(row.createdAt || '').slice(0, 10)}</td>
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
