import { MinimalHome } from "@/components/home/minimal-home";
import { mockCards } from "@/constants/mock-cards";
import { getUserSession } from "@/lib/auth/user-session";
export default async function HomePage() {
  const session = await getUserSession();

  return (
    <MinimalHome
      cards={mockCards}
      signedIn={Boolean(session)}
    />
  );
}
