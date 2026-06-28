/**
 * Generates Word + PowerPoint reports for TCS MX role updates (June 2026).
 * Run: node scripts/generate_tcs_mx_updates_report.mjs
 */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  PageBreak,
} from 'docx';
import PptxGenJS from 'pptxgenjs';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '..');

const BLUE = '2563EB';
const DARK = '0F172A';
const GRAY = '64748B';
const PURPLE = '9333EA';

const h1 = (text) =>
  new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
  });

const h2 = (text) =>
  new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
  });

const h3 = (text) =>
  new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
  });

const p = (text, opts = {}) =>
  new Paragraph({
    children: [
      new TextRun({
        text,
        size: 22,
        color: opts.color || DARK,
        bold: opts.bold,
        italics: opts.italics,
      }),
    ],
    spacing: { after: 160 },
    alignment: opts.align || AlignmentType.LEFT,
  });

const bullet = (text) =>
  new Paragraph({
    children: [new TextRun({ text: `• ${text}`, size: 22, color: DARK })],
    spacing: { after: 100 },
    indent: { left: 400 },
  });

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

const tableRow2 = (label, value, shade = false) =>
  new TableRow({
    children: [
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: label, bold: true, size: 20 })],
          }),
        ],
        shading: shade ? { type: ShadingType.CLEAR, color: 'EFF6FF' } : undefined,
        width: { size: 32, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: value, size: 20 })],
          }),
        ],
        shading: shade ? { type: ShadingType.CLEAR, color: 'EFF6FF' } : undefined,
        width: { size: 68, type: WidthType.PERCENTAGE },
      }),
    ],
  });

