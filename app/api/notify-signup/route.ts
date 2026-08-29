import { Resend } from "resend"
import { EMAIL_SENDER, COMPANY_NAME, SUPPORT_EMAIL, wrapEmailHtml } from "@/lib/company-config"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    await resend.emails.send({
      from: EMAIL_SENDER,
      to: SUPPORT_EMAIL,
      subject: `New ${COMPANY_NAME} Signup`,
      html: wrapEmailHtml(`
        <h2 style="margin: 0 0 16px; font-size: 20px; color: #18181b;">New User Signup</h2>
        <p style="margin: 0 0 8px; font-size: 15px; color: #374151;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 0; font-size: 15px; color: #374151;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      `),
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false }, { status: 500 })
  }
}
