import { SiteHeader } from "@/components/layout/site-header";
import { getSiteHeaderUser } from "@/components/layout/site-header-user";

export async function PublicHeader() {
  const user = await getSiteHeaderUser();
  return <SiteHeader user={user} />;
}
