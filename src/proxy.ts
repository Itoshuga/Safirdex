import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";

import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-safirdex-pathname", request.nextUrl.pathname);

  return handleI18nRouting(
    new NextRequest(request, { headers: requestHeaders }),
  );
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
