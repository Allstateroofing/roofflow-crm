import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Kontroll optimist para se te renderohet dashboard-i, plus rifreskimi i
 * sesionit. Dokumentacioni i Next 16 e thote qarte se proxy-ja nuk eshte
 * zgjidhje autorizimi — autorizimi i vertete rri te route handler-at
 * (lib/supabase-server.ts) dhe te politikat RLS. Kjo vetem kthen mbrapsht
 * ata qe nuk kane sesion fare.
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/auth/login", request.url);

    // Mbaj mend ku po shkonte, qe ta kthejme aty pas hyrjes.
    loginUrl.searchParams.set(
      "next",
      request.nextUrl.pathname + request.nextUrl.search
    );

    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
