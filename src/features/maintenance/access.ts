const LOCALE_PREFIX = /^\/(?:fr|en)(?=\/|$)/;

function applicationPath(pathname: string) {
  return pathname.replace(LOCALE_PREFIX, "") || "/";
}

export function isMaintenanceBypassPath(pathname: string) {
  const path = applicationPath(pathname);
  return (
    path === "/login" ||
    path.startsWith("/login/") ||
    path === "/verify-email" ||
    path.startsWith("/verify-email/") ||
    path === "/admin" ||
    path.startsWith("/admin/")
  );
}

export function shouldRenderMaintenance(input: {
  enabled: boolean;
  pathname: string;
  isAdmin: boolean;
}) {
  if (!input.enabled || isMaintenanceBypassPath(input.pathname)) return false;
  return !input.isAdmin;
}
