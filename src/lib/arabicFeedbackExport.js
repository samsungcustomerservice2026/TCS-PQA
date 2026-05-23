import * as XLSX from 'xlsx';
import {
  buildArabicFeedbackAnalytics,
  describeFeedbackFilters,
  normalizeFeedbackRow,
} from './arabicFeedbackAnalytics';

function buildResponseRows(feedbacks) {
  return feedbacks
    .slice()
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .map((raw, idx) => {
      const item = normalizeFeedbackRow(raw);
      return {
        '#': idx + 1,
        'الاسم / Name': item.fullName,
        'الهاتف / Phone': item.phoneNumber,
        'الشركة / Company': item.company,
        'المنتج / Product': item.product,
        'المنصب / Position': item.position,
        'الرسالة / Message': item.message,
        'تاريخ الإرسال / Submitted At': item.createdAt || '',
        'وضع التطبيق / App Mode': item.appMode || '',
        'النموذج / Form': item.formVersion || (item.rating != null ? 'legacy_rating' : ''),
        Verified: item.verified === true ? 'Yes' : item.verified === false ? 'No' : '',
      };
    });
}

function buildSummaryRows(filters, analytics, totalLoaded) {
  return [
    { Metric: 'Export generated', Value: new Date().toISOString() },
    { Metric: 'Filters applied', Value: describeFeedbackFilters(filters) },
    { Metric: 'Total in database', Value: totalLoaded },
    { Metric: 'Matching filters', Value: analytics.total },
    { Metric: '', Value: '' },
    { Metric: 'Breakdown', Value: 'See By Product / By Company / By Date sheets' },
  ];
}

function buildCountRows(title, items) {
  return items.map((item) => ({
    [title]: item.name,
    Count: item.count,
  }));
}

export function buildArabicFeedbackWorkbook(feedbacks, filters, totalLoaded) {
  const analytics = buildArabicFeedbackAnalytics(feedbacks);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(buildSummaryRows(filters, analytics, totalLoaded)),
    'Analysis Summary'
  );

  if (analytics.byProduct.length) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(buildCountRows('Product', analytics.byProduct)),
      'By Product'
    );
  }

  if (analytics.byCompany.length) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(buildCountRows('Company', analytics.byCompany)),
      'By Company'
    );
  }

  if (analytics.byDay.length) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(analytics.byDay.map((d) => ({ Date: d.day, Submissions: d.count }))),
      'By Date'
    );
  }

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(buildResponseRows(feedbacks)), 'Responses');

  const stamp = new Date().toISOString().slice(0, 10);
  const filterBits = [];
  if (filters.dateFrom) filterBits.push(`from-${filters.dateFrom}`);
  if (filters.dateTo) filterBits.push(`to-${filters.dateTo}`);
  if (filters.product && filters.product !== 'ALL') filterBits.push('prod');
  if (filters.company && filters.company !== 'ALL') filterBits.push('co');
  const suffix = filterBits.length ? `_${filterBits.join('_')}` : '';
  const fileName = `tcs_arabic_feedback_${stamp}${suffix}.xlsx`;

  return { wb, fileName, count: feedbacks.length, analytics };
}

export function downloadArabicFeedbackWorkbook(feedbacks, filters, totalLoaded) {
  const { wb, fileName, count, analytics } = buildArabicFeedbackWorkbook(feedbacks, filters, totalLoaded);
  XLSX.writeFile(wb, fileName);
  return { fileName, count, analytics };
}
