import assert from "node:assert/strict";

import {
  isMaintenanceBypassPath,
  shouldRenderMaintenance,
} from "../src/features/maintenance/access.ts";
import { maintenanceUpdateSchema } from "../src/features/maintenance/schema.ts";

assert.equal(
  shouldRenderMaintenance({ enabled: false, pathname: "/fr", isAdmin: false }),
  false,
  "The public site must remain available while maintenance is disabled.",
);
assert.equal(
  shouldRenderMaintenance({ enabled: true, pathname: "/fr", isAdmin: false }),
  true,
  "A visitor must see maintenance mode.",
);
assert.equal(
  shouldRenderMaintenance({ enabled: true, pathname: "/en/cards", isAdmin: false }),
  true,
  "A signed-in regular member must see maintenance mode.",
);
assert.equal(
  shouldRenderMaintenance({ enabled: true, pathname: "/fr/community", isAdmin: true }),
  false,
  "An administrator claim must bypass maintenance mode.",
);
assert.equal(
  shouldRenderMaintenance({ enabled: true, pathname: "/en/decks", isAdmin: true }),
  false,
  "An administrator role must bypass maintenance mode.",
);
assert.equal(isMaintenanceBypassPath("/fr/admin/settings"), true);
assert.equal(isMaintenanceBypassPath("/en/login"), true);
assert.equal(isMaintenanceBypassPath("/fr/verify-email"), true);
assert.equal(isMaintenanceBypassPath("/fr/register"), false);

const configured = maintenanceUpdateSchema.parse({
  enabled: true,
  translations: {
    fr: { title: "Mise à jour", message: "Déploiement en cours." },
    en: { title: "Update", message: "Deployment in progress." },
  },
  estimatedEndAtIso: "2026-09-29T21:30:00.000Z",
  showEstimatedEnd: true,
});

assert.equal(configured.translations.fr.title, "Mise à jour");
assert.equal(configured.translations.en.title, "Update");
assert.equal(configured.showEstimatedEnd, true);
assert.throws(() =>
  maintenanceUpdateSchema.parse({
    ...configured,
    translations: {
      ...configured.translations,
      fr: { title: "", message: "Déploiement en cours." },
    },
  }),
);

console.log("Maintenance access and configuration scenarios passed.");
