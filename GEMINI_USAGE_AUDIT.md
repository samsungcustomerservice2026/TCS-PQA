# GEMINI USAGE AUDIT

**Date:** 2026-08-22  
**Decision:** Remove Gemini from the production request path (no rate-limit-only mitigation).

## Package dependency

| Package | Present? |
|---------|----------|
| `@google/generative-ai` | **No** |
| `@google/genai` | **No** |

Gemini is called via **HTTPS REST** to `generativelanguage.googleapis.com`.

## Environment variables

| Variable | Used by |
|----------|---------|
| `GEMINI_API_KEY` | `api/gogo/chat`, `product-gemini`, `speak` |
| `GEMINI_MODEL` | chat / product-gemini |
| `GEMINI_TTS_MODEL` | speak |
| `GEMINI_TTS_VOICE_EN` / `_AR` | speak |

## Server routes (production cost path)

| File | Calls Gemini? | Disposition |
|------|---------------|-------------|
| `src/app/api/gogo/chat/route.js` | Yes (`generateContent` + tools) | **Disable / stub — no Gemini** |
| `src/app/api/gogo/product-gemini/route.js` | Yes | **Disable / stub — no Gemini** |
| `src/app/api/gogo/speak/route.js` | Optional Gemini TTS | **Remove Gemini branch**; keep Edge TTS only |
| `src/app/api/gogo/product-search/route.js` | No (inventory) | Keep; no Gemini |
| `src/app/api/consultants/extract/route.js` | No | Keep; harden SSRF separately |
| `src/app/api/samsung-kb/**` | No Gemini in initial scan | Gate / feature-flag separately |

## Client / lib (call or prompt for Gemini)

| File | Role |
|------|------|
| `src/components/gogo/GoGoAssistant.jsx` | `askGoGoGemini` → `/api/gogo/chat` |
| `src/lib/gogoVoice.js` | `fetchGeminiSpeech` → `/api/gogo/speak` Gemini path |
| `src/lib/gogoGeminiContext.js` | System prompt / smart chips |
| `src/lib/gogoGeminiProduct.js` | Product extract prompts |
| `src/lib/gogoAgentTools.js` | Tool declarations for Gemini |
| `src/lib/gogoRouter.js` | Imports gemini context |
| `src/lib/gogoOrgAndKpis.js` | Prompt compact block |
| Other `gogo*.js` | Supporting knowledge (may remain for guided mode) |

## Scripts

| File | Role |
|------|------|
| `scripts/test-gogo-product-gemini.mjs` | Standalone Gemini smoke test |

## Non-Gemini voice (allowed to keep)

- `node-edge-tts` via `/api/gogo/speak` (free Edge neural voices)
- Optional ElevenLabs behind explicit env (paid — do not enable by default; not a Gemini replacement for “smart chat”)

## Post-removal UX

- Guided menu chips + local knowledge flows remain.
- Smart chat / product-gemini show clear **AI Assistant temporarily unavailable**.
- No fabricated AI answers.