// ─── WORD ────────────────────────────────────────────────────────────────────

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Calibri', size: 22 } } },
  },
  sections: [
    {
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: 'TCS MX Platform Updates',
              bold: true,
              size: 52,
              color: PURPLE,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 600, after: 160 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Receptionists · Galaxy Consultants · Manual Leaderboard Fixes',
              size: 28,
              color: GRAY,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Samsung Service Operations · June 2026',
              size: 22,
              color: GRAY,
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Commit: 3e985a2 · Deployed to main',
              size: 20,
              color: BLUE,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 800 },
        }),

        pageBreak(),

        h1('1. Executive Summary'),
        p(
          'This release extends the TCS MX division with two new workforce roles — Receptionists and Galaxy Consultants — while keeping the existing Engineers workflow unchanged. Each role has its own data collection, dashboard tab, KPI profile, and configurable manual leaderboard. Several bugs were fixed so engineer dashboard winners (configured by SBA ID) display correctly on the public home page.',
        ),
        p(
          'PQA, TCS DA, and TCS AV divisions were not modified. Engineers under TCS MX retain the same scoring model, Excel template, and Top 6 manual winner configuration.',
          { bold: true },
        ),

        pageBreak(),

        h1('2. What Changed — Overview'),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            tableRow2('Area', 'Change', true),
            tableRow2('TCS MX tabs', 'Three role tabs: Engineers · Receptionists · Galaxy Consultants'),
            tableRow2('Firestore', 'New collections: tcs_mx_receptionists, tcs_mx_galaxy_consultants'),
            tableRow2('Receptionist Excel', 'Dedicated template + upload parser (GSPN ID, Vote for Me, Co.A, etc.)'),
            tableRow2('Dashboard winners', 'Per-role manual leaderboard slots: Engineers 6 · Receptionists 5 · Galaxy 2'),
            tableRow2('Engineer leaderboard', 'Fixed SBA ID matching + winners config loading on public dashboard'),
            tableRow2('Admin portal', 'Role tabs, templates, registry, Dashboard Winners by MX role'),
            tableRow2('Unchanged', 'PQA, TCS DA, TCS AV engineer flows and scoring'),
          ],
        }),
        new Paragraph({ spacing: { after: 200 } }),

        pageBreak(),

        h1('3. TCS MX Role Tabs'),
        h2('3.1 Engineers (unchanged behaviour)'),
        bullet('Same Firestore collection: engineers'),
        bullet('Same Excel template: ENGINEER code, SSR, RRR90, IQC Skip %, etc.'),
        bullet('Manual Dashboard Winners: exactly Top 6 codes per quarter (SBA ID or Engineer Code)'),
        bullet('Quarterly leaderboard driven by configured winner list'),

        h2('3.2 Receptionists (new)'),
        bullet('Firestore collection: tcs_mx_receptionists'),
        bullet('KPIs: Vote for Me, IQC First Time Fail, DRNPS, Exam, Co.A'),
        bullet('Search by GSPN ID (required on manual add)'),
        bullet('Excel template: TCS_MX_Receptionist_Score_Template_2026.xlsx'),
        bullet('Sheet name: TCS MX Receptionist'),
        bullet('Manual winners: up to Top 5 — partial fill allowed (1–5 codes)'),

        h2('3.3 Galaxy Consultants (new)'),
        bullet('Firestore collection: tcs_mx_galaxy_consultants'),
        bullet('Primary KPI: Galaxy consultant tickets'),
        bullet('Manual winners: up to Top 2 — partial fill allowed (1–2 codes)'),
        bullet('Podium and search aligned with other MX roles'),

        pageBreak(),

        h1('4. Dashboard & Manual Leaderboard'),
        p(
          'Admins configure fixed winner codes per quarter under Admin Portal → Dashboard Winners. The public home dashboard shows only those configured people (with podium for ranks 1–3 and list for ranks 4+).',
        ),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            tableRow2('MX Role', 'Winner slots', true),
            tableRow2('Engineers', '6 — all 6 required (or clear all to disable)'),
            tableRow2('Receptionists', '5 — fill 1 to 5 only; empty slots OK'),
            tableRow2('Galaxy Consultants', '2 — fill 1 or 2 only; empty slots OK'),
          ],
        }),
        new Paragraph({ spacing: { after: 200 } }),

        h3('Engineer winner matching fix'),
        bullet('Winner codes are often SBA IDs (e.g. 7886002511), not engineer codes'),
        bullet('Matching now checks: engineerCode, code, sbaId, and gspnId'),
        bullet('Winners config loads on public dashboard visit (not only when admin is logged in)'),
        bullet('Firestore doc key for engineers: Q1-2026-MX (legacy format preserved)'),

        h3('Receptionist / Galaxy without manual config'),
        bullet('If no Dashboard Winners are saved, auto top-N from live data is shown'),
        bullet('N = 5 for receptionists, 6 for galaxy (display cap), 6 for engineers requires config'),

        pageBreak(),

        h1('5. Receptionist Excel Template'),
        p('Headers in the downloadable template:'),
        bullet('Quarter · GSPN ID · ASC_Recep · ASC_CODE · ASC Name · Product'),
        bullet('Vote for Me · IQC First Time Fail · DRNPS · Exam · Co.A · TCS Score'),
        p('Admin path: TCS MX Division → Receptionists tab → Data → Template button.'),
        p(
          'Important: The Template button must be clicked while the Receptionists tab is active. The Engineers template is not used for receptionist uploads.',
          { bold: true },
        ),

        pageBreak(),

        h1('6. Bug Fixes Included'),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            tableRow2('Issue', 'Fix', true),
            tableRow2(
              'Receptionist template downloaded engineer file',
              'Template route checks active MX role tab',
            ),
            tableRow2(
              'Engineer manual winners saved but dashboard empty',
              'SBA ID matching + load winners on public page',
            ),
            tableRow2(
              'Monthly engineer view showed wrong data source',
              'Restored quarterlyRanking for engineer manual list',
            ),
            tableRow2(
              'Duplicate receptionist rows on manual add',
              'Require GSPN ID; registry shows all rows',
            ),
            tableRow2(
              'Delete failed for demo receptionist IDs',
              'Local-only remove for short/ephemeral IDs',
            ),
          ],
        }),
        new Paragraph({ spacing: { after: 200 } }),

        pageBreak(),

        h1('7. Files Added / Modified'),
        h2('New files'),
        bullet('src/lib/tcsMxReceptionistExcel.js — template + parser'),
        bullet('src/lib/tcsMxRoleScoring.js — receptionist & galaxy scoring'),
        bullet('src/lib/tcsWinnersConfig.js — per-role winner slots & validation'),
        bullet('scripts/test-receptionist-template.mjs — template smoke test'),

        h2('Modified files'),
        bullet('src/app/page.js — role tabs, UI, leaderboard, admin winners hub'),
        bullet('src/constants.js — demo seed data for new roles'),
        bullet('src/services/firestoreService.js — new collections + winner validation'),

        pageBreak(),

        h1('8. How to Use (Quick Guide)'),
        h2('Public dashboard'),
        bullet('Open TCS → MX → choose Engineers, Receptionists, or Galaxy Consultants'),
        bullet('Toggle Monthly / Quarterly as before'),
        bullet('Engineers quarterly view shows manual Top 6 when configured in admin'),

        h2('Admin — data'),
        bullet('Select TCS MX Division and the correct role tab first'),
        bullet('Download role-specific template → fill → Upload'),
        bullet('Manage records in Live Registry below'),

        h2('Admin — Dashboard Winners'),
        bullet('Open Dashboard Winners from admin panel'),
        bullet('Set Quarter, Year, Product = MX, MX role = target role'),
        bullet('Enter codes → Save (engineers: 6 codes; receptionists: up to 5; galaxy: up to 2)'),

        pageBreak(),

        h1('9. Testing Checklist'),
        bullet('Engineers: save 6 SBA IDs in Dashboard Winners → verify Q1 MX quarterly podium'),
        bullet('Receptionists: download template → confirm GSPN ID headers → upload sample'),
        bullet('Galaxy: add 1–2 winner codes → verify Top 2 on dashboard'),
        bullet('Confirm PQA and TCS DA/AV still load and rank as before'),
        bullet('Hard refresh (Ctrl+Shift+R) after deploy if old bundle is cached'),

        pageBreak(),

        h1('10. Summary'),
        p(
          'TCS MX now supports three distinct workforce roles with separate data, scoring, and leaderboard configuration. Engineers retain full backward compatibility. Receptionists and Galaxy Consultants are production-ready for data entry, Excel import, search, podium display, and optional manual winner lists.',
        ),
        p(
          'Next recommended step: populate receptionist and galaxy Firestore collections with real Q1 2026 data and configure Dashboard Winners per role.',
          { color: BLUE, bold: true },
        ),

        new Paragraph({
          children: [
            new TextRun({
              text: '— Generated June 2026 · TCS MX Release Report',
              italics: true,
              color: GRAY,
              size: 20,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 600 },
        }),
      ],
    },
  ],
});

