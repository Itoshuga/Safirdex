# Safir Codex

The official card archive for Safir. The project includes a responsive landing page and a typed, server-first Firestore architecture for the future Codex and administration tools.

## Local development

1. Copy `.env.example` to `.env.local` and fill in the Firebase values.
2. For Firebase Admin, either set the three `FIREBASE_ADMIN_*` variables or point `GOOGLE_APPLICATION_CREDENTIALS` to a local service-account file.
3. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Add `?lang=fr` or `?lang=en` to preview a locale.

## Firebase Emulator Suite

Install a compatible Java runtime before starting the Firestore emulator.

Start Auth, Firestore, Storage, and the Emulator UI:

```bash
npm run firebase:emulators
```

Set `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` in `.env.local` to route browser SDK calls to the configured local ports. Server-side Firestore code uses the standard `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` environment variable.

Validate the development seed without connecting to Firebase:

```bash
npm run firebase:seed:dry-run
```

Seed a temporary Firestore emulator:

```bash
npm run firebase:seed:emulator
```

`npm run firebase:seed -- --allow-live` is the explicit escape hatch for a real development project. The script never runs automatically and refuses `NODE_ENV=production`.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test:domain
npm run test:firebase-config
npm run firebase:seed:dry-run
npm run build
```

## Architecture

- `src/app`: App Router entrypoints and global design tokens
- `src/components`: reusable UI, layout, card, and home components
- `src/constants`: isolated mock data
- `src/lib/firebase`: lazy client and server-only Admin SDK access
- `src/lib/i18n`: locale registry, messages, and fallback helpers
- `src/repositories`: validated, server-only Firestore CRUD/query APIs
- `src/features`: application services consumed by future pages
- `src/types`: Firestore-ready entities and create/update DTOs
- `src/validation`: Zod schemas for reads and writes
- `scripts`: development seed and focused domain checks
- `docs/data-model.md`: collections, relationships, paths, security, and indexes

The service-account JSON is intentionally kept outside the repository and ignored by Git.
