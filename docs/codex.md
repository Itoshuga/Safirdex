# Public Codex architecture

## Routes

- `/{locale}/cards` renders the public catalogue as a Server Component.
- `/{locale}/cards/{slug}` renders one card from a single slug query.
- Interface strings come from `messages/{locale}/cards.json`; business translations remain in Firestore.

The browser never imports the Firestore client for these routes. The data path is:

```text
Browser → Next.js Server Component → Data Cache → cardsRepository → Firebase Admin
```

## Public interface

The catalogue uses the same 80-pixel, `max-w-[90rem]` public header structure as the home and account pages. The home header and its quick-access block both link to `/cards`; the account header and empty-collection action do the same.

Filters live in a left-hand drawer on every breakpoint instead of permanently reducing the catalogue width. The drawer groups search, catalogue relations, card characteristics, and sorting into separate sections. Active filters remain visible as removable chips in the page toolbar.

Two URL-backed presentation modes are available: the image-first grid (`view=grid`, omitted by default) and a compact list (`view=list`). Switching modes preserves filters, sorting, search, and the current cursor without issuing additional Firestore queries.

## Read model

Reference IDs (`seasonId`, `setId`, `rarityId`, and `typeIds`) remain canonical. Each card also stores a `display` snapshot containing the localized names and visual information required by the public UI.

Snapshots are built by `features/cards/server/display-snapshots.ts`. Card create/update actions resolve all referenced documents in four bulk reads at most (seasons, sets, rarities, types), then save the complete card. No relation is read by `CardPreview`.

Existing cards can be migrated with:

```bash
npm run firebase:backfill-card-display -- --allow-live
```

The explicit flag prevents accidental writes to a live project. The emulator does not require it.

## Reference synchronization

Admin updates call one of:

- `syncSeasonSnapshots(seasonId)`
- `syncSetSnapshots(setId)`
- `syncRaritySnapshots(rarityId)`
- `syncCardTypeSnapshots(typeId)`

The function reads the affected cards once, resolves unique references in bulk, and writes snapshots in batches of at most 450 operations. This deliberately spends a few admin reads and writes to remove relation reads from public traffic.

Deleting a reference invalidates the relevant option and card caches. Existing cards keep the last display snapshot, so their public presentation does not create a fallback relation query. Administrators should reassign referencing cards before removing their source entity.

## Pagination and filters

`cardsRepository.getPage()` uses `limit(25)` to return 24 items plus a `hasMore` sentinel. The opaque cursor contains the current sort value and document ID, and the next query uses `startAfter`; no offset is used.

Supported sort modes are card number, newest, and oldest. URL filters use stable slugs:

```text
/fr/cards?season=season-2&rarity=legendary&type=mage
```

The service validates every parameter and resolves known slugs through cached reference lists. To keep the composite-index set finite, one selective predicate is sent to Firestore in this order: type, set, season, rarity, commander, promo. Remaining filters are applied to the bounded 24-card page on the server. Consequently, a very selective multi-filter combination may return fewer than 24 items; the next cursor continues the scan without loading the full catalogue.

`firestore.indexes.json` contains the required primary-predicate indexes. If an index has not yet been deployed, the repository falls back to an unfiltered but still bounded ordered query, and the service applies the filters in memory. Deploying the indexes restores the most selective read path without changing the route contract.

Selecting several types simultaneously is intentionally not supported. Firestore cannot combine several `array-contains` clauses. A dedicated search/read model can add that behavior later without changing `CardPreview`.

Name/number search is explicit-submit and local to the currently fetched page. It is documented in the UI. Typesense, Algolia, or Meilisearch can later replace this layer while preserving the same card DTO.

No exact total is queried. The page reports the number loaded and whether more results exist, avoiding a count read on every filter change.

## Cache and invalidation

The project currently uses the standard Next.js Data Cache model rather than globally enabling Cache Components, because authentication and administration routes retain request-time rendering semantics. `unstable_cache` wraps Firebase Admin reads and remains the supported persistent data-cache API for this configuration.

- cards pages: 5-minute revalidation, tag `codex:cards`;
- card details: 1-hour revalidation, tags `codex:cards`, `codex:card:{slug}`, and `codex:glossary`;
- seasons, sets, rarities, types, and glossary: 24-hour safety revalidation plus explicit tags.

Admin Server Actions call `updateTag` after mutations, providing immediate read-your-own-write invalidation. Card mutations expire list and old/new slug tags. Reference updates synchronize snapshots before expiring reference and card tags.

## Images

Admin uploads store both `storagePath` and a stable Firebase download URL backed by a download token. The path remains canonical; the URL is the public read optimization. New copies receive a new token and URL.

The grid uses `next/image`, responsive `sizes`, lazy loading by default, and `prefetch={false}` on card links. Horizontal images use `object-contain` in the common card frame and are never stretched. The detail hero alone receives image priority.

The artwork model already supports a future dedicated thumbnail URL. No image-processing pipeline is introduced yet.

## Glossary

The detail service loads all glossary entries through one shared cached dictionary, localizes only referenced keys, and passes that plain object to the interactive tooltip component. `[[key]]` and legacy `[[glossary:key]]` syntax are supported. Missing entries remain visible as their original token.

## Development rule

```text
NO FIRESTORE QUERY INSIDE:
  map()
  forEach()
  loops
  CardPreview
```

Loops may transform already-loaded in-memory data or build one Firestore query. Batch writes may loop over documents, but reads are never issued per card, relation, artwork, or glossary term.
