export interface AdminActionState {
  status: "idle" | "success" | "error";
  message?: string;
  id?: string;
  fieldErrors?: Record<string, string>;
}

export const INITIAL_ADMIN_ACTION_STATE: AdminActionState = {
  status: "idle",
};
