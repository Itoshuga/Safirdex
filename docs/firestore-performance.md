# Firestore performance budget

## Catalogue target

For a cold first request that displays 24 cards:

```text
25 card document reads at most
  24 displayed cards
  + 1 look-ahead document for hasMore

+ one read of each small reference collection only when its cache is cold
```

There are no per-card reads for seasons, sets, rarities, types, artworks, or glossary entries. On warm requests, reference lists and matching card pages are served from the Next.js Data Cache.

The look-ahead document is an intentional pagination trade-off. It avoids a count query and tells the UI whether another cursor exists.

## Card detail target

```text
1 cards query: where slug == requested slug, limit 1
+ glossary collection only on a cold glossary cache
```

Season, set, rarity, types, main artwork, and alternative artworks are already embedded in the card document. A warm detail-cache request should not reach Firestore.

## Home search target

The home page performs one collection query on a cold `codex-home-card-search` cache and builds a lightweight localized index in memory. That cache lives for one hour and shares the `codex:cards` tag, so every card mutation expires it immediately. Warm home requests perform no Firestore reads, and the counter is the index length rather than a second count query.

This deliberately trades one cold read of each card for complete client-side home search. It performs no relation queries because the searchable rarity and type names come from each card's `display` snapshot.

## Filter strategy

The repository executes one bounded query. It never fetches the complete collection and never uses `offset`. One selective server predicate limits the candidate page; additional filters and text search operate on those 24 candidates server-side. This caps ordinary catalogue reads at 25 even for complex filter URLs.

The committed indexes cover each selectable primary predicate for card-number and creation-date ordering. We intentionally do not create every permutation of six filters.

The index definitions still have to be deployed to the target Firebase project. Until deployment, a missing-index error is caught and the repository repeats the same bounded, ordered query without the primary predicate; all active filters are then applied to those candidates in memory. This keeps the public page available without introducing an unbounded read.

## Cache invalidation matrix

| Admin mutation | Cache tags expired | Snapshot action |
| --- | --- | --- |
| Card create | `codex:cards`, new slug | snapshot built before write |
| Card update | `codex:cards`, old slug, new slug | snapshot rebuilt before write |
| Card delete | `codex:cards`, old slug | none |
| Season update | `codex:references:seasons`, `codex:cards` | affected cards batched |
| Set update | `codex:references:sets`, `codex:cards` | affected cards batched |
| Rarity update | `codex:references:rarities`, `codex:cards` | affected cards batched |
| Card type update | `codex:references:types`, `codex:cards` | affected cards batched |
| Glossary mutation | `codex:glossary` | dictionary refresh only |

Time-based revalidation is a safety net, not the primary consistency strategy.

## Development instrumentation

Repository cache misses log only in development:

```text
[Cache MISS] codex cards (fr/number)
[Firestore] cardsRepository.getPage() (up to 25 documents)
[Cache MISS] codex rarities
```

Repeated Firestore lines during a single catalogue render are a regression signal. Production does not emit these logs.

## Audit checklist

- No `onSnapshot` listener in public Codex code.
- No Firebase client import in `components/cards` or `features/cards/server`.
- No `getDownloadURL` during catalogue/detail rendering.
- No Firestore read inside `CardPreview`, a card loop, or a glossary-token loop.
- Card links disable automatic detail prefetch.
- Pagination always uses `limit` and `startAfter`.
- Exact totals are not read or computed from the full collection.
