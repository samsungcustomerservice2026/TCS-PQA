# TCS / PQA Portal — Project structure

## Application (active code)

```
fawzy-project/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.js             # Main TCS/PQA portal (large single file)
│   │   ├── admin/page.js       # Admin entry redirect
│   │   ├── layout.js, globals.css
│   │   ├── external-logging/
│   │   └── samsung-academy-survey/
│   ├── components/
│   │   └── admin/              # Admin dashboards (survey, feedback export)
│   ├── constants/              # Shared constants (e.g. Firebase Storage rules snippet)
│   ├── lib/                    # Business logic (Excel import, analytics, export)
│   ├── services/               # Firebase Firestore, Storage, analytics, audit logs
│   └── firebase.js             # Firebase client init
├── public/                     # Static images (logos, division art)
├── scripts/                    # Maintained CLI scripts (verify, doc gen, PPT)
├── docs/                       # Documentation (Firebase, structure)
├── storage.rules               # Firebase Storage security rules
├── firebase.json               # Firebase deploy config
└── package.json
```

## Archive (not used at runtime)

```
archive/
├── legacy-patches/   # Old one-off JS patch scripts from development
├── media/            # Large PPTX/MP4 assets
└── diffs/            # Old diff/scratch files
```

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test:pqa-map` | PQA partner map unit checks |
| `npm run deploy:storage` | Deploy Storage rules (needs Firebase CLI login) |

## Known technical debt

1. **`src/app/page.js`** — ~8k+ lines; should be split into views/components over time.
2. **No Firebase Auth** — admin login is custom; Storage rules allow public image uploads by path.
3. **Duplicate lockfile** — parent folder `TCS full project/package-lock.json` vs `fawzy-project/package-lock.json` (turbopack root set in `next.config.mjs`).