const wordPath = path.join(outputDir, 'TCS_MX_Updates_Report.docx');
const wordBuffer = await Packer.toBuffer(doc);
writeFileSync(wordPath, wordBuffer);
console.log('✅ Word report:', wordPath);

// ─── POWERPOINT ──────────────────────────────────────────────────────────────

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.title = 'TCS MX Updates — June 2026';
pptx.author = 'Samsung Service Operations';

const SLIDE_BG = '0A0F1E';
const ACCENT = '9333EA';
const BLUE2 = '3B82F6';
const WHITE = 'FFFFFF';
const MUTED = '94A3B8';
const GREEN = '10B981';
const YELLOW = 'F59E0B';

const addSlide = (title, subtitle = '') => {
  const slide = pptx.addSlide();
  slide.background = { color: SLIDE_BG };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.06,
    fill: { color: ACCENT },
  });
  if (title) {
    slide.addText(title, {
      x: 0.5,
      y: 0.15,
      w: '90%',
      h: 0.7,
      fontSize: 28,
      bold: true,
      color: WHITE,
      fontFace: 'Calibri',
    });
  }
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5,
      y: 0.85,
      w: '90%',
      h: 0.4,
      fontSize: 13,
      color: MUTED,
      fontFace: 'Calibri',
    });
  }
  return slide;
};

const addBullets = (slide, items, x, y, w, h, opts = {}) => {
  slide.addText(
    items.map((t) => ({
      text: t,
      options: { bullet: { type: 'bullet' }, paraSpaceAfter: 6 },
    })),
    {
      x,
      y,
      w,
      h,
      fontSize: opts.fontSize || 13,
      color: opts.color || WHITE,
      fontFace: 'Calibri',
    },
  );
};

