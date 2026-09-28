import "server-only";

import { cache } from "react";

import { hasAdminClaim } from "@/lib/auth/claims";
import { getUserSession } from "@/lib/auth/user-session";
import { publicProfilesRepository } from "@/repositories/public-profiles.repository";

export interface SiteHeaderUser {
  name?: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
  isAdmin: boolean;
}

export const getSiteHeaderUser = cache(
  async (): Promise<SiteHeaderUser | null> => {
    const session = await getUserSession();
    if (!session) return null;

    const profile = await publicProfilesRepository.getById(session.uid);

    return {
      isAdmin: hasAdminClaim(session),
      ...(profile?.displayName || session.name
        ? { name: profile?.displayName ?? session.name }
        : {}),
      ...(profile?.username ? { username: profile.username } : {}),
      ...(session.email ? { email: session.email } : {}),
      ...(profile?.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
    };
  },
);
