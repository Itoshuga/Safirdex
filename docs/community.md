# Community architecture

## Routes and ownership

- `/{locale}/community` renders public search plus the cached Discover feed. Its Following tab requires a session.
- `/{locale}/user/@{username}` is the public profile. Old username reservations remain aliases and redirect to the current username.
- `/{locale}/account` uses the same profile renderer in owner mode and adds editing, privacy, administration, and logout controls.

All Firestore reads and writes for these pages pass through server-only services. Client components receive serializable view models; they never receive a UID, Storage path, e-mail address, role, or private user document except where the signed-in owner needs their own UID to upload an image.

## Firestore read model

- `publicProfiles/{uid}` contains the public profile snapshot, exact counters, section visibility, and the current username.
- `usernames/{normalizedUsername}` atomically reserves the username. Previous names are retained as aliases so links and activity snapshots remain valid.
- `users/{uid}/following/{targetUid}` and `users/{uid}/followers/{followerUid}` mirror each relation. A transaction creates or removes both documents and adjusts both profile counters.
- `communityActivities/{activityId}` stores one immutable display snapshot of the actor and affected deck/cards.
- `userFeeds/{uid}/items/{activityId}` is the materialized Following feed. New public activity is fanned out to followers; following a member backfills their latest 20 public entries.

Discover uses one paginated activity query. Following uses one paginated materialized-feed query. Cards in collection previews are loaded with a batched `getAll` lookup, and follow state is also loaded in one batched read. No rendering loop performs a Firestore query.

## Activity integration

The project does not yet contain a deck editor, so the community layer exposes server hooks without inventing a second deck system:

- `recordDeckCreatedActivity(actorId, deck)` after a successful deck creation;
- `recordSignificantDeckUpdateActivity(actorId, deck)` after a meaningful saved deck change;
- `recordCollectionUpdatedActivity(actorId, addedCards)` after a collection mutation, with a maximum four-card snapshot;
- `removeActivitiesForEntity(actorId, entityKey)` when the source entity is deleted.

These functions live in `src/features/community/server/activity-service.ts`. Call them only after the source mutation succeeds. They check profile visibility and write actor/card snapshots, which prevents feed rendering from causing N+1 reads.

## Privacy

Public profile, decks, collection, and activity visibility are independent. Turning off activity marks recent central and materialized entries unpublished. Public server loaders enforce the section switches even though trusted Admin SDK reads bypass Firestore rules.

Community documents, relations, and feeds are server-only in Firebase Security Rules. Public visibility is applied by the Next.js server before serializing UID-free DTOs, so a browser cannot bypass section privacy or recover internal relation IDs directly from Firestore. Avatar and banner uploads are the only community client write: they are constrained to the authenticated user's fixed WebP paths, image MIME types, and 2 MB / 5 MB limits.

## Migration and deployment

Preview the idempotent legacy migration against the emulator:

```bash
npm run firebase:backfill-community -- --dry-run
```

For a live project, both preview and execution require the explicit `--allow-live` flag. Resolve any reported normalized-username collisions before execution. Deploy `firestore.rules`, `storage.rules`, and `firestore.indexes.json` before exposing the routes; composite indexes can take time to build.
