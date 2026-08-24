/**
 * Build SCORA stack + programmer onboarding Word guide.
 * Run: node scripts/build-scora-stack-guide.mjs
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
const OUT = path.join(ROOT, 'docs', 'SCORA_Stack_and_Programmer_Guide.docx');

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

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, color: DARK })],
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text,
        size: 22,
        color: opts.muted ? MUTED : '1A1A1A',
        italics: !!opts.italics,
      }),
    ],
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 21 })],
  });
}

function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'numbers', level },
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
        children: [
          new TextRun({
            text: String(text || ''),
            bold: !!opts.header || !!opts.bold,
            size: opts.header ? 18 : 17,
            color: opts.header ? DARK : '1A1A1A',
          }),
        ],
      }),
    ],
  });
}

function table(headers, rows) {
  const colW = Math.floor(9360 / headers.length);
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: headers.map((h) => cell(h, { header: true, w: colW })),
      }),
      ...rows.map(
        (r) =>
          new TableRow({
            children: r.map((c) => cell(c, { w: colW })),
          }),
      ),
    ],
  });
}

function entry({ name, what, feature, why, brief }) {
  return [
    h3(name),
    p(`What it is: ${what}`),
    p(`Feature(s) it powers: ${feature}`),
    p(`Why we use it: ${why}`),
    p(`Brief: ${brief}`, { muted: true, italics: true }),
  ];
}

const doc = new Document({
  creator: 'SCORA / Cursor',
  title: 'SCORA Stack, Tools & Programmer Guide',
  description:
    'Full inventory of languages, frameworks, cloud services, models, tools, skills, MCPs, and a programmer onboarding path for the SCORA application.',
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: '•',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 420, hanging: 240 } } },
          },
        ],
      },
      {
        reference: 'numbers',
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: '%1.',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 420, hanging: 240 } } },
          },
        ],
      },
    ],
  },
  styles: {
    default: {
      document: {
        styles: [
          {
            id: 'Normal',
            name: 'Normal',
            run: { font: 'Calibri', size: 22 },
          },
        ],
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children: [
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: 'SAMSUNG EGYPT · SCORA',
              bold: true,
              color: BLUE,
              size: 20,
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: 'Full Stack, Tools, Models & Programmer Guide',
              bold: true,
              color: DARK,
              size: 36,
            }),
          ],
        }),
        p(
          'This document lists everything used to build and run SCORA (TCS ranking, PQA, GoGo assistant, Knowledge tips, surveys, Challenge quiz, admin portal): languages, libraries, cloud services, websites, AI models, developer tools, Cursor skills, and MCPs. It also teaches a programmer what to open first to understand the application quickly.',
        ),
        p(`Generated for project: fawzy-project · Firebase project: tcs-for-engineers · Date: ${new Date().toISOString().slice(0, 10)}`, {
          muted: true,
          italics: true,
        }),

        h1('1. How to read this document'),
        p(
          'Two layers appear below. Do not mix them.',
        ),
        bullet(
          'Application runtime — code and services that run for visitors, engineers, and admins in production (Next.js, Firebase, Edge TTS, etc.).',
        ),
        bullet(
          'Build / Cursor agent layer — tools used while developing (Cursor IDE, Firebase MCP, browser MCP, agent skills). These help the developer; they are not required on an end-user phone.',
        ),

        h1('2. Application overview (what SCORA is)'),
        p(
          'SCORA is a single Next.js web app for Samsung Egypt Customer Service. There is no separate Docker backend and no local SQL database. Browser clients talk to Firebase (Auth, Firestore, Storage). Sensitive actions use Next.js API routes with the Firebase Admin SDK when a service-account secret is configured.',
        ),
        h2('Major product areas'),
        table(
          ['Area', 'Who uses it', 'What it does'],
          [
            ['TCS', 'Engineers / visitors', 'Technical Capability Score — MX / DA / AV ranking, search dossiers, winners'],
            ['PQA', 'Partners / centers', 'Partner Quality Award — center ranking and KPI views'],
            ['GoGo', 'Everyone (non-admin screens)', 'Guided EN/AR assistant + voice; Knowledge tip nudges'],
            ['My Knowledge', 'Employees (GSPN login)', 'Technical tips, timers, tip quizzes, progress'],
            ['Admin portal', 'Admins', 'Excel import, Knowledge tips, employees, reports, Challenge host'],
            ['Scora Challenge', 'Quiz players / hosts', 'Live quiz sessions via QR / link'],
            ['Survey & Feedback', 'Visitors', 'Academy survey + Arabic feedback forms'],
          ],
        ),

        h1('3. Languages'),
        ...entry({
          name: 'JavaScript (ES modules)',
          what: 'Primary programming language of the app (React components, Next.js routes, lib/, services/).',
          feature: 'Entire SCORA UI and most API routes.',
          why: 'Team velocity, Next.js App Router ecosystem, one language across client and server.',
          brief: 'JS runs in the browser and on the Node.js server that hosts Next.js.',
        }),
        ...entry({
          name: 'JSX',
          what: 'JavaScript XML — UI markup mixed with JavaScript in .jsx files.',
          feature: 'ScoraApp, GoGoAssistant, EmployeeDashboard, admin panels.',
          why: 'Standard React component syntax.',
          brief: 'Think of JSX as HTML-shaped UI that React turns into real DOM.',
        }),
        ...entry({
          name: 'CSS / Tailwind CSS v4',
          what: 'Styling language / utility CSS framework.',
          feature: 'Dark SCORA look, GoGo dock, responsive layouts, animations helpers.',
          why: 'Fast UI without large custom CSS files; consistent spacing/colors.',
          brief: 'Class names like bg-zinc-950 text-white drive most of the visual design.',
        }),
        ...entry({
          name: 'English + Arabic (content languages)',
          what: 'Human languages for GoGo replies, tip titles, quizzes, surveys.',
          feature: 'GoGo chips/TTS EN↔AR; tip quiz EN/AR; bilingual Knowledge.',
          why: 'Samsung Egypt audience; Egyptian dialect polish for speech.',
          brief: 'Not a coding language — product localization.',
        }),
        ...entry({
          name: 'Firestore Security Rules language',
          what: 'Declarative access-control language for Firestore/Storage.',
          feature: 'Who can read/write employees, tips, progress, admin docs.',
          why: 'Security at the database edge, not only in the UI.',
          brief: 'Deploy with npm run deploy:firestore-rules — repo rules ≠ live until deployed.',
        }),

        h1('4. Frameworks & UI libraries (application)'),
        ...entry({
          name: 'Next.js 16 (App Router)',
          what: 'React full-stack framework (pages, API routes, middleware).',
          feature: 'Hosting UI + /api/* endpoints (quiz, gogo/speak, admin delete, Excel).',
          why: 'One deployable app; server routes for secrets (Admin SDK, TTS).',
          brief: 'src/app holds routes; src/app/api/*/route.js are HTTP handlers.',
        }),
        ...entry({
          name: 'React 19',
          what: 'UI component library.',
          feature: 'All interactive screens (dashboard, GoGo, tip viewer).',
          why: 'Industry standard for rich SPA-like portals.',
          brief: 'Components in src/components and the large ScoraApp.jsx shell.',
        }),
        ...entry({
          name: 'Ant Design (antd)',
          what: 'Enterprise React UI kit (tables, modals, forms, messages).',
          feature: 'Admin tables, imports, confirmations, dense data UIs.',
          why: 'Fast admin tooling without reinventing tables/forms.',
          brief: 'Look for import { Table, Modal, message } from "antd".',
        }),
        ...entry({
          name: 'Framer Motion',
          what: 'Animation library for React.',
          feature: 'Portal transitions, motion stages, polish on branded screens.',
          why: 'Controlled motion without hand-written CSS keyframes everywhere.',
          brief: 'Used where entrance/exit animations matter.',
        }),
        ...entry({
          name: 'Three.js + React Three Fiber + Drei',
          what: '3D graphics stack in the browser.',
          feature: 'ScoraAtmosphere3D / ambient 3D atmosphere on branded surfaces.',
          why: 'Premium visual presence for SCORA branding.',
          brief: 'WebGL scene rendered inside React; not required for KPI logic.',
        }),
        ...entry({
          name: 'Lucide React',
          what: 'Icon set as React components.',
          feature: 'Buttons, nav icons, GoGo chrome icons.',
          why: 'Consistent lightweight icons.',
          brief: 'import { Mic, Send, X } from "lucide-react".',
        }),
        ...entry({
          name: 'Tailwind Merge / CVA / clsx',
          what: 'Small helpers to compose CSS class names safely.',
          feature: 'Conditional styling without class conflicts.',
          why: 'Cleaner component class logic.',
          brief: 'Utility layer under Tailwind.',
        }),

        h1('5. Data, auth & files (application)'),
        ...entry({
          name: 'Firebase Authentication',
          what: 'Google-hosted sign-in service.',
          feature: 'Admin login; employee GSPN/email login for My Knowledge.',
          why: 'Secure identity without custom password stores.',
          brief: 'Client SDK in src/firebase.js; profiles in Firestore.',
        }),
        ...entry({
          name: 'Cloud Firestore',
          what: 'NoSQL document database.',
          feature: 'Engineers, KPIs, tips, progress, GoGo learned Q&A, surveys, quiz sessions.',
          why: 'Realtime-friendly cloud DB matching the app’s document model.',
          brief: 'Collections are the “tables”; documents are the rows.',
        }),
        ...entry({
          name: 'Firebase Storage',
          what: 'Object storage for files.',
          feature: 'Tip PDFs/images under consultants/{id}/…; photos.',
          why: 'Binary assets do not belong inside Firestore docs (except small image fallbacks).',
          brief: 'Rules must allow consultants/ path for uploads.',
        }),
        ...entry({
          name: 'Firebase Admin SDK (server)',
          what: 'Privileged server SDK (service account).',
          feature: 'Quiz scoring, bootstrap admin, employee Auth delete, secure Excel commit paths.',
          why: 'Client SDK cannot safely perform privileged Auth/Firestore ops.',
          brief: 'Needs FIREBASE_SERVICE_ACCOUNT_JSON; else many APIs return 503.',
        }),
        ...entry({
          name: 'xlsx + ExcelJS',
          what: 'Excel read/write libraries.',
          feature: 'TCS/PQA Excel import, attendance/report exports, templates.',
          why: 'Ops teams live in spreadsheets; SCORA must ingest/export them.',
          brief: 'Import pipelines live under src/lib and /api/tcs/import-excel.',
        }),
        ...entry({
          name: 'jose',
          what: 'JWT / JOSE crypto helpers.',
          feature: 'Token verification / secure API auth helpers where used.',
          why: 'Standards-based token handling on the server.',
          brief: 'Server-side security utility.',
        }),
        ...entry({
          name: 'react-qr-code',
          what: 'QR code renderer.',
          feature: 'Scora Challenge join QR for hosts/players.',
          why: 'Fast lobby join without typing long URLs.',
          brief: 'UI-only QR generation.',
        }),

        h1('6. GoGo voice, speech & AI models'),
        p(
          'Important: Smart Gemini chat is intentionally DISABLED in production hardening. Guided chips + library retrieval + Edge TTS still work.',
        ),
        ...entry({
          name: 'Web Speech API (Speech Recognition)',
          what: 'Browser built-in speech-to-text (Chrome/Edge).',
          feature: 'GoGo microphone input (STT).',
          why: 'No paid STT vendor for basic voice ask.',
          brief: 'Client-only; needs microphone=(self) Permissions-Policy.',
        }),
        ...entry({
          name: 'Microsoft Edge neural TTS (node-edge-tts)',
          what: 'Text-to-speech via Edge voices, exposed by /api/gogo/speak.',
          feature: 'GoGo spoken replies EN/AR.',
          why: 'Natural neural voice without shipping Gemini for speech.',
          brief: 'Primary TTS path for GoGo.',
        }),
        ...entry({
          name: 'ElevenLabs TTS (optional)',
          what: 'Commercial neural voice API (optional Arabic path).',
          feature: 'GoGo Arabic speech when ELEVENLABS_ENABLED=true and keys set.',
          why: 'Higher Arabic quality when configured; falls back to Edge.',
          brief: 'Not required for core GoGo.',
        }),
        ...entry({
          name: 'Google Gemini (disabled)',
          what: 'Large language model API (chat / product grounding).',
          feature: 'Would power /api/gogo/chat and product-gemini — currently returns disabled:true.',
          why: 'Disabled for security/cost hardening; guided menu is the safe mode.',
          brief: 'Do not set GEMINI_API_KEY for normal SCORA operation.',
        }),
        ...entry({
          name: 'GoGo guided flow + learned memory',
          what: 'Deterministic chip tree (gogoGuideFlow) + Firestore/local learned Q&A.',
          feature: 'SCORA/TCS/PQA FAQ, Knowledge coach, tip nudges, org/KPI answers.',
          why: 'Reliable answers inside a controlled range without free-form hallucination.',
          brief: 'This is the “model” GoGo uses day-to-day: rules + library, not Gemini.',
        }),

        h1('7. External websites & data sources'),
        ...entry({
          name: 'Firebase Console (console.firebase.google.com)',
          what: 'Google cloud console for project tcs-for-engineers.',
          feature: 'Auth users, Firestore data, Storage files, rules deploy verification.',
          why: 'Operate and debug the live backend.',
          brief: 'Always verify rules are deployed — local firestore.rules ≠ live until deploy.',
        }),
        ...entry({
          name: 'GSMArena (gsmarena.com)',
          what: 'Public phone specs website (optional scrape path).',
          feature: 'Historical/optional product enrichment for GoGo product tools.',
          why: 'Fallback catalog enrichment; brand-guarded to Samsung pages only.',
          brief: 'User-facing GoGo copy should not advertise GSMArena as the source.',
        }),
        ...entry({
          name: 'Samsung.com / news.samsung.com (reference)',
          what: 'Official Samsung product / news sites.',
          feature: 'Grounding guidance for positive Samsung product talk (when AI enabled).',
          why: 'Prefer official brand sources over random web chatter.',
          brief: 'Policy/content source, not a live runtime dependency for TCS scores.',
        }),
        ...entry({
          name: 'GitHub',
          what: 'Source hosting + CI.',
          feature: '.github/workflows/ci.yml runs checks on pushes/PRs.',
          why: 'Version control and automated quality gates.',
          brief: 'CI complements local npm run lint / test:unit.',
        }),
        ...entry({
          name: 'localhost:3000',
          what: 'Local Next.js dev server.',
          feature: 'Day-to-day development and QA.',
          why: 'Fast feedback loop with npm run dev.',
          brief: 'Webpack default; npm run dev:turbo for Turbopack.',
        }),

        h1('8. Developer tools (application build)'),
        ...entry({
          name: 'npm',
          what: 'Node package manager.',
          feature: 'Install deps; run scripts (dev, build, deploy rules, tests).',
          why: 'Standard for this Next.js repo.',
          brief: 'See package.json scripts.',
        }),
        ...entry({
          name: 'Node.js',
          what: 'JavaScript runtime for Next server and scripts.',
          feature: 'API routes, TTS, Excel scripts, Vitest.',
          why: 'Next.js requires Node.',
          brief: 'Server-side home of /api routes.',
        }),
        ...entry({
          name: 'ESLint + eslint-config-next',
          what: 'Static code analysis.',
          feature: 'npm run lint.',
          why: 'Catch React/Next footguns early.',
          brief: 'Pre-existing warnings may exist (see lint_output.txt).',
        }),
        ...entry({
          name: 'Vitest',
          what: 'Unit test runner.',
          feature: 'npm run test:unit; coverage via @vitest/coverage-v8.',
          why: 'Fast tests for pure logic (maps, scoring helpers).',
          brief: 'Prefer unit tests for lib/ pure functions.',
        }),
        ...entry({
          name: 'Firebase CLI (firebase-tools)',
          what: 'Command-line deploy tool.',
          feature: 'deploy:firestore-rules, deploy:storage.',
          why: 'Push security rules to the live project.',
          brief: 'Login required; project id tcs-for-engineers.',
        }),
        ...entry({
          name: 'pptxgenjs + docx',
          what: 'Office document generators.',
          feature: 'Training PPTX decks; this Word guide.',
          why: 'Shareable training/ops docs from the repo.',
          brief: 'scripts/build-training-pptx.mjs and this script.',
        }),
        ...entry({
          name: 'Babel React Compiler plugin',
          what: 'Optional React optimization tooling.',
          feature: 'Build-time React Compiler support when enabled in config.',
          why: 'Performance path for React 19 apps.',
          brief: 'DevDependency — not a runtime API you call manually.',
        }),

        h1('9. Cursor IDE — skills, agents & MCPs (build layer)'),
        p(
          'These help developers and AI agents work on the repo. End users never install them.',
        ),
        h2('9.1 Cursor / agent skills (examples used on this project)'),
        ...entry({
          name: 'Firebase skills (Auth, Firestore, Hosting, rules auditor, etc.)',
          what: 'Cursor skill packs that teach the agent correct Firebase workflows.',
          feature: 'Safer rules edits, Auth guidance, deploy checklists.',
          why: 'Reduce mistakes when changing security-sensitive Firebase pieces.',
          brief: 'Skills are instructions for the agent, not libraries imported by Next.js.',
        }),
        ...entry({
          name: 'create-rule / create-skill / create-hook skills',
          what: 'Meta skills to author Cursor rules, skills, and hooks.',
          feature: 'Team conventions (AGENTS.md-style guidance).',
          why: 'Keep agent behavior aligned with SCORA security and product rules.',
          brief: 'Improves future agent sessions.',
        }),
        ...entry({
          name: 'ui-ux-pro-max (repo .agent/skills)',
          what: 'Local UI/UX skill notes in the project.',
          feature: 'Design guidance when building branded screens.',
          why: 'Consistent SCORA visual quality.',
          brief: 'Optional agent guidance file.',
        }),
        ...entry({
          name: 'review-security / review-bugbot / autopilot skills',
          what: 'Agent skills for PR review, security review, merge readiness.',
          feature: 'Code review assistance during development.',
          why: 'Catch regressions before production.',
          brief: 'Development process aids.',
        }),

        h2('9.2 MCP servers (Model Context Protocol)'),
        p(
          'MCPs connect the Cursor agent to external systems through structured tools. Typical ones available while building SCORA:',
        ),
        table(
          ['MCP', 'What it is', 'Used for on SCORA work'],
          [
            ['plugin-firebase-firebase', 'Firebase MCP (projects, Firestore, Auth, deploy, rules)', 'Inspect docs, validate rules, deploy, list Auth users'],
            ['cursor-ide-browser', 'Automated browser tab + snapshots', 'Visual QA of GoGo/profile flows'],
            ['cursor-app-control', 'Control Cursor workspace/UI', 'Open files, manage project root'],
            ['cursor (CreateGoal / GenerateImage)', 'Native Cursor tools', 'Goals / optional images'],
            ['Notion / Gmail / Calendar / Drive (optional)', 'Workspace productivity MCPs', 'Docs/comms — not required to run SCORA'],
          ],
        ),
        p(
          'Brief: MCP ≠ application dependency. If MCP auth fails, the live website can still run; only the agent’s helper tools are limited.',
          { muted: true, italics: true },
        ),

        h1('10. Feature → technology map'),
        table(
          ['Feature', 'Main tech', 'Key folders'],
          [
            ['TCS ranking & search', 'React + Firestore + Excel import', 'src/app/ScoraApp.jsx, src/lib/tcs, /api/tcs'],
            ['PQA ranking', 'React + Firestore + partner map', 'ScoraApp PQA views, scripts/verify-pqa-partner-map'],
            ['Admin Excel / winners', 'antd + xlsx/exceljs + Admin SDK', 'components/admin, /api/tcs/import-excel'],
            ['GoGo guide + voice', 'gogoGuideFlow + Edge TTS + Web Speech', 'components/gogo, lib/gogo*, /api/gogo/speak'],
            ['My Knowledge tips', 'Firestore + Storage + tip quiz', 'components/employee, services/consultantService'],
            ['Employee auth', 'Firebase Auth + employees collection', 'employeeAuthService, EmployeeAuthModal'],
            ['Scora Challenge', 'Quiz host APIs + QR', '/api/quiz/*, react-qr-code'],
            ['Survey / feedback', 'Firestore forms + public gates', 'survey components, /api/public/form-gate'],
            ['3D atmosphere', 'three / R3F', 'components/atmosphere'],
          ],
        ),

        h1('11. Environment secrets (why they matter)'),
        bullet('FIREBASE_SERVICE_ACCOUNT_JSON — unlocks Admin SDK APIs (quiz, bootstrap, secure deletes).'),
        bullet('BOOTSTRAP_ADMIN_SECRET — one-time super-admin bootstrap.'),
        bullet('GEMINI_API_KEY — leave unset; smart chat stays disabled.'),
        bullet('ELEVENLABS_* — optional Arabic TTS upgrade.'),
        bullet('NEXT_PUBLIC_FIREBASE_APPCHECK_KEY — optional App Check.'),
        p('Core UI can run without .env.local; production security features cannot.', { italics: true }),

        h1('12. Programmer onboarding — what to look at first'),
        p(
          'If you are a programmer new to SCORA, do not start by reading every file. Follow this order to understand the system in hours, not weeks.',
        ),

        h2('12.1 First 30 minutes — map the skeleton'),
        numbered('Open package.json — learn scripts and dependencies (this is the inventory of tools).'),
        numbered('Open AGENTS.md — project rules, Firebase project name, what is disabled (Gemini), how to run/dev.'),
        numbered('Open src/firebase.js — see how the live Firebase project is wired.'),
        numbered('Open src/app/layout.js and src/app/page.js — confirm App Router entry; note the app loads ScoraApp.'),
        numbered('Skim docs/PROJECT_STRUCTURE.md and README.md for folder intent.'),

        h2('12.2 Next — the “god file” and navigation'),
        numbered(
          'Open src/app/ScoraApp.jsx — this is the main application shell (views, portals, GoGo mount, admin tabs). Search for view === and navigateTo( to learn screens.',
        ),
        numbered(
          'Find where GoGoAssistant is rendered and which views hide it (admin, tip viewer). That shows product boundaries.',
        ),
        numbered(
          'Find EmployeeAuthModal + EMPLOYEE_DASHBOARD + CONSULTANT_VIEWER — that is the Knowledge employee journey.',
        ),

        h2('12.3 Data model before UI polish'),
        numbered('Read firestore.rules (and Storage rules) — security tells you the real data ownership model.'),
        numbered('List key collections conceptually: engineers/KPI docs, employees, consultants, employee_progress, announcements, gogo learned, quiz sessions.'),
        numbered('Open src/services/*.js for the CRUD APIs the UI calls (consultantService, employeeAuthService, gogoService).'),

        h2('12.4 Feature deep-dives (pick one at a time)'),
        numbered('TCS: follow Excel import API → lib parsers → Firestore write → dashboard read.'),
        numbered('GoGo: gogoGuideFlow.js (chips) → GoGoAssistant.jsx (orchestration) → /api/gogo/speak (voice).'),
        numbered('Knowledge tips: TechnicalConsultantsPanel (admin) → Storage upload → ConsultantViewer (employee timer/quiz) → progress docs.'),
        numbered('Auth: admin bootstrap API vs employee Firebase Auth; never assume localStorage adminSession (removed).'),

        h2('12.5 What “good” looks like when debugging'),
        bullet('Reproduce on localhost:3000 with the same role (visitor / employee / admin).'),
        bullet('Check browser console + Network for /api/* 503 (often missing Admin SDK secret).'),
        bullet('If Firestore permission errors: compare live rules in Console with repo rules.'),
        bullet('If GoGo “invents”: confirm Gemini disabled and answers come from guide/library/learned only.'),
        bullet('If tip upload fails: Storage rules for consultants/ path.'),

        h2('12.6 Mental model (one paragraph)'),
        p(
          'SCORA is a React state machine of views inside ScoraApp, backed by Firestore documents, with Next.js API routes as a privileged side door. GoGo is a guided host (chips + library), not an open chatbot. Admin tools ingest Excel and publish tips; employees consume tips under Auth + progress rules. Once you can draw that picture, every new file has a place to land.',
        ),

        h1('13. Recommended reading order (files)'),
        table(
          ['Order', 'File / area', 'Why first'],
          [
            ['1', 'package.json + AGENTS.md', 'Commands, constraints, secrets'],
            ['2', 'src/firebase.js', 'Live backend identity'],
            ['3', 'src/app/ScoraApp.jsx (search navigateTo)', 'Screen map'],
            ['4', 'firestore.rules', 'Who can touch what'],
            ['5', 'src/services/*', 'Data access layer'],
            ['6', 'src/lib/gogoGuideFlow.js', 'GoGo behavior range'],
            ['7', 'src/components/employee/*', 'Knowledge tip journey'],
            ['8', 'src/app/api/**/route.js', 'Privileged server features'],
            ['9', 'components/admin/*', 'Ops/admin features'],
          ],
        ),

        h1('14. Glossary (quick)'),
        bullet('TCS — Technical Capability Score (engineer performance).'),
        bullet('PQA — Partner Quality Award (center/partner performance).'),
        bullet('GoGo — Guided visitor/employee assistant with voice.'),
        bullet('My Knowledge — Employee tip library + completion tracking.'),
        bullet('MCP — Model Context Protocol (agent tool bridge in Cursor).'),
        bullet('Edge TTS — Neural text-to-speech used by GoGo speak API.'),
        bullet('Admin SDK — Server Firebase privileges via service account JSON.'),

        h1('15. Closing'),
        p(
          'SCORA’s strength is a clear product range: rankings, Knowledge tips, guided GoGo, and admin ops — on one Next.js + Firebase stack. Prefer guided/library answers over open AI. When learning the code, start from navigation (ScoraApp views) and data rules (Firestore), then dive into one feature vertical end-to-end.',
        ),
        p('Document path: docs/SCORA_Stack_and_Programmer_Guide.docx', {
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
