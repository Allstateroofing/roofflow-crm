import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** Klient Supabase qe vepron si perdoruesi i loguar (respekton RLS). */
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Thirrur nga nje Server Component — rifreskimi i sesionit
            // behet nga proxy.ts, ndaj kjo mund te injorohet.
          }
        },
      },
    }
  );
}

export type Guard =
  | { ok: true; userId: string; role: string; fullName: string | null }
  | { ok: false; response: NextResponse };

/**
 * Verifikon ne SERVER se kush po thërret dhe cfare roli ka.
 *
 * Kontrollet ne klient (RoleGuard) fshehin vetem UI-ne — nje kerkese e
 * drejtperdrejte i anashkalon. Cdo route handler qe prek te dhena
 * duhet ta thirre kete.
 */
export async function requireRole(allowedRoles: string[]): Promise<Guard> {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "You need to sign in." },
        { status: 401 }
      ),
    };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, active, full_name")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Your account has no profile. Ask an admin to set it up." },
        { status: 403 }
      ),
    };
  }

  if (!profile.active) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Your account is disabled." },
        { status: 403 }
      ),
    };
  }

  if (!allowedRoles.includes(profile.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "You do not have permission to do that." },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    userId: user.id,
    role: profile.role,
    fullName: profile.full_name ?? null,
  };
}
