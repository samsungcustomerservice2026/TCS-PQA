import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

const W = 1280;
const H = 720;
const FPS = 30;
const SEG_DUR = 4;
const FONT = "C\\:/Windows/Fonts/arial.ttf";
const output = "TCS_MX_App_Intro_7886002511.mp4";

const slides = [
  {
    title: "SAMSUNG TCS MX PLATFORM",
    subtitle: "Smart performance visibility for every engineer",
  },
  {
    title: "APP PURPOSE",
    subtitle: "Turn KPI data into fair ranking and clear coaching actions",
  },
  {
    title: "HOW IT WORKS",
    subtitle: "Upload data  ->  Score logic  ->  Ranking  ->  Dashboard",
  },
  {
    title: "ENGINEER JOURNEY",
    subtitle: "Engineer enters code and instantly sees KPIs and score context",
  },
  {
    title: "DEMO SEARCH CODE",
    subtitle: "Engineer code 7886002511 - profile and KPI snapshot are shown",
  },
  {
    title: "MAIN TARGET = COMPETITION",
    subtitle: "Transparent ranking drives continuous improvement and motivation",
  },
];

const args = [];

slides.forEach(() => {
  args.push(
    "-f",
    "lavfi",
    "-t",
    String(SEG_DUR),
    "-i",
    `color=c=#0a0a0a:s=${W}x${H}:r=${FPS}`
  );
});

const esc = (s) =>
  String(s)
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/,/g, "\\,");

const drawTitle = (inputLabel, title, subtitle, idx) => {
  const t = esc(title);
  const st = esc(subtitle);
  return `[${inputLabel}]` +
    `drawtext=fontfile='${FONT}':text='SAMSUNG':fontcolor=white:fontsize=36:x=60:y=48,` +
    `drawtext=fontfile='${FONT}':text='TCS MX APP INTRO':fontcolor=#a0a0a0:fontsize=20:x=w-tw-60:y=60,` +
    `drawtext=fontfile='${FONT}':text='${t}':fontcolor=white:fontsize=54:x=(w-text_w)/2:y=(h/2)-90,` +
    `drawtext=fontfile='${FONT}':text='${st}':fontcolor=#d0d0d0:fontsize=30:x=(w-text_w)/2:y=(h/2)+10,` +
    `drawtext=fontfile='${FONT}':text='Slide ${idx + 1} of ${slides.length}':fontcolor=#8d8d8d:fontsize=18:x=(w-text_w)/2:y=h-58` +
    `[v${idx}]`;
};

const perSlideFilters = slides.map((s, i) => drawTitle(`${i}:v`, s.title, s.subtitle, i));
const concatInputs = slides.map((_, i) => `[v${i}]`).join("");
const filterComplex = `${perSlideFilters.join(";")};${concatInputs}concat=n=${slides.length}:v=1:a=0[v]`;

args.push(
  "-filter_complex",
  filterComplex,
  "-map",
  "[v]",
  "-r",
  String(FPS),
  "-c:v",
  "libx264",
  "-pix_fmt",
  "yuv420p",
  "-movflags",
  "+faststart",
  "-y",
  output
);

console.log("Using ffmpeg:", ffmpegPath);
console.log("Rendering:", output);

const proc = spawn(ffmpegPath, args, { stdio: "inherit" });
proc.on("exit", (code) => {
  if (code === 0) {
    console.log(`Created: ${output}`);
    process.exit(0);
  }
  console.error(`FFmpeg failed with code ${code}`);
  process.exit(code ?? 1);
});
