/**
 * Centralized company branding and contact configuration.
 * Update these values once to change branding across the entire app.
 */

export const COMPANY_NAME = "CleanQuote Pro"
export const SUPPORT_EMAIL = "hello@quotecleaner.com"
export const SALES_EMAIL = "hello@quotecleaner.com"
export const NOREPLY_EMAIL = "hello@quotecleaner.com"
export const WEBSITE_URL = "https://quotecleaner.com"

// Formatted sender for outgoing emails
export const EMAIL_SENDER = `${COMPANY_NAME} <${NOREPLY_EMAIL}>`

// Email footer content
export const EMAIL_FOOTER_TEXT = `${COMPANY_NAME} — Professional Cleaning Quote Software`
export const EMAIL_FOOTER_HTML = `
  <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
    <p style="margin: 0 0 8px 0; font-weight: 600; color: #374151;">${COMPANY_NAME}</p>
    <p style="margin: 0 0 12px 0;">Professional Cleaning Quote Software</p>
    <p style="margin: 0;">
      <a href="${WEBSITE_URL}" style="color: #0d9488; text-decoration: none;">${WEBSITE_URL.replace('https://', '')}</a>
      &nbsp;&middot;&nbsp;
      <a href="mailto:${SUPPORT_EMAIL}" style="color: #0d9488; text-decoration: none;">${SUPPORT_EMAIL}</a>
    </p>
  </div>
`

// Reusable email wrapper for consistent styling
export function wrapEmailHtml(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${COMPANY_NAME}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 32px 24px;">
              ${content}
              ${EMAIL_FOOTER_HTML}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}
