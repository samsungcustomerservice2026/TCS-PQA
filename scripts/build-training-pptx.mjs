/**
 * Build SCORA training PowerPoint decks from docs/training guides + snaps.
 * Run: node scripts/build-training-pptx.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pptxgen from "pptxgenjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TRAINING = path.join(ROOT, "docs", "training");
const SNAPS = path.join(TRAINING, "snaps");

const SAMSUNG_BLUE = "1428A0";
const SAMSUNG_DARK = "0B1F3A";
const TEXT = "1A1A1A";
const MUTED = "5A6472";
const ACCENT = "00A9E0";

function snap(name) {
  const p = path.join(SNAPS, name);
  if (!fs.existsSync(p)) {
    console.warn(`Missing snap: ${name}`);
    return null;
  }
  return p;
}

function titleSlide(pptx, title, subtitle, footer) {
  const slide = pptx.addSlide();
  slide.background = { color: SAMSUNG_DARK };
  slide.addText(title, {
    x: 0.6,
    y: 1.4,
    w: 8.8,
    h: 1.2,
    fontSize: 36,
    bold: true,
    color: "FFFFFF",
    fontFace: "Segoe UI",
  });
  slide.addText(subtitle, {
    x: 0.6,
    y: 2.6,
    w: 8.8,
    h: 0.8,
    fontSize: 18,
    color: ACCENT,
    fontFace: "Segoe UI",
  });
  if (footer) {
    slide.addText(footer, {
      x: 0.6,
      y: 4.8,
      w: 8.8,
      h: 0.4,
      fontSize: 12,
      color: "B0BEC5",
      fontFace: "Segoe UI",
    });
  }
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.6,
    y: 2.35,
    w: 1.2,
    h: 0.06,
    fill: { color: ACCENT },
    line: { color: ACCENT, width: 0 },
  });
}

function sectionSlide(pptx, sectionNum, title, bullets = []) {
  const slide = pptx.addSlide();
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 0.12,
    h: "100%",
    fill: { color: SAMSUNG_BLUE },
    line: { color: SAMSUNG_BLUE, width: 0 },
  });
  slide.addText(String(sectionNum), {
    x: 0.35,
    y: 0.35,
    w: 0.8,
    h: 0.5,
    fontSize: 14,
    bold: true,
    color: SAMSUNG_BLUE,
    fontFace: "Segoe UI",
  });
  slide.addText(title, {
    x: 0.35,
    y: 0.75,
    w: 9.2,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: TEXT,
    fontFace: "Segoe UI",
  });
  if (bullets.length) {
    slide.addText(
      bullets.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })),
      {
        x: 0.55,
        y: 1.6,
        w: 8.8,
        h: 3.5,
        fontSize: 16,
        color: TEXT,
        fontFace: "Segoe UI",
        paraSpaceAfter: 8,
      }
    );
  }
}

function imageSlide(pptx, title, imagePath, caption) {
  const slide = pptx.addSlide();
  slide.addText(title, {
    x: 0.4,
    y: 0.25,
    w: 9.2,
    h: 0.55,
    fontSize: 22,
    bold: true,
    color: SAMSUNG_BLUE,
    fontFace: "Segoe UI",
  });
  if (imagePath) {
    slide.addImage({
      path: imagePath,
      x: 0.5,
      y: 0.95,
      w: 9,
      h: 4.35,
      sizing: { type: "contain", w: 9, h: 4.35 },
    });
  }
  if (caption) {
    slide.addText(caption, {
      x: 0.4,
      y: 5.35,
      w: 9.2,
      h: 0.45,
      fontSize: 11,
      color: MUTED,
      fontFace: "Segoe UI",
      italic: true,
    });
  }
}

function tableSlide(pptx, title, headers, rows) {
  const slide = pptx.addSlide();
  slide.addText(title, {
    x: 0.4,
    y: 0.25,
    w: 9.2,
    h: 0.55,
    fontSize: 22,
    bold: true,
    color: SAMSUNG_BLUE,
    fontFace: "Segoe UI",
  });
  const tableRows = [
    headers.map((h) => ({
      text: h,
      options: { bold: true, fill: { color: SAMSUNG_BLUE }, color: "FFFFFF", fontSize: 12 },
    })),
    ...rows.map((row) =>
      row.map((cell) => ({ text: cell, options: { fontSize: 11, color: TEXT } }))
    ),
  ];
  slide.addTable(tableRows, {
    x: 0.4,
    y: 1.0,
    w: 9.2,
    colW: headers.map(() => 9.2 / headers.length),
    border: { type: "solid", color: "D0D7DE", pt: 0.5 },
    fontFace: "Segoe UI",
  });
}

function checklistSlide(pptx, title, items) {
  const slide = pptx.addSlide();
  slide.addText(title, {
    x: 0.4,
    y: 0.25,
    w: 9.2,
    h: 0.55,
    fontSize: 22,
    bold: true,
    color: SAMSUNG_BLUE,
    fontFace: "Segoe UI",
  });
  slide.addText(
    items.map((item) => ({ text: item, options: { bullet: true, breakLine: true } })),
    {
      x: 0.55,
      y: 1.1,
      w: 8.8,
      h: 4.2,
      fontSize: 16,
      color: TEXT,
      fontFace: "Segoe UI",
      paraSpaceAfter: 10,
    }
  );
}

function buildUserDeck() {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "Samsung EG SCORA";
  pptx.title = "SCORA User Training";
  pptx.subject = "Employee login, My Knowledge, technical tips";

  titleSlide(
    pptx,
    "SCORA User Training",
    "Login · Profile · Technical Tips · Reading Time",
    "Audience: Engineers / ASC staff (GSPN accounts)"
  );

  sectionSlide(pptx, "01", "Open the app (Gateway)", [
    "Open the SCORA website (or localhost:3000 in training).",
    "You land on System Gateway → Select Portal.",
    "SIGN IN (top right) — employee login & signup.",
    "TCS Portal / PQA Portal — engineer & service center tools.",
    "GOGO (bottom left) — tap to open assistant (does not auto-open).",
  ]);
  imageSlide(
    pptx,
    "Gateway — Select Portal",
    snap("13-gateway-select-portal.png"),
    "Start here every day: choose portal or Sign in."
  );

  sectionSlide(pptx, "02", "Create account (first time)", [
    "Click SIGN IN → open SIGN UP tab.",
    "Fill fields in order: GSPN user ID → Email → Phone → Product line → Password.",
    "Product line: MX or CE (DA & AV).",
    "Click CREATE ACCOUNT.",
  ]);
  imageSlide(
    pptx,
    "Sign up form",
    snap("15-employee-signup-modal.png"),
    "GSPN user ID must be entered first."
  );

  sectionSlide(pptx, "03", "Log in (returning users)", [
    "Click SIGN IN → stay on LOG IN tab.",
    "Enter GSPN user ID or email + password.",
    "Click LOG IN — your name appears in the header.",
  ]);
  imageSlide(
    pptx,
    "Log in form",
    snap("14-employee-login-modal.png"),
    "Use GSPN ID or the email you signed up with."
  );

  sectionSlide(pptx, "04", "Open profile & My Knowledge", [
    "From GOGO: tap GOGO → use My Knowledge / Open consultant chips.",
    "From header: Sign in → open My Knowledge (employee dashboard).",
    "See profile card, required consultants, tabs: Pending · Passed · Search KPIs · Account.",
  ]);
  imageSlide(
    pptx,
    "GOGO assistant",
    snap("03-gogo-chat-full.png"),
    "GOGO helps navigate — chat opens only when you tap."
  );
  imageSlide(
    pptx,
    "My Knowledge — employee dashboard",
    snap("01-employee-dashboard-knowledge.png"),
    "Mandatory tips appear under Pending."
  );

  sectionSlide(pptx, "05", "Technical tips — how to complete", [
    "Open a tip card and read content / attachments.",
    "Watch Active time timer (e.g. 02:15 / 05:00).",
    "Stay on the page until required time is reached.",
    "Click Complete when available.",
  ]);
  tableSlide(
    pptx,
    "Required reading time (Min dwell)",
    ["Concept", "Meaning"],
    [
      ["Min dwell", "Minimum active reading time set by admin (often 5 min)"],
      ["Active time", "Time counted while you keep the tip open"],
      ["Must complete", "Mandatory tip for your product line / target group"],
    ]
  );
  sectionSlide(pptx, "05", "Avoid restarting from zero", [
    "If you leave before finishing, the app tries to resume your last attempt.",
    "You usually do NOT restart from 00:00.",
    "If you force-finish too early, reopen and finish remaining time.",
    "Keep the tip tab open — long away periods may pause progress.",
  ]);

  sectionSlide(pptx, "06", "Using GOGO for tips & navigation", [
    "Tap GOGO → opens chat.",
    "Close chat → GOGO stays as full-body helper on portal pages.",
    "Chip: My Knowledge → employee dashboard (after login).",
    "Chip: Open consultant → opens related tip if announced.",
    "GOGO is hidden on My Knowledge / tip viewer for readability.",
  ]);
  imageSlide(
    pptx,
    "GOGO peek (optional)",
    snap("04-gogo-peek-sample.png"),
    "GOGO stays visible on gateway pages when chat is closed."
  );

  tableSlide(
    pptx,
    "Quick troubleshooting",
    ["Problem", "What to try"],
    [
      ["Can't create account", "Confirm Email/Password Auth; ask admin about Firestore rules"],
      ["GSPN not found", "Use signup email, or Sign up first"],
      ["Tip won't complete", "Stay until Active time ≥ required time"],
      ["Lost progress", "Re-open same tip — progress often resumes"],
      ["Can't see tip text", "Use My Knowledge (GOGO hidden there)"],
    ]
  );

  checklistSlide(pptx, "End-of-training checklist", [
    "I can open the Gateway",
    "I can Sign up / Log in with GSPN + email",
    "I can open My Knowledge",
    "I understand Pending / Passed",
    "I know Active time / Min dwell and why I must keep the tip open",
    "I know progress can resume so I don't always restart",
    "I can open GOGO and use My Knowledge chip",
  ]);

  return pptx;
}

function buildAdminDeck() {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "Samsung EG SCORA";
  pptx.title = "SCORA Admin Portal Training";
  pptx.subject = "Admin login, Knowledge Base, surveys, SCORA Challenge";

  titleSlide(
    pptx,
    "SCORA Admin Portal Training",
    "Full walkthrough for trainer-led sessions",
    "Audience: Super Admins / Operators · URL: /?portal=admin"
  );

  tableSlide(
    pptx,
    "Before training (trainer prep)",
    ["Item", "Status needed"],
    [
      ["Firebase Email/Password", "Required for admin Auth login"],
      ["FIREBASE_SERVICE_ACCOUNT_JSON", "Required to create admins from app"],
      ["Firestore rules published", "Required for Survey / Feedback / Reports / Insights"],
      ["Sample tip + employee account", "For Knowledge Base live demo"],
    ]
  );

  sectionSlide(pptx, "01", "Admin login", [
    "Open http://localhost:3000/?portal=admin (or production URL).",
    "See TERMINAL LOGIN (Secure Gateway).",
    "Access ID: admin email or username.",
    "Security Token: password → Execute Initialization.",
    "Emergency unlock removed — Firebase Auth required.",
  ]);
  imageSlide(
    pptx,
    "Admin login",
    snap("12-admin-login.png"),
    "After login you enter Command Center with the left sidebar."
  );

  tableSlide(
    pptx,
    "Portal map (sidebar)",
    ["Section", "Tab", "Purpose"],
    [
      ["Operations", "DATA", "TCS / PQA data, Excel import"],
      ["Operations", "DISPLAY", "Public toggles (survey, feedback, winners)"],
      ["Voice of ASC", "SURVEY", "Samsung Academy survey analytics + export"],
      ["Voice of ASC", "FEEDBACK", "Arabic feedback analytics + export"],
      ["Learning", "SCORA CHALLENGE", "Quiz templates, live host, reports"],
      ["Learning", "KNOWLEDGE BASE", "Technical tips for employees"],
      ["Control", "INSIGHTS", "Engagement analytics + audit log"],
      ["Control", "SYSTEM", "Admin accounts & permissions"],
    ]
  );

  sectionSlide(pptx, "03", "SYSTEM — Manage Accounts", [
    "Add admin: Full name, Username, Email (Firebase Auth), Password, Role.",
    "Set environment scope + module permissions → Add admin.",
    "Creating users needs Admin SDK (FIREBASE_SERVICE_ACCOUNT_JSON).",
    "Edit / delete accounts; Jimmy / George appear after rules published.",
  ]);
  imageSlide(
    pptx,
    "Manage Accounts",
    snap("06-admin-manage-accounts.png"),
    "Email (Firebase Auth) field is required for new admins."
  );

  sectionSlide(pptx, "04", "KNOWLEDGE BASE — Technical tips", [
    "Create tips that appear in employee My Knowledge.",
    "Set Min dwell (minutes) — required reading time (e.g. 5).",
    "Target product + Must complete for mandatory tips.",
    "CREATE DRAFT → upload files → Publish & Push.",
    "Employees see pushed tips under Pending.",
  ]);
  imageSlide(
    pptx,
    "Knowledge Base / Technical Consultants",
    snap("10-admin-knowledge-base.png"),
    "Pair with employee My Knowledge snap in live demo."
  );
  imageSlide(
    pptx,
    "Employee view — same tip as Pending",
    snap("01-employee-dashboard-knowledge.png"),
    "Show both admin push and employee Pending in training."
  );

  sectionSlide(pptx, "05", "SURVEY — Samsung Academy Survey", [
    "Filters: region / product / dates.",
    "Refresh to reload responses.",
    "Export Filtered Excel for offline review.",
    "Enable public survey from Display if form is off.",
    "Empty charts + permissions errors → publish Firestore rules.",
  ]);
  imageSlide(
    pptx,
    "Survey analysis",
    snap("08-admin-survey.png"),
    "Voice of ASC → Survey"
  );

  sectionSlide(pptx, "06", "FEEDBACK — TCS Feedback Analysis", [
    "Public form is Arabic; admin UI is English.",
    "Refresh / Export Filtered Excel.",
    "Enable form under Display if visitors cannot submit.",
  ]);
  imageSlide(
    pptx,
    "Feedback analysis",
    snap("07-admin-feedback.png"),
    "Voice of ASC → Feedback"
  );

  sectionSlide(pptx, "07", "SCORA CHALLENGE — Live quiz & reports", [
    "Templates — build / edit quiz templates.",
    "Live — host game + QR / join link.",
    "Reports — finished sessions and scores.",
    "Logs — quiz activity history.",
  ]);
  imageSlide(
    pptx,
    "SCORA Reports / Live",
    snap("09-admin-scora-reports.png"),
    "Demo: template → Live session → Reports for scores."
  );

  sectionSlide(pptx, "08", "INSIGHTS — Engagement & audit", [
    "Export Analytics (Excel) — visitor engagement.",
    "Open Audit Log — admin action history.",
    "Refresh if engagement data unavailable.",
  ]);
  imageSlide(
    pptx,
    "Insights",
    snap("11-admin-insights.png"),
    "Control → Insights"
  );

  sectionSlide(pptx, "09", "DATA & DISPLAY (quick)", [
    "DATA — import / maintain TCS & PQA registries (Excel).",
    "Use correct division (MX / DA / AV) and role tabs.",
    "DISPLAY — toggle Academy Survey popup, Feedback promo, winners.",
    "Show Display toggles before asking visitors to submit forms.",
  ]);

  tableSlide(
    pptx,
    "Admin vs Employee login",
    ["", "Admin portal", "Employee (GSPN)"],
    [
      ["URL", "/?portal=admin", "Gateway Sign in"],
      ["ID", "Admin email / username", "GSPN or email"],
      ["Purpose", "Manage system", "My Knowledge / tips"],
    ]
  );

  tableSlide(
    pptx,
    "Suggested admin training agenda (45–60 min)",
    ["Time", "Topic", "Snap"],
    [
      ["5 min", "Login & sidebar map", "12-admin-login.png"],
      ["10 min", "SYSTEM — add admin + roles", "06-admin-manage-accounts.png"],
      ["15 min", "Knowledge Base — Min dwell, Push", "10 + 01 employee dashboard"],
      ["5 min", "Survey", "08-admin-survey.png"],
      ["5 min", "Feedback", "07-admin-feedback.png"],
      ["10 min", "SCORA Challenge Live + Reports", "09-admin-scora-reports.png"],
      ["5 min", "Insights", "11-admin-insights.png"],
    ]
  );

  tableSlide(
    pptx,
    "Admin troubleshooting",
    ["Symptom", "Likely cause", "Fix"],
    [
      ["Empty Survey / Feedback / Insights", "isAdmin() blocked", "Publish firestore.rules"],
      ["SCORA Reports permission toast", "Same", "Publish rules; re-login"],
      ["Can't Add Admin", "No service account", "Set FIREBASE_SERVICE_ACCOUNT_JSON"],
      ["Manage Accounts shows only you", "admins list unreadable", "Publish rules; migrate accounts"],
      ["Employee can't Sign up", "employee_index rules", "Publish rules with public get"],
    ]
  );

  checklistSlide(pptx, "Trainer checklist", [
    "Admin can log in without emergency unlock",
    "SYSTEM shows accounts",
    "Can create tip with Min dwell and Push",
    "Employee sees tip in Pending",
    "Survey / Feedback / Insights load (not permission-denied)",
    "SCORA Reports opens finished sessions",
    "Training deck includes snaps from docs/training/snaps/",
  ]);

  return pptx;
}

async function main() {
  const userPptx = buildUserDeck();
  const adminPptx = buildAdminDeck();

  const userOut = path.join(TRAINING, "SCORA_User_Training.pptx");
  const adminOut = path.join(TRAINING, "SCORA_Admin_Training.pptx");

  await userPptx.writeFile({ fileName: userOut });
  await adminPptx.writeFile({ fileName: adminOut });

  console.log(`Created: ${userOut}`);
  console.log(`Created: ${adminOut}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
