# Safir Codex

The official card archive for Safir. The project includes a responsive landing page, a typed Firestore architecture, and a secure administration panel for managing the TCG catalogue.

## Local development

1. Copy `.env.example` to `.env.local` and fill in the Firebase values.
2. For Firebase Admin, either set the three `FIREBASE_ADMIN_*` variables or point `GOOGLE_APPLICATION_CREDENTIALS` to a local service-account file.
3. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Add `?lang=fr` or `?lang=en` to preview a locale.

## Administration

The back-office is available at [http://localhost:3000/admin](http://localhost:3000/admin). There is no separate administrator login: every account uses `/login`, and only a verified, fully onboarded Firebase user carrying an administrator claim can open the dashboard. Other authenticated users are sent to their personal space.

The unified account flow is server-aware:

1. Registration creates the Firebase Authentication account and immediately initializes a Firestore profile with the `user` role.
2. The user must verify the email address before continuing.
3. Onboarding reserves a unique pseudonym and display name in one Firestore transaction.
4. The Firebase ID token is sent to the same-origin session endpoint.
5. Firebase Admin verifies email, onboarding state, and custom claims before returning a signed, `httpOnly`, `sameSite=lax` session cookie.
6. The `/admin` layout and every Server Action accept that same session only when it carries the administrator claim.

Create an Email/Password user in Firebase Authentication, then grant the first administrator claim locally with one of these commands:

```bash
npm run admin:set -- --uid=FIREBASE_UID
npm run admin:set -- --email=admin@example.com
```

This script uses Firebase Admin directly, updates both the Auth claims and Firestore profile, and is never exposed through a public API. The user must sign out and sign in again after a role change so Firebase issues a fresh token. Both `{ admin: true }` and `{ roles: ["admin"] }` are accepted by the app and security rules.

The panel currently provides real create, read, update, delete, duplication, filtering, localized forms, and artwork upload workflows for:

- Cards
- Seasons
- Sets
- Rarities
- Card Types
- Glossary Entries

Card search loads the current administrative catalogue and filters it on the server by translated name, number, and slug. This is intentionally documented as a first-version limit; cursor-based Firestore pagination and a dedicated full-text service should replace it when the dataset becomes large.

## Firebase Emulator Suite

Install a compatible Java runtime before starting the Firestore emulator.

Start Auth, Firestore, Storage, and the Emulator UI:

```bash
npm run firebase:emulators
```

Set `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` in `.env.local` to route browser SDK calls to the configured local ports. Server-side Firestore code uses the standard `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` environment variable.

Create an Email/Password user in the Emulator UI, then run `npm run admin:set -- --uid=<uid>` while `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` is set. The Admin SDK and browser SDK must target the same emulator project.

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
- `src/features`: application services, admin form mapping, and presentation helpers
- `src/app/admin`: protected App Router pages and Server Actions
- `src/lib/auth`: custom-claim checks and Firebase session verification
- `src/types`: Firestore-ready entities and create/update DTOs
- `src/validation`: Zod schemas for reads and writes
- `scripts`: development seed and focused domain checks
- `docs/data-model.md`: collections, relationships, paths, security, and indexes

The service-account JSON is intentionally kept outside the repository and ignored by Git.

## Security rules

The six catalogue collections remain publicly readable, while their writes and all Storage writes require an administrator claim. Users can read only their own server-managed profile and mutate only their own validated collection entries. Pseudonym and display-name reservations remain private and server-only. The fallback rules deny every other path; UI visibility is never treated as the security boundary.

Deploy rules and indexes through the Firebase CLI after reviewing the target project:

```bash
npx firebase-tools@15.31.0 deploy --only firestore:rules,firestore:indexes,storage
```

## Storage and artwork handling

Firestore stores canonical Storage paths, not download URLs. Current conventions include:

```txt
cards/{cardId}/main/artwork.{ext}
cards/{cardId}/alternatives/{artworkId}.{ext}
seasons/{seasonId}/cover.{ext}
rarities/{rarityId}/icon.{ext}
card-types/{cardTypeId}/icon.{ext}
```

The admin accepts JPG, PNG, WebP, and AVIF card/season artwork up to 15 MB per file. Icons may also be SVG. Images are preserved in their original format and quality; automatic WebP conversion is intentionally deferred rather than silently degrading source artwork. The Server Action body limit is 64 MB for multi-artwork submissions.

Deleting cards and visual entities removes their Firestore document and then their associated Storage prefix. These are separate services, so a network failure can leave orphaned assets after a successful document deletion; the UI reports the failure and operators can retry or clean up the prefix manually.

Alternative artworks use stable UUID-derived IDs and persist an explicit `order`. Card descriptions accept both the concise `[[move]]` syntax and the legacy `[[glossary:move]]` syntax; the admin inserts the concise form.
