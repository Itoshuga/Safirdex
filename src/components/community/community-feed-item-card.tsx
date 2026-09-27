import { ActivityCard } from "@/components/community/activity-card";
import { CommunityPostCard } from "@/components/community/community-post-card";
import type { CommunityFeedItem } from "@/features/community/types";

export function CommunityFeedItemCard({
  item,
  compact = false,
  viewerId,
  onDeleted,
}: {
  item: CommunityFeedItem;
  compact?: boolean;
  viewerId?: string | null;
  onDeleted?: (postId: string) => void;
}) {
  return item.kind === "post"
    ? <CommunityPostCard post={item.post} compact={compact} onDeleted={onDeleted} />
    : <ActivityCard activity={item.activity} compact={compact} viewerId={viewerId} />;
}
