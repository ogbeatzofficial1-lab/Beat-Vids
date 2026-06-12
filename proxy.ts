// proxy.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Automatically keeps the user session cookie fresh and synced
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Protected route checking: Redirect unauthenticated requests to login
  const { data: { user } } = await supabase.auth.getUser();
  const isStudioPage = request.nextUrl.pathname.startsWith("/studio");
  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard");

  if ((isStudioPage || isDashboardPage) && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

// Configures exactly which paths the proxy checks
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
