import pptxgen from "pptxgenjs";

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pptx.author = "Samsung TCS/PQA Team";
pptx.company = "Samsung Customer Service";
pptx.subject = "App Introduction";
pptx.title = "TCS/PQA Platform — Mind-Blowing Intro";
pptx.lang = "en-US";

const palette = {
  bg: "05070D",
  card: "101622",
  accent: "2E7BFF",
  accent2: "00D2FF",
  text: "F7FAFF",
  sub: "9CA9C7",
  success: "23D18B",
  warning: "F8BE32",
};

function baseSlide(slide, title, subtitle = "") {
  slide.background = { color: palette.bg };

  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.65,
    fill: { color: "0B1020" },
    line: { color: "0B1020" },
  });

  slide.addText("SAMSUNG", {
    x: 0.45,
    y: 0.18,
    w: 2.6,
    h: 0.3,
    fontFace: "Aptos Display",
    fontSize: 19,
    bold: true,
    color: "FFFFFF",
    charSpace: 1.6,
  });

  slide.addText("TCS / PQA INTELLIGENCE PLATFORM", {
    x: 8.1,
    y: 0.2,
    w: 4.7,
    h: 0.28,
    fontFace: "Aptos",
    fontSize: 10,
    bold: true,
    color: "89A3D8",
    align: "right",
    charSpace: 1.1,
  });

  slide.addText(title, {
    x: 0.62,
    y: 0.92,
    w: 12.2,
    h: 0.6,
    fontFace: "Aptos Display",
    fontSize: 34,
    bold: true,
    color: palette.text,
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.62,
      y: 1.56,
      w: 11.7,
      h: 0.42,
      fontFace: "Aptos",
      fontSize: 14,
      color: palette.sub,
    });
  }
}

function card(slide, x, y, w, h, title, body, accent = palette.accent) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.08,
    fill: { color: palette.card, transparency: 0 },
    line: { color: "1D2840", pt: 1 },
    shadow: {
      type: "outer",
      color: "000000",
      blur: 6,
      angle: 45,
      distance: 3,
      opacity: 0.25,
    },
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: x + 0.16,
    y: y + 0.17,
    w: 0.07,
    h: h - 0.34,
    fill: { color: accent },
    line: { color: accent },
  });

  slide.addText(title, {
    x: x + 0.34,
    y: y + 0.16,
    w: w - 0.46,
    h: 0.3,
    fontFace: "Aptos",
    fontSize: 13,
    bold: true,
    color: "E6EEFF",
    charSpace: 0.6,
  });

  slide.addText(body, {
    x: x + 0.34,
    y: y + 0.5,
    w: w - 0.46,
    h: h - 0.6,
    fontFace: "Aptos",
    fontSize: 12,
    color: "9CB2DA",
    valign: "top",
    breakLine: true,
  });
}

// Slide 1: Cover
{
  const s = pptx.addSlide();
  baseSlide(
    s,
    "One Platform. Total Performance Visibility.",
    "How Samsung transforms engineer data into realtime ranking, coaching, and operational decisions."
  );

  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.9,
    y: 2.4,
    w: 11.45,
    h: 4.45,
    rectRadius: 0.12,
    fill: { color: "0B1222" },
    line: { color: "284067", pt: 1.5 },
  });

  s.addText(
    [
      { text: "TCS/PQA APP INTRO", options: { bold: true, color: "FFFFFF" } },
      { text: "\n\nBuilt for leadership, operations, and every engineer.\n\n", options: { color: "AFC0E4" } },
      { text: "Data Ingest  •  Smart Ranking  •  Winner Control  •  Engineer Dossier", options: { color: "66D7FF", bold: true } },
    ],
    {
      x: 1.35,
      y: 3.05,
      w: 10.5,
      h: 3.2,
      fontFace: "Aptos",
      fontSize: 24,
      align: "center",
      valign: "mid",
    }
  );
}

// Slide 2: Problem (phase 1)
{
  const s = pptx.addSlide();
  baseSlide(s, "Before This Platform", "Performance tracking was fragmented and slow.");
  card(
    s,
    0.9,
    2.1,
    5.85,
    4.6,
    "Old Reality",
    "Different sheets per product.\nManual consolidation.\nNo trusted single ranking.\nSlow winner communication.\nHard to explain engineer performance fairly.",
    "FF6B6B"
  );
}

