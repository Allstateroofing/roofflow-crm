import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/supabase-server";

/** Rolet qe nje admin mund t'ia caktoje nje llogarie te re. */
const ASSIGNABLE_ROLES = [
  "admin",
  "manager",
  "secretary",
  "salesman",
  "worker",
];

export async function POST(req: Request) {
  // Vetem admini krijon perdorues. Kjo behet PARA se te preket
  // service role key-i, i cili anashkalon cdo politike RLS.
  const guard = await requireRole(["admin"]);

  if (!guard.ok) {
    return guard.response;
  }

  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are all required." },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Roli vjen nga klienti — mos e beso, verifikoje kundrejt listes.
    if (!ASSIGNABLE_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `"${role}" is not a valid role.` },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const user = data.user;

    if (!user) {
      return NextResponse.json(
        { error: "User creation failed" },
        { status: 400 }
      );
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: user.id,
        full_name: name,
        role: role,
        active: true,
        // Kartela e shitesit ose e punetorit krijohet vete nga trigger-i
        // fn_profile_role_record — nuk ka me hap te dyte lidhjeje.
      });

    if (profileError) {
      // Pa profil, llogaria nuk hyn dot askund — mos e lini gjysmake.
      await supabaseAdmin.auth.admin.deleteUser(user.id);

      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, user: user.id });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
