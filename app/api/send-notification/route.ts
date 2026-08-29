import { NextResponse } from "next/server";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

console.log("RESEND KEY EXISTS:", !!apiKey);
console.log(
  "RESEND KEY PREFIX:",
  apiKey ? apiKey.substring(0, 3) : "NONE"
);

const resend = new Resend(apiKey);

export async function POST(req: Request) {
  try {
    const { to, subject, message } = await req.json();

    console.log("SEND NOTIFICATION");
    console.log("TO:", to);
    console.log(
      "HAS RESEND KEY:",
      !!process.env.RESEND_API_KEY
    );

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: "Missing notification data" },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: "All State Roofing <onboarding@resend.dev>",
      to: [to],
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;padding:25px">
          <h2 style="color:#111827">All State Roofing</h2>

          <div style="
            background:#f9fafb;
            padding:20px;
            border-radius:12px;
            border:1px solid #e5e7eb;
          ">
            <h3>${subject}</h3>
            <p>${message}</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("RESEND ERROR:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log("EMAIL SENT:", data?.id);

    return NextResponse.json({
      success: true,
      id: data?.id,
    });

  } catch (error: any) {
    console.error("NOTIFICATION ERROR:", error);

    return NextResponse.json(
      { error: error.message || "Notification failed" },
      { status: 500 }
    );
  }
}