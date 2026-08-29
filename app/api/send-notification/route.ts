import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { to, subject, message } = await req.json();

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: "Missing notification data" },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: "All State Roofing <notifications@allstateroofing.com>",
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
      console.error(error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: data?.id,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      { error: error.message || "Notification failed" },
      { status: 500 }
    );
  }
}