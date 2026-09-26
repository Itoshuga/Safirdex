# Community decks and Deck Builder

## Storage model

Decks live in the top-level `decks` collection. A document contains the owner ID, a public author snapshot, information and visibility, an optional commander snapshot, the complete main-deck entries, calculated statistics, a legality snapshot, and a versioned ruleset reference.

The embedded card and author snapshots are deliberate. A discovery page reads at most 20 deck documents and a detail page reads one deck document, without joining cards or profiles. Card IDs and the author ID remain the sources of truth for mutations.

`factions` is a public catalogue reference collection. Cards store `gameplayKind` (`combatant`, `spell`, `token`, or `commander`) and `factionIds`. Existing commander cards remain compatible through `isCommander`; the migration path is to persist these two new fields from Admin.

Run `npm run firebase:backfill-card-gameplay -- --apply` once for an existing catalogue, then assign the real factions from Admin. The script is dry-run by default and never invents faction membership.

## Mutation and privacy boundaries

Client Firestore access to `decks` is denied. Server Actions authenticate the session, verify ownership, batch-read every referenced card, rebuild all snapshots and statistics, and run the central rules engine before a write. Drafts may be incomplete or invalid. Publication is rejected unless the current ruleset returns `legal`.

Private decks are returned only to their owner. Unlisted published decks can be opened by direct URL but do not appear in discovery. Public published decks appear in discovery and on public profiles.

The first transition to a public published deck creates one `deck_created` community activity. Deleting a deck removes all activity documents and fan-out feed items for its entity key.

## Ruleset v1

- 30 to 40 cards in total; the optional commander counts toward this limit while remaining outside the main deck.
- At most two copies per stable gameplay card identity.
- The optional commander occupies a separate zone.
- With a commander, at least 15 combatants must share one of its factions.

The pure engine is in `src/features/decks/rules`. Change the version whenever a rule changes, retain the old configuration if historical revalidation is needed, and add focused cases to `scripts/verify-deck-rules.ts`.

## Reads and indexes

- Discovery: 20 deck documents per cursor page.
- Detail: one deck document.
- Builder catalogue: 24 card documents per cursor page, with commanders fetched separately.
- Save: one profile read, one existing deck read for edits, and one batched multi-get for unique card IDs. The deck write and the public profile counter delta are committed atomically in one batch.

Composite indexes in `firestore.indexes.json` cover community and owner sorting plus the common faction, commander, and token filters. The bounded development fallback logs no user data and scans at most 100 deck documents.
