import { ConnectionsSheet } from "@/components/community/connections-sheet";
import { ProfileHeader } from "@/components/community/profile-header";
import { ProfileTabContentView } from "@/components/community/profile-tab-content";
import { PublicHeader } from "@/components/layout/public-header";
import type {
  CommunityConnectionItem,
  ProfileTab,
  ProfileTabContent,
  ProfileViewerState,
  PublicProfileView,
} from "@/features/community/types";

export function ProfilePage({
  profile,
  viewer,
  mode,
  tab,
  content,
  basePath,
  connections,
}: {
  profile: PublicProfileView;
  viewer: ProfileViewerState;
  mode: "owner" | "public";
  tab: ProfileTab;
  content: ProfileTabContent;
  basePath: string;
  connections?: {
    kind: "followers" | "following";
    items: CommunityConnectionItem[];
    nextCursor?: string;
  };
}) {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="site-container py-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <ProfileHeader
            profile={profile}
            viewer={viewer}
            mode={mode}
            activeTab={tab}
            basePath={basePath}
          />
          <section className="mt-8 sm:mt-10">
            <ProfileTabContentView content={content} basePath={basePath} owner={mode === "owner"} />
          </section>
        </div>
      </main>
      {connections ? (
        <ConnectionsSheet
          kind={connections.kind}
          items={connections.items}
          nextCursor={connections.nextCursor}
          basePath={basePath}
          signedIn={viewer.signedIn}
        />
      ) : null}
    </div>
  );
}