// Slide 1 — Cover
{
  const slide = pptx.addSlide();
  slide.background = { color: SLIDE_BG };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.08,
    fill: { color: ACCENT },
  });
  slide.addText('TCS MX', {
    x: 0,
    y: 1.0,
    w: '100%',
    h: 1.0,
    fontSize: 72,
    bold: true,
    color: ACCENT,
    align: 'center',
    fontFace: 'Calibri',
  });
  slide.addText('Platform Updates — June 2026', {
    x: 0,
    y: 2.0,
    w: '100%',
    h: 0.55,
    fontSize: 26,
    bold: true,
    color: WHITE,
    align: 'center',
    fontFace: 'Calibri',
  });
  slide.addText('Receptionists · Galaxy Consultants · Leaderboard Fixes', {
    x: 0,
    y: 2.65,
    w: '100%',
    h: 0.4,
    fontSize: 14,
    color: MUTED,
    align: 'center',
    fontFace: 'Calibri',
  });
  slide.addText('Samsung Service Operations', {
    x: 0,
    y: 4.2,
    w: '100%',
    h: 0.35,
    fontSize: 12,
    color: MUTED,
    align: 'center',
    fontFace: 'Calibri',
  });
}

// Slide 2 — Summary
{
  const slide = addSlide('Executive Summary', 'What this release delivers');
  addBullets(
    slide,
    [
      'Three MX role tabs: Engineers · Receptionists · Galaxy Consultants',
      'Separate Firestore database per role',
      'Receptionist Excel template + upload parser',
      'Per-role manual dashboard winners (6 / 5 / 2 slots)',
      'Engineer SBA ID leaderboard fix — saved winners now appear',
      'PQA, TCS DA, TCS AV unchanged',
    ],
    0.5,
    1.35,
    11.5,
    4.8,
    { fontSize: 14 },
  );
}

// Slide 3 — Three roles
{
  const slide = addSlide('TCS MX — Three Roles', 'Same portal, separate data & scoring');
  const cols = [
    {
      t: 'Engineers',
      color: BLUE2,
      x: 0.3,
      items: [
        'Collection: engineers',
        'Excel: ENGINEER code, SSR, RRR90…',
        'Manual winners: Top 6 (all required)',
        'Behaviour unchanged',
      ],
    },
    {
      t: 'Receptionists',
      color: ACCENT,
      x: 4.2,
      items: [
        'Collection: tcs_mx_receptionists',
        'Search: GSPN ID',
        'KPIs: Vote for Me, IQC, DRNPS, Exam, Co.A',
        'Winners: up to 5 (partial OK)',
      ],
    },
    {
      t: 'Galaxy Consultants',
      color: GREEN,
      x: 8.1,
      items: [
        'Collection: tcs_mx_galaxy_consultants',
        'KPI: Galaxy consultant tickets',
        'Podium + search + admin registry',
        'Winners: up to 2 (partial OK)',
      ],
    },
  ];
  cols.forEach((col) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: col.x,
      y: 1.3,
      w: 3.6,
      h: 4.6,
      fill: { color: '1E293B' },
      line: { color: col.color, width: 2 },
      rectRadius: 0.2,
    });
    slide.addText(col.t, {
      x: col.x + 0.1,
      y: 1.45,
      w: 3.4,
      h: 0.5,
      fontSize: 14,
      bold: true,
      color: col.color,
      fontFace: 'Calibri',
    });
    slide.addText(
      col.items.map((i) => ({ text: i, options: { bullet: true, paraSpaceAfter: 8 } })),
      {
        x: col.x + 0.2,
        y: 2.05,
        w: 3.2,
        h: 3.6,
        fontSize: 11,
        color: WHITE,
        fontFace: 'Calibri',
      },
    );
  });
}

