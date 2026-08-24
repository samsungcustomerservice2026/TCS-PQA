/**
 * Focused Word lesson: what a programmer should open first to understand SCORA.
 * Run: node scripts/build-programmer-first-look.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  LevelFormat,
} from 'docx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'SCORA_Programmer_First_Look.docx');

const BLUE = '1428A0';
const DARK = '0B1F3A';
const MUTED = '5A6472';

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, color: DARK })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, color: BLUE })],
  });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 22, color: opts.muted ? MUTED : '1A1A1A', italics: !!opts.italics })],
  });
}
function bullet(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 21 })],
  });
}
function numbered(text) {
  return new Paragraph({
    numbering: { reference: 'numbers', level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 21 })],
  });
}
function cell(text, opts = {}) {
  return new TableCell({
    width: { size: opts.w || 2340, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'D0D7DE' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D0D7DE' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'D0D7DE' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'D0D7DE' },
    },
    shading: opts.header ? { fill: 'E8EEF7' } : undefined,
    children: [
      new Paragraph({
        spacing: { after: 40, before: 40 },
        children: [new TextRun({ text: String(text || ''), bold: !!opts.header, size: opts.header ? 18 : 17, color: DARK })],
      }),
    ],
  });
}
function table(headers, rows) {
  const colW = Math.floor(9360 / headers.length);
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    rows: [
      new TableRow({ children: headers.map((h) => cell(h, { header: true, w: colW })) }),
      ...rows.map((r) => new TableRow({ children: r.map((c) => cell(c, { w: colW })) })),
    ],
  });
}

const doc = new Document({
  creator: 'SCORA',
  title: 'SCORA — Programmer First Look',
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 420, hanging: 240 } } } }],
      },
      {
        reference: 'numbers',
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 420, hanging: 240 } } } }],
      },
    ],
  },
  sections: [
    {
      properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
      children: [
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: 'SAMSUNG EGYPT · SCORA', bold: true, color: BLUE, size: 20 })],
        }),
        new Paragraph({
          spacing: { after: 160 },
          children: [new TextRun({ text: 'Programmer First Look — What to Open First', bold: true, color: DARK, size: 34 })],
        }),
        p(
          'A short teaching guide for programmers joining this codebase. Follow the order below. Do not start by reading ScoraApp.jsx from line 1 to the end.',
        ),

        h1('1. Golden rule'),
        p('Learn in this order: Product clicks → Contracts → Navigation map → Auth → Data/rules → One vertical feature → UI polish.'),
        bullet('Wrong first question: Which CSS class / button component?'),
        bullet('Right first question: What is the current view, and who may change data?'),

        h1('2. Architecture in five boxes'),
        numbered('Browser UI — React components and ScoraApp views.'),
        numbered('Navigation state — a view string (EMPLOYEE_DASHBOARD, TCS_…, ADMIN_…).'),
        numbered('Firebase client — Auth + Firestore + Storage (src/firebase.js).'),
        numbered('Next.js /api routes — privileged server work (TTS, quiz score, admin delete, Excel).'),
        numbered('Security rules — firestore.rules / storage.rules (real gatekeepers).'),
        p('No separate Docker backend. No local SQL database.', { italics: true }),

        h1('3. Do this in order (Day 0)'),
        h2('A) Click the product (10 min)'),
        numbered('npm run dev → http://localhost:3000'),
        numbered('Visitor path: home → TCS/PQA → Search'),
        numbered('Open GoGo and tap chips (guided, not free chat)'),
        numbered('If possible: employee login → My Knowledge → open a tip'),
        p('Why: product map before file map.'),

        h2('B) Read contract files (15 min)'),
        numbered('package.json — scripts and libraries'),
        numbered('AGENTS.md — how to run; Gemini disabled; secrets'),
        numbered('src/firebase.js — project tcs-for-engineers'),
        numbered('src/app/page.js — only mounts <ScoraApp />'),
        p('Why: kills wrong assumptions (separate API server, local DB, live Gemini).'),

        h2('C) Map screens without reading everything (20–30 min)'),
        numbered('Open src/app/ScoraApp.jsx'),
        numbered('Search navigateTo( and view ==='),
        numbered('Write down view names you find'),
        numbered('Find GoGoAssistant and which views hide it'),
        p('Why: ScoraApp is a view state machine. Most “pages” are view branches, not separate Next routes.'),

        h2('D) Find auth boundaries (15 min)'),
        numbered('Employee: useEmployeeAuth / EmployeeAuthModal / EMPLOYEE_DASHBOARD'),
        numbered('Admin: Firebase Auth + bootstrap / admin portal'),
        numbered('Ask which features need login (Knowledge yes; public winners often no)'),

        h2('E) Data before polish (25 min)'),
        numbered('Skim firestore.rules for employees, consultants, employee_progress'),
        numbered('Open src/services/consultantService.js and employeeAuthService.js'),
        numbered('Trace tip file: Storage consultants/{id}/… → assets[] → ConsultantViewer'),

        h1('4. Folder legend'),
        table(
          ['Folder', 'When to open', 'Not for'],
          [
            ['src/app/page.js + ScoraApp.jsx', 'Entry + screen map', 'Tiny UI atoms'],
            ['src/components/', 'GoGo, employee, admin UI', 'Firebase init'],
            ['src/services/', 'Read/write Firestore/Storage', 'Layout/CSS'],
            ['src/lib/', 'Pure logic (GoGo flow, Excel, KPIs)', 'Full screens'],
            ['src/app/api/', 'Secrets / Admin SDK / TTS', 'Public client reads'],
            ['firestore.rules', 'Who can touch data', 'Button styling'],
            ['docs/', 'Human guides', 'Runtime logic'],
          ],
        ),

        h1('5. Best IDE searches'),
        bullet('navigateTo( — screen changes'),
        bullet('view === — what is rendered'),
        bullet('collection( / doc(db — data access'),
        bullet('uploadBytes( — attachments'),
        bullet('GOGO_FLOW / resolveFlowReply( — GoGo allowed answers'),
        bullet('completeConsultantAttempt( — tip finish'),
        bullet('disabled:true / 503 — off or missing secrets'),

        h1('6. Best exercise: trace one story'),
        p('Story: Employee finishes a technical tip.'),
        numbered('EmployeeDashboard lists tips'),
        numbered('ScoraApp → CONSULTANT_VIEWER + consultant id'),
        numbered('ConsultantViewer timer + quiz'),
        numbered('consultantService.completeConsultantAttempt writes progress'),
        numbered('firestore.rules must allow that uid’s progress doc'),
        numbered('Return to profile → GoGo may celebrate'),
        p('When you can explain that path, you understand the Knowledge vertical. Then repeat for TCS Excel import or a GoGo chip.', { italics: true }),

        h1('7. Common traps'),
        bullet('Looking for Express controllers → use route.js + services instead'),
        bullet('Looking for SQL → Firestore documents + rules'),
        bullet('Assuming GoGo = Gemini → guided chips + library (Gemini disabled)'),
        bullet('Editing rules without deploy → live app unchanged'),
        bullet('Reading ScoraApp linearly → search by view / navigateTo'),

        h1('8. 2-hour plan'),
        table(
          ['Time', 'Task', 'Exit criteria'],
          [
            ['0–20m', 'Click visitor + GoGo', 'Explain TCS / PQA / GoGo'],
            ['20–40m', 'AGENTS + firebase + page.js', 'Say where data lives'],
            ['40–70m', 'Map views in ScoraApp', 'List 8 view names'],
            ['70–95m', 'Rules + consultantService', 'Who can finish a tip?'],
            ['95–120m', 'Trace tip finish or GoGo speak', 'Draw path on paper'],
          ],
        ),

        h1('9. Memorize'),
        p(
          'SCORA = Next.js + Firebase. ScoraApp = view state machine. Firestore + rules = data truth. /api = privileged door. GoGo = guided host in a fixed range. Learn navigation and rules first; components second; styling last.',
        ),

        h1('10. File reading order'),
        numbered('package.json + AGENTS.md'),
        numbered('src/firebase.js'),
        numbered('src/app/page.js'),
        numbered('src/app/ScoraApp.jsx (search navigateTo / view ===)'),
        numbered('firestore.rules'),
        numbered('src/services/*'),
        numbered('src/lib/gogoGuideFlow.js'),
        numbered('src/components/employee/*'),
        numbered('src/app/api/**/route.js'),
        numbered('src/components/admin/*'),

        p(`Also see the full stack inventory: docs/SCORA_Stack_and_Programmer_Guide.docx · ${new Date().toISOString().slice(0, 10)}`, {
          muted: true,
          italics: true,
        }),
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, buffer);
console.log(`Wrote ${OUT}`);