// Slide 3: Problem (phase 2 = animated continuation)
{
  const s = pptx.addSlide();
  baseSlide(s, "Before This Platform", "Performance tracking was fragmented and slow.");
  card(
    s,
    0.9,
    2.1,
    5.85,
    4.6,
    "Old Reality",
    "Different sheets per product.\nManual consolidation.\nNo trusted single ranking.\nSlow winner communication.\nHard to explain engineer performance fairly.",
    "FF6B6B"
  );
  card(
    s,
    6.95,
    2.1,
    5.45,
    4.6,
    "Impact",
    "Management review cycles got delayed.\nEngineer trust dropped when rules looked unclear.\nStrong performers were not always highlighted fast enough.\nData quality checks consumed team time.",
    palette.warning
  );
}

// Slide 4: Purpose
{
  const s = pptx.addSlide();
  baseSlide(s, "App Purpose", "Turn raw operational data into clear, fair, and actionable decisions.");
  card(
    s,
    0.9,
    2.1,
    3.8,
    4.65,
    "Unify",
    "One platform for MX, DA, AV, and PQA.\nConsistent structure.\nConsistent experience.",
    palette.accent
  );
  card(
    s,
    4.95,
    2.1,
    3.8,
    4.65,
    "Explain",
    "Engineer search shows KPI breakdown and score context.\nTransparent metrics for everyone.",
    palette.success
  );
  card(
    s,
    9.0,
    2.1,
    3.45,
    4.65,
    "Act",
    "Manual winners control + dashboard publishing.\nFast leadership decisions and recognition.",
    "C18CFF"
  );
}

// Slide 5: How it works
{
  const s = pptx.addSlide();
  baseSlide(s, "How It Works", "Simple flow. Powerful output.");
  s.addShape(pptx.ShapeType.line, { x: 1.4, y: 3.75, w: 10.4, h: 0, line: { color: "355789", pt: 2 } });

  const steps = [
    ["1", "Upload Data", "Excel templates for each product"],
    ["2", "Normalize", "Engineer code + KPI mapping"],
    ["3", "Score & Rank", "Final score + tier logic"],
    ["4", "Publish Winners", "Admin top-6 control by quarter"],
    ["5", "Search & Explain", "Engineer dossier and KPI context"],
  ];

  const xStarts = [1.0, 3.4, 5.75, 8.05, 10.35];
  steps.forEach((st, i) => {
    s.addShape(pptx.ShapeType.roundRect, {
      x: xStarts[i],
      y: 2.8,
      w: 2.05,
      h: 1.9,
      rectRadius: 0.08,
      fill: { color: "111A2C" },
      line: { color: "2C4268", pt: 1.2 },
    });
    s.addText(st[0], {
      x: xStarts[i] + 0.12,
      y: 2.9,
      w: 0.35,
      h: 0.26,
      fontSize: 14,
      bold: true,
      color: "66D7FF",
      fontFace: "Aptos Display",
    });
    s.addText(st[1], {
      x: xStarts[i] + 0.12,
      y: 3.23,
      w: 1.78,
      h: 0.28,
      fontSize: 12,
      bold: true,
      color: "FFFFFF",
    });
    s.addText(st[2], {
      x: xStarts[i] + 0.12,
      y: 3.57,
      w: 1.8,
      h: 0.86,
      fontSize: 10,
      color: "A8B8D8",
      breakLine: true,
      valign: "top",
    });
  });
}

// Slide 6: Products
{
  const s = pptx.addSlide();
  baseSlide(s, "Built for Every Division", "One core engine, product-aware logic.");
  const divisions = [
    ["TCS MX", "Engineer evaluation focus.\nTier progression and leadership visibility.", "2E7BFF"],
    ["TCS DA", "Final score driven ranking.\nManual winner reflection by engineer code.", "F8BE32"],
    ["TCS AV", "Unified DA/AV workflow.\nConsistent KPI and winner control.", "00D2FF"],
    ["PQA MX / CE", "Evaluation-point workflows,\nservice-center performance tracking.", "23D18B"],
  ];
  divisions.forEach((d, i) => {
    card(s, 0.9 + i * 3.1, 2.3, 2.85, 4.3, d[0], d[1], d[2]);
  });
}