// Slide 4 — Manual leaderboard
{
  const slide = addSlide('Manual Dashboard Winners', 'Admin → Dashboard Winners');
  const rows = [
    ['Engineers', '6 codes', 'SBA ID or Engineer Code', 'All 6 or clear all'],
    ['Receptionists', '5 codes max', 'GSPN ID', '1–5 allowed'],
    ['Galaxy Consultants', '2 codes max', 'Consultant code', '1–2 allowed'],
  ];
  rows.forEach((row, i) => {
    const y = 1.4 + i * 1.35;
    const shade = i % 2 === 0;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.4,
      y,
      w: 11.5,
      h: 1.15,
      fill: { color: shade ? '1E293B' : '151D2E' },
      line: { color: ACCENT, width: 1 },
      rectRadius: 0.12,
    });
    slide.addText(row[0], {
      x: 0.55,
      y: y + 0.15,
      w: 2.5,
      h: 0.85,
      fontSize: 14,
      bold: true,
      color: YELLOW,
      fontFace: 'Calibri',
      valign: 'middle',
    });
    slide.addText(row[1], {
      x: 3.2,
      y: y + 0.15,
      w: 2.2,
      h: 0.85,
      fontSize: 12,
      color: WHITE,
      fontFace: 'Calibri',
      valign: 'middle',
    });
    slide.addText(row[2], {
      x: 5.5,
      y: y + 0.15,
      w: 3.2,
      h: 0.85,
      fontSize: 12,
      color: MUTED,
      fontFace: 'Calibri',
      valign: 'middle',
    });
    slide.addText(row[3], {
      x: 8.8,
      y: y + 0.15,
      w: 2.8,
      h: 0.85,
      fontSize: 11,
      color: GREEN,
      fontFace: 'Calibri',
      valign: 'middle',
    });
  });
  slide.addText('Engineer fix: winner codes matched by SBA ID — dashboard loads config on every visit', {
    x: 0.5,
    y: 5.5,
    w: 11.5,
    h: 0.5,
    fontSize: 12,
    color: BLUE2,
    fontFace: 'Calibri',
    italic: true,
  });
}

// Slide 5 — Receptionist Excel
{
  const slide = addSlide('Receptionist Excel Template', 'Download from Admin → TCS MX → Receptionists → Template');
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.4,
    y: 1.35,
    w: 11.5,
    h: 1.2,
    fill: { color: '1E293B' },
    line: { color: ACCENT, width: 1.5 },
    rectRadius: 0.15,
  });
  slide.addText('File: TCS_MX_Receptionist_Score_Template_2026.xlsx  ·  Sheet: TCS MX Receptionist', {
    x: 0.55,
    y: 1.5,
    w: 11.2,
    h: 0.4,
    fontSize: 12,
    bold: true,
    color: YELLOW,
    fontFace: 'Calibri',
  });
  slide.addText(
    'Quarter | GSPN ID | ASC_Recep | ASC_CODE | ASC Name | Product | Vote for Me | IQC First Time Fail | DRNPS | Exam | Co.A | TCS Score',
    {
      x: 0.55,
      y: 1.95,
      w: 11.2,
      h: 0.5,
      fontSize: 10,
      color: MUTED,
      fontFace: 'Calibri',
    },
  );
  addBullets(
    slide,
    [
      'Must select Receptionists tab before clicking Template',
      'GSPN ID is required for each receptionist record',
      'Upload uses dedicated parser — not the engineer Excel layout',
    ],
    0.5,
    2.85,
    11.3,
    2.5,
    { fontSize: 13 },
  );
}

// Slide 6 — Bug fixes
{
  const slide = addSlide('Bug Fixes', 'Issues resolved in this release');
  const fixes = [
    'Receptionist template was downloading engineer file → role-aware template button',
    'Engineer winners saved in admin but empty on dashboard → SBA ID matching + public config load',
    'Engineer monthly view regression → restored quarterly manual winner source',
    'Receptionist manual add duplicates → require GSPN ID, show full registry',
    'Demo receptionist delete errors → local-only remove for short IDs',
  ];
  fixes.forEach((text, i) => {
    const y = 1.35 + i * 0.95;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.4,
      y,
      w: 11.5,
      h: 0.78,
      fill: { color: '1E293B' },
      line: { color: GREEN, width: 1 },
      rectRadius: 0.1,
    });
    slide.addText(`✓  ${text}`, {
      x: 0.55,
      y: y + 0.12,
      w: 11.2,
      h: 0.55,
      fontSize: 12,
      color: WHITE,
      fontFace: 'Calibri',
    });
  });
}

