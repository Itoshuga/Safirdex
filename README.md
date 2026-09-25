# Safir Codex

The official card archive for Safir. This first iteration provides the project foundation, design system, Firebase integration, internationalization structure, and responsive landing page.

## Local development

1. Copy `.env.example` to `.env.local` and fill in the Firebase values.
2. For Firebase Admin, either set the three `FIREBASE_ADMIN_*` variables or point `GOOGLE_APPLICATION_CREDENTIALS` to a local service-account file.
3. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Add `?lang=fr` or `?lang=en` to preview a locale.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Architecture

- `src/app`: App Router entrypoints and global design tokens
- `src/components`: reusable UI, layout, card, and home components
- `src/constants`: isolated mock data
- `src/lib/firebase`: lazy client and server-only Admin SDK access
- `src/lib/i18n`: locale registry, messages, and fallback helpers
- `src/types`: Firestore-ready domain models with translation maps

The service-account JSON is intentionally kept outside the repository and ignored by Git.