// Slide 7: Admin Superpowers
{
  const s = pptx.addSlide();
  baseSlide(s, "Admin Control Hub", "High governance, low friction.");
  card(
    s,
    0.95,
    2.2,
    4.1,
    4.4,
    "Manual Top Winners",
    "Save top 6 engineers per product and quarter.\nOrder is preserved as official podium order.",
    palette.accent
  );
  card(
    s,
    5.2,
    2.2,
    3.7,
    4.4,
    "Template Governance",
    "Unified template controls prevent mapping confusion.\nUpload quality stays high.",
    palette.success
  );
  card(
    s,
    9.05,
    2.2,
    3.4,
    4.4,
    "Reliability",
    "Versioned logic and clear quarter-product routing.\nStable dashboard behavior.",
    "C18CFF"
  );
}

// Slide 8: Engineer experience
{
  const s = pptx.addSlide();
  baseSlide(s, "Engineer Experience", "Every engineer can see performance clearly by code.");
  card(
    s,
    0.95,
    2.2,
    6.0,
    4.6,
    "What Engineers Get",
    "Search by engineer code.\nSee current score and tier.\nUnderstand KPI criteria and values.\nReview period-specific performance context.",
    palette.accent2
  );
  card(
    s,
    7.15,
    2.2,
    5.3,
    4.6,
    "Why It Matters",
    "Improves trust in scoring.\nSupports coaching conversations.\nMakes goals concrete and measurable.",
    palette.success
  );
}

// Slide 9: “Animation” reveal sequence A
{
  const s = pptx.addSlide();
  baseSlide(s, "Value in 90 Days", "Step-by-step transformation story.");
  card(s, 1.2, 2.3, 11.0, 1.2, "Phase 1", "Data is standardized across teams.", palette.accent);
}

// Slide 10: reveal sequence B
{
  const s = pptx.addSlide();
  baseSlide(s, "Value in 90 Days", "Step-by-step transformation story.");
  card(s, 1.2, 2.3, 11.0, 1.2, "Phase 1", "Data is standardized across teams.", palette.accent);
  card(s, 1.2, 3.75, 11.0, 1.2, "Phase 2", "Rankings become transparent and trusted.", palette.success);
}

// Slide 11: reveal sequence C
{
  const s = pptx.addSlide();
  baseSlide(s, "Value in 90 Days", "Step-by-step transformation story.");
  card(s, 1.2, 2.0, 11.0, 1.1, "Phase 1", "Data is standardized across teams.", palette.accent);
  card(s, 1.2, 3.25, 11.0, 1.1, "Phase 2", "Rankings become transparent and trusted.", palette.success);
  card(s, 1.2, 4.5, 11.0, 1.1, "Phase 3", "Leadership publishes winners with confidence.", palette.warning);
  card(s, 1.2, 5.75, 11.0, 1.1, "Phase 4", "Engineers understand exactly how to improve.", "C18CFF");
}

// Slide 12: Closing
{
  const s = pptx.addSlide();
  baseSlide(
    s,
    "This Is More Than a Dashboard",
    "It is a performance language everyone can trust."
  );
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.95,
    y: 2.2,
    w: 11.4,
    h: 4.5,
    rectRadius: 0.1,
    fill: { color: "0D1526" },
    line: { color: "274169", pt: 1.2 },
  });
  s.addText("One Source of Truth.\nOne Ranking Story.\nOne Team Momentum.", {
    x: 1.35,
    y: 2.8,
    w: 10.6,
    h: 2.8,
    fontFace: "Aptos Display",
    fontSize: 39,
    bold: true,
    color: "FFFFFF",
    align: "center",
    valign: "mid",
  });
  s.addText("Thank you.", {
    x: 0.95,
    y: 6.95,
    w: 11.4,
    h: 0.26,
    align: "center",
    color: "8EA2CF",
    fontSize: 13,
    bold: true,
    fontFace: "Aptos",
    charSpace: 1.1,
  });
}

await pptx.writeFile({
  fileName: "TCS_PQA_MindBlowing_Intro_AnimatedStyle.pptx",
});

console.log("Created: TCS_PQA_MindBlowing_Intro_AnimatedStyle.pptx");
