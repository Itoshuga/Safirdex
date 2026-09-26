import { AccountControls } from "@/components/community/account-controls";
import { ConnectionsSheet } from "@/components/community/connections-sheet";
import { PrivacyForm } from "@/components/community/privacy-form";
import { ProfileEditor } from "@/components/community/profile-editor";
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
  owner,
  connections,
}: {
  profile: PublicProfileView;
  viewer: ProfileViewerState;
  mode: "owner" | "public";
  tab: ProfileTab;
  content: ProfileTabContent;
  basePath: string;
  owner?: { userId: string; email: string; isAdmin: boolean };
  connections?: {
    kind: "followers" | "following";
    items: CommunityConnectionItem[];
    nextCursor?: string;
  };
}) {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="site-container py-8 sm:py-12">
        <ProfileHeader
          profile={profile}
          viewer={viewer}
          mode={mode}
          activeTab={tab}
          basePath={basePath}
        />
        <section className="mt-8">
          <ProfileTabContentView content={content} basePath={basePath} />
        </section>
        {mode === "owner" && owner ? (
          <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
            <ProfileEditor profile={profile} userId={owner.userId} />
            <div className="space-y-6">
              <PrivacyForm visibility={profile.visibility} />
              <AccountControls email={owner.email} isAdmin={owner.isAdmin} />
            </div>
          </div>
        ) : null}
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
