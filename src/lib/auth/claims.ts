export interface AdminClaims {
  admin?: unknown;
  roles?: unknown;
}

export function hasAdminClaim(value: object) {
  const claims = value as AdminClaims;
  return (
    claims.admin === true ||
    (Array.isArray(claims.roles) && claims.roles.includes("admin"))
  );
}
