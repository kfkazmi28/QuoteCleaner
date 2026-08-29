import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { EMAIL_SENDER, COMPANY_NAME, SUPPORT_EMAIL, WEBSITE_URL, EMAIL_FOOTER_HTML } from "@/lib/company-config"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { subject, message, userEmail } = body

    if (!subject || !message || !userEmail) {
      return NextResponse.json(
        { error: "Missing required fields: subject, message, userEmail" },
        { status: 400 }
      )
    }

    const timestamp = new Date().toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "UTC",
    })

    const { data, error } = await resend.emails.send({
      from: EMAIL_SENDER,
      to: [SUPPORT_EMAIL],
      reply_to: userEmail,
      subject: `[Support] ${subject}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: #f4f4f5; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">New Support Message</p>
            <p style="margin: 4px 0 0; font-size: 20px; font-weight: 700; color: #18181b;">${subject}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7; width: 120px; color: #71717a; font-size: 13px; vertical-align: top;">From</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7; color: #18181b; font-size: 14px;">
                <a href="mailto:${userEmail}" style="color: #0d9488; text-decoration: none;">${userEmail}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7; color: #71717a; font-size: 13px; vertical-align: top;">Subject</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7; color: #18181b; font-size: 14px;">${subject}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #71717a; font-size: 13px; vertical-align: top;">Sent</td>
              <td style="padding: 10px 0; color: #18181b; font-size: 14px;">${timestamp} UTC</td>
            </tr>
          </table>

          <div style="background: #fff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">Message</p>
            <p style="margin: 0; font-size: 15px; color: #18181b; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>

          <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
            Hit reply to respond directly to ${userEmail}
          </p>

          ${EMAIL_FOOTER_HTML}
        </div>
      `,
    })

    if (error) {
      console.error("[support] Resend error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id }, { status: 200 })
  } catch (err) {
    console.error("[support] Unexpected error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
