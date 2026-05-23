import * as XLSX from 'xlsx';

const DEFAULT_FUNNEL = {
  promoShown: 0,
  promoDismissed: 0,
  opened: 0,
  started: 0,
  abandoned: 0,
  completed: 0,
};

function funnelRows(label, funnel = {}) {
  const f = { ...DEFAULT_FUNNEL, ...funnel };
  return [
    { Section: label, Step: 'Promo shown', Count: f.promoShown },
    { Section: label, Step: 'Dismissed (neglected)', Count: f.promoDismissed },
    { Section: label, Step: 'Opened form', Count: f.opened },
    { Section: label, Step: 'Started filling', Count: f.started },
    { Section: label, Step: 'Abandoned (no submit)', Count: f.abandoned },
    { Section: label, Step: 'Completed', Count: f.completed },
    {
      Section: label,
      Step: 'Completion rate % (of opens)',
      Count: f.opened ? Math.round((f.completed / f.opened) * 100) : 0,
    },
  ];
}

function dailyMapRows(map = {}, valueLabel = 'Count') {
  return Object.entries(map || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ Date: date, [valueLabel]: count }));
}

/**
 * Build and download a multi-sheet analytics workbook.
 * @param {object} analyticsSummary
 * @param {object} [options]
 * @param {Array} [options.recentLogs] optional filtered SURVEY/FEEDBACK log rows
 */
export function exportAnalyticsReport(analyticsSummary, options = {}) {
  if (!analyticsSummary) return false;

  const wb = XLSX.utils.book_new();
  const eng = analyticsSummary.visitorEngagement || {};
  const survey = { ...DEFAULT_FUNNEL, ...analyticsSummary.surveyFunnel };
  const feedback = { ...DEFAULT_FUNNEL, ...analyticsSummary.feedbackFunnel };

  const summaryRows = [
    { Metric: 'Total visitor hits', Value: analyticsSummary.visitorHits ?? 0 },
    { Metric: 'Total admin logins', Value: analyticsSummary.adminLogins ?? 0 },
    { Metric: 'Visitor sessions', Value: analyticsSummary.visitorSessions ?? 0 },
    { Metric: 'Avg visitor session (ms)', Value: analyticsSummary.avgVisitorSessionMs ?? 0 },
    { Metric: 'Total visitor clicks', Value: eng.visitorClicks ?? eng.totalClicks ?? 0 },
    { Metric: 'Offline events', Value: eng.offlineEvents ?? 0 },
    { Metric: 'Lag events', Value: eng.lagEvents ?? 0 },
    { Metric: 'TCS visitor hits', Value: analyticsSummary.visitorHitsTCS ?? 0 },
    { Metric: 'PQA visitor hits', Value: analyticsSummary.visitorHitsPQA ?? 0 },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Summary');

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet([
      ...funnelRows('Samsung Academy Survey', survey),
      ...funnelRows('Arabic Feedback', feedback),
    ]),
    'Survey & Feedback'
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(dailyMapRows(analyticsSummary.dailyVisitorHits, 'Visitors')),
    'Daily Visitors'
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(dailyMapRows(analyticsSummary.dailyAdminLogins, 'Admin logins')),
    'Daily Admin Logins'
  );

  const dailyEng = analyticsSummary.dailyEngagement || {};
  const dailyEngRows = Object.entries(dailyEng)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([date, metrics]) =>
      Object.entries(metrics || {}).map(([key, val]) => ({
        Date: date,
        Metric: key,
        Count: val,
      }))
    );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(dailyEngRows.length ? dailyEngRows : [{ Date: '', Metric: 'No daily engagement yet', Count: 0 }]),
    'Daily Engagement'
  );

  if (options.recentLogs?.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(options.recentLogs), 'Survey Feedback Logs');
  }

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `scora_analytics_${stamp}.xlsx`);
  return true;
}