// Slide 7 — Admin workflow
{
  const slide = addSlide('Admin Workflow', 'Step-by-step');
  const steps = [
    { n: '1', t: 'Select TCS MX + role tab', d: 'Engineers / Receptionists / Galaxy' },
    { n: '2', t: 'Data tab', d: 'Template → Upload → Registry' },
    { n: '3', t: 'Dashboard Winners', d: 'Quarter · MX · Role · Codes → Save' },
    { n: '4', t: 'Verify public dashboard', d: 'Hard refresh · Quarterly view · MX tab' },
  ];
  steps.forEach((s, i) => {
    const x = 0.35 + (i % 2) * 5.9;
    const y = 1.35 + Math.floor(i / 2) * 2.4;
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.15,
      y: y + 0.15,
      w: 0.55,
      h: 0.55,
      fill: { color: ACCENT },
    });
    slide.addText(s.n, {
      x: x + 0.15,
      y: y + 0.15,
      w: 0.55,
      h: 0.55,
      fontSize: 16,
      bold: true,
      color: WHITE,
      align: 'center',
      valign: 'middle',
      fontFace: 'Calibri',
    });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.85,
      y,
      w: 4.9,
      h: 1.9,
      fill: { color: '1E293B' },
      line: { color: BLUE2, width: 1 },
      rectRadius: 0.15,
    });
    slide.addText(s.t, {
      x: x + 1.0,
      y: y + 0.2,
      w: 4.6,
      h: 0.45,
      fontSize: 14,
      bold: true,
      color: WHITE,
      fontFace: 'Calibri',
    });
    slide.addText(s.d, {
      x: x + 1.0,
      y: y + 0.7,
      w: 4.6,
      h: 1.0,
      fontSize: 11,
      color: MUTED,
      fontFace: 'Calibri',
    });
  });
}

// Slide 8 — Unchanged
{
  const slide = addSlide('What Did NOT Change', 'Stability guarantee');
  addBullets(
    slide,
    [
      'PQA MX and PQA CE — scoring, Excel, partner ranking',
      'TCS DA and TCS AV engineer workflows',
      'Engineer KPI formula and tier badges',
      'SCORA Challenge / Live Quiz modules',
      'Existing engineer Firestore records and winner doc format (Q1-2026-MX)',
    ],
    0.5,
    1.35,
    11.5,
    4.5,
    { fontSize: 14, color: GREEN },
  );
}

// Slide 9 — Testing
{
  const slide = addSlide('Testing Checklist', 'After deploy');
  addBullets(
    slide,
    [
      'Engineers: 6 SBA IDs in Dashboard Winners → Q1 MX quarterly podium',
      'Receptionists: download template → upload → search by GSPN ID',
      'Galaxy: 1–2 winner codes → Top 2 on dashboard',
      'Confirm PQA / DA / AV still work',
      'Ctrl+Shift+R if cached old JavaScript bundle',
    ],
    0.5,
    1.35,
    11.5,
    4.5,
    { fontSize: 14 },
  );
}

// Slide 10 — Close
{
  const slide = pptx.addSlide();
  slide.background = { color: SLIDE_BG };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.08,
    fill: { color: ACCENT },
  });
  slide.addText('TCS MX — Ready for Production Data', {
    x: 0,
    y: 1.5,
    w: '100%',
    h: 0.7,
    fontSize: 32,
    bold: true,
    color: WHITE,
    align: 'center',
    fontFace: 'Calibri',
  });
  slide.addText(
    'Populate receptionist & galaxy collections · Configure winners per role · Monitor engineer leaderboard',
    {
      x: 0.8,
      y: 2.5,
      w: 11.5,
      h: 0.8,
      fontSize: 14,
      color: MUTED,
      align: 'center',
      fontFace: 'Calibri',
    },
  );
  slide.addText('Commit 3e985a2 · June 2026', {
    x: 0,
    y: 5.2,
    w: '100%',
    h: 0.35,
    fontSize: 12,
    color: MUTED,
    align: 'center',
    fontFace: 'Calibri',
  });
}

const pptPath = path.join(outputDir, 'TCS_MX_Updates_Report.pptx');
await pptx.writeFile({ fileName: pptPath });
console.log('✅ PowerPoint report:', pptPath);
