import * as XLSX from 'xlsx';
import {
  SURVEY_RATING_FIELDS,
  surveyRateBandEn,
  buildSamsungAcademySurveyAnalytics,
  describeSurveyFilters,
} from './samsungAcademySurveyAnalytics';

function buildResponseRows(surveys) {
  return surveys
    .slice()
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .map((item, idx) => {
      const row = {
        '#': idx + 1,
        Name: item.fullName || '',
        Phone: item.phoneNumber || '',
        Company: item.company || '',
        Product: item.product || '',
        'Academy Location': item.academyLocation || '',
        'Content Valuable': item.contentValue || '',
        'Content Band': surveyRateBandEn(item.contentValue) || '',
        'Trainer Clear & Effective': item.trainerClarity || '',
        'Trainer Band': surveyRateBandEn(item.trainerClarity) || '',
        'Need More Sessions': item.needMoreSessions || '',
        'Sessions Band': surveyRateBandEn(item.needMoreSessions) || '',
        'Training Period Suitable': item.periodSuitable || '',
        'Period Band': surveyRateBandEn(item.periodSuitable) || '',
        'Place & Accommodation': item.placeAccommodation || '',
        'Place Band': surveyRateBandEn(item.placeAccommodation) || '',
        Notes: item.notes || '',
        'Submitted At': item.createdAt || '',
        'Source App Mode': item.appMode || '',
      };
      const ratings = SURVEY_RATING_FIELDS.map((f) => parseInt(String(item[f.key] ?? ''), 10)).filter((n) => Number.isFinite(n));
      row['Overall Avg (5 Q)'] =
        ratings.length > 0 ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)) : '';
      return row;
    });
}

function buildAnalysisSummaryRows(filters, analytics, totalLoaded) {
  return [
    { Metric: 'Export generated', Value: new Date().toISOString() },
    { Metric: 'Filters applied', Value: describeSurveyFilters(filters) },
    { Metric: 'Total in database', Value: totalLoaded },
    { Metric: 'Matching filters', Value: analytics.total },
    { Metric: 'Overall average score (1–10)', Value: analytics.overallAverage ?? '—' },
    { Metric: 'Fully satisfied rate (%)', Value: analytics.satisfiedRate },
    { Metric: '', Value: '' },
    { Metric: 'Question', Value: 'Average' },
    ...analytics.questionStats.map((q) => ({
      Metric: q.label,
      Value: q.average ?? '—',
    })),
    { Metric: '', Value: '' },
    { Metric: 'Dissatisfied / Neutral / Satisfied', Value: '(per question — see Question Breakdown sheet)' },
  ];
}

function buildQuestionBreakdownRows(analytics) {
  const rows = [];
  for (const q of analytics.questionStats) {
    rows.push({
      Question: q.label,
      Average: q.average ?? '—',
      Dissatisfied: q.bands.Dissatisfied,
      Neutral: q.bands.Neutral,
      Satisfied: q.bands.Satisfied,
      Answered: q.answered,
    });
  }
  return rows;
}

function buildCountRows(title, items) {
  return items.map((item) => ({
    [title]: item.name,
    Count: item.count,
  }));
}

/**
 * Build multi-sheet workbook aligned with dashboard analysis.
 * @returns {{ wb: import('xlsx').WorkBook, fileName: string, count: number }}
 */
export function buildSamsungAcademySurveyWorkbook(surveys, filters, totalLoaded) {
  const analytics = buildSamsungAcademySurveyAnalytics(surveys);
  const wb = XLSX.utils.book_new();

  const wsSummary = XLSX.utils.json_to_sheet(buildAnalysisSummaryRows(filters, analytics, totalLoaded));
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Analysis Summary');

  const wsQuestions = XLSX.utils.json_to_sheet(buildQuestionBreakdownRows(analytics));
  XLSX.utils.book_append_sheet(wb, wsQuestions, 'Question Breakdown');

  if (analytics.byLocation.length) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(buildCountRows('Location', analytics.byLocation)),
      'By Location'
    );
  }

  if (analytics.byProduct.length) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(buildCountRows('Product', analytics.byProduct)),
      'By Product'
    );
  }

  if (analytics.byDay.length) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        analytics.byDay.map((d) => ({ Date: d.day, Submissions: d.count }))
      ),
      'By Date'
    );
  }

  const wsResponses = XLSX.utils.json_to_sheet(buildResponseRows(surveys));
  XLSX.utils.book_append_sheet(wb, wsResponses, 'Responses');

  const stamp = new Date().toISOString().slice(0, 10);
  const filterBits = [];
  if (filters.dateFrom) filterBits.push(`from-${filters.dateFrom}`);
  if (filters.dateTo) filterBits.push(`to-${filters.dateTo}`);
  if (filters.location && filters.location !== 'ALL') filterBits.push('loc');
  if (filters.product && filters.product !== 'ALL') filterBits.push('prod');
  const suffix = filterBits.length ? `_${filterBits.join('_')}` : '';
  const fileName = `samsung_academy_survey_${stamp}${suffix}.xlsx`;

  return { wb, fileName, count: surveys.length, analytics };
}

export function downloadSamsungAcademySurveyWorkbook(surveys, filters, totalLoaded) {
  const { wb, fileName, count, analytics } = buildSamsungAcademySurveyWorkbook(surveys, filters, totalLoaded);
  XLSX.writeFile(wb, fileName);
  return { fileName, count, analytics };
}
