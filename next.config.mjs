import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Keep Edge TTS / ws outside the webpack bundle (fixes bufferUtil.mask errors)
  serverExternalPackages: ['node-edge-tts', 'ws', 'bufferutil', 'utf-8-validate'],
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      { source: '/scora-challenge', destination: '/scora-challenge/join', permanent: false },
      { source: '/quiz', destination: '/scora-challenge/join', permanent: false },
      { source: '/quiz/join', destination: '/scora-challenge/join', permanent: false },
      { source: '/quiz/play/:sessionId', destination: '/scora-challenge/play/:sessionId', permanent: false },
      { source: '/quiz/host/:sessionId', destination: '/scora-challenge/host/:sessionId', permanent: false },
      { source: '/quiz/results/:sessionId', destination: '/scora-challenge/results/:sessionId', permanent: false },
      { source: '/join', destination: '/scora-challenge/join', permanent: false },
      { source: '/admin/quiz', destination: '/admin/scora-challenge', permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=()",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
