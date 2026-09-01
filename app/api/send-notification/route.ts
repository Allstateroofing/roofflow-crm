import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireRole } from "@/lib/supabase-server";

const resend = new Resend(process.env.RESEND_API_KEY);

/** Teksti vjen nga perdoruesi dhe futet ne HTML — beje te padjegshem. */
function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: Request) {
  // Njoftimet i dergon zyra: admini dhe sekretarja.
  const guard = await requireRole(["admin", "secretary"]);

  if (!guard.ok) {
    return guard.response;
  }

  try {
    const { to, subject, message } = await req.json();

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: "Recipient, subject and message are all required." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(to))) {
      return NextResponse.json(
        { error: `"${to}" is not a valid email address.` },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: "All State Roofing <onboarding@resend.dev>",
      to: [String(to)],
      subject: String(subject),
      html: `
        <div style="font-family:Arial,sans-serif;padding:25px">
          <h2 style="color:#111827">All State Roofing</h2>

          <div style="
            background:#f9fafb;
            padding:20px;
            border-radius:12px;
            border:1px solid #e5e7eb;
          ">
            <h3>${escapeHtml(subject)}</h3>
            <p>${escapeHtml(message)}</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("RESEND ERROR:", error);

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error: any) {
    console.error("NOTIFICATION ERROR:", error);

    return NextResponse.json(
      { error: error.message || "Notification failed" },
      { status: 500 }
    );
  }
}
