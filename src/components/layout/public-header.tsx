import { SiteHeader } from "@/components/layout/site-header";
import { getUserSession } from "@/lib/auth/user-session";

export async function PublicHeader() {
  const session = await getUserSession();
  return (
    <SiteHeader
      user={session ? { name: session.name, email: session.email } : null}
    />
  );
}
