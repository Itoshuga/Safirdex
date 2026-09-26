export interface CommunityActionState {
  status: "idle" | "success" | "error";
  code?: string;
}

export const initialCommunityActionState: CommunityActionState = {
  status: "idle",
};
