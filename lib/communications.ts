// Shared types, merge fields, and default content for the Communications module.
// Delivery providers (email/SMS) are intentionally not wired here yet.

export type Channel = "email" | "sms"

export type MessageKey =
  | "quote_sent"
  | "quote_follow_up"
  | "appointment_confirmation"
  | "reminder_24h"
  | "reminder_2h"
  | "invoice_sent"
  | "payment_reminder"
  | "review_request"

export type Timing =
  | "immediately"
  | "1_hour_before"
  | "2_hours_before"
  | "24_hours_before"
  | "48_hours_before"
  | "1_day_after"
  | "3_days_after"
  | "7_days_after"

export type EventStatus = "queued" | "scheduled" | "sent" | "delivered" | "failed" | "canceled"

export interface CommunicationTemplate {
  id: string
  user_id: string
  key: MessageKey
  name: string
  channel: Channel
  subject: string | null
  body: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface CommunicationAutomation {
  id: string
  user_id: string
  key: MessageKey
  name: string
  description: string | null
  enabled: boolean
  email_enabled: boolean
  sms_enabled: boolean
  email_template_id: string | null
  sms_template_id: string | null
  timing: Timing
  created_at: string
  updated_at: string
}

export interface CommunicationEvent {
  id: string
  user_id: string
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  channel: Channel
  message_type: string
  template_id: string | null
  automation_id: string | null
  quote_id: string | null
  invoice_id: string | null
  calendar_event_id: string | null
  status: EventStatus
  subject: string | null
  body: string | null
  provider: string | null
  provider_message_id: string | null
  error_message: string | null
  scheduled_for: string | null
  sent_at: string | null
  created_at: string
}

export interface CommunicationSettings {
  user_id: string
  business_hours_start: string
  business_hours_end: string
  business_days: string[]
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  email_sender_name: string | null
  email_reply_to: string | null
  sms_sender: string | null
  timezone: string
}

export const MERGE_FIELDS: { token: string; label: string; example: string }[] = [
  { token: "{{customer_first_name}}", label: "Customer first name", example: "Sarah" },
  { token: "{{company_name}}", label: "Company name", example: "Sparkle Clean Co." },
  { token: "{{appointment_date}}", label: "Appointment date", example: "Sep 12, 2026" },
  { token: "{{appointment_time}}", label: "Appointment time", example: "10:00 AM" },
  { token: "{{service_address}}", label: "Service address", example: "123 Main St, Austin, TX" },
  { token: "{{quote_total}}", label: "Quote total", example: "$238.00" },
  { token: "{{invoice_link}}", label: "Invoice link", example: "https://quotecleaner.app/i/abc123" },
  { token: "{{payment_link}}", label: "Payment link", example: "https://pay.quotecleaner.app/abc123" },
]

export const TIMING_OPTIONS: { value: Timing; label: string }[] = [
  { value: "immediately", label: "Immediately" },
  { value: "1_hour_before", label: "1 hour before" },
  { value: "2_hours_before", label: "2 hours before" },
  { value: "24_hours_before", label: "24 hours before" },
  { value: "48_hours_before", label: "48 hours before" },
  { value: "1_day_after", label: "1 day after" },
  { value: "3_days_after", label: "3 days after" },
  { value: "7_days_after", label: "7 days after" },
]

export const WEEKDAYS: { value: string; label: string }[] = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
]

interface DefaultDefinition {
  key: MessageKey
  name: string
  description: string
  trigger: string
  defaultTiming: Timing
  email: { subject: string; body: string }
  sms: { body: string }
}

export const MESSAGE_DEFINITIONS: DefaultDefinition[] = [
  {
    key: "quote_sent",
    name: "Quote Sent",
    description: "Sent when a quote is emailed or texted to a customer.",
    trigger: "When a quote is sent",
    defaultTiming: "immediately",
    email: {
      subject: "Your cleaning quote from {{company_name}}",
      body:
        "Hi {{customer_first_name}},\n\nThanks for reaching out to {{company_name}}. Your cleaning quote for {{service_address}} comes to {{quote_total}}.\n\nReply to this email or give us a call if you have any questions or would like to schedule.\n\nWe look forward to working with you,\n{{company_name}}",
    },
    sms: {
      body: "Hi {{customer_first_name}}, your cleaning quote from {{company_name}} is {{quote_total}}. Reply here with any questions or to book!",
    },
  },
  {
    key: "quote_follow_up",
    name: "Quote Follow-up",
    description: "A friendly nudge after a quote has gone unanswered.",
    trigger: "After a quote is sent",
    defaultTiming: "3_days_after",
    email: {
      subject: "Still thinking it over, {{customer_first_name}}?",
      body:
        "Hi {{customer_first_name}},\n\nJust checking in on the cleaning quote we sent for {{service_address}} ({{quote_total}}). We'd love to get you on the schedule.\n\nIf anything about the quote needs adjusting, let us know and we'll make it work.\n\nThanks,\n{{company_name}}",
    },
    sms: {
      body: "Hi {{customer_first_name}}, following up on your {{quote_total}} cleaning quote from {{company_name}}. Ready to book or have questions? Just reply here.",
    },
  },
  {
    key: "appointment_confirmation",
    name: "Appointment Confirmation",
    description: "Confirms the booking details once a cleaning is scheduled.",
    trigger: "When an appointment is scheduled",
    defaultTiming: "immediately",
    email: {
      subject: "You're booked: {{appointment_date}} at {{appointment_time}}",
      body:
        "Hi {{customer_first_name}},\n\nYour cleaning with {{company_name}} is confirmed.\n\nDate: {{appointment_date}}\nTime: {{appointment_time}}\nAddress: {{service_address}}\n\nIf you need to reschedule, just reply to this email.\n\nSee you soon,\n{{company_name}}",
    },
    sms: {
      body: "{{company_name}}: You're confirmed for {{appointment_date}} at {{appointment_time}} at {{service_address}}. Reply to reschedule.",
    },
  },
  {
    key: "reminder_24h",
    name: "24-Hour Reminder",
    description: "Reminds the customer the day before their cleaning.",
    trigger: "Before an appointment",
    defaultTiming: "24_hours_before",
    email: {
      subject: "Reminder: your cleaning is tomorrow",
      body:
        "Hi {{customer_first_name}},\n\nA quick reminder that {{company_name}} will be at {{service_address}} tomorrow, {{appointment_date}}, at {{appointment_time}}.\n\nPlease make sure we have access to the home. Let us know if anything has changed.\n\nThanks,\n{{company_name}}",
    },
    sms: {
      body: "Reminder from {{company_name}}: your cleaning is tomorrow, {{appointment_date}} at {{appointment_time}}. Reply if anything has changed.",
    },
  },
  {
    key: "reminder_2h",
    name: "2-Hour Reminder",
    description: "A same-day heads-up shortly before arrival.",
    trigger: "Before an appointment",
    defaultTiming: "2_hours_before",
    email: {
      subject: "We'll see you at {{appointment_time}}",
      body:
        "Hi {{customer_first_name}},\n\nOur team is on schedule and will arrive at {{service_address}} around {{appointment_time}} today.\n\nSee you soon,\n{{company_name}}",
    },
    sms: {
      body: "{{company_name}}: our team is on the way and will arrive around {{appointment_time}} today. See you soon!",
    },
  },
  {
    key: "invoice_sent",
    name: "Invoice Sent",
    description: "Delivers the invoice after the job is complete.",
    trigger: "When an invoice is sent",
    defaultTiming: "immediately",
    email: {
      subject: "Your invoice from {{company_name}}",
      body:
        "Hi {{customer_first_name}},\n\nThank you for choosing {{company_name}}. Your invoice for the cleaning at {{service_address}} is ready.\n\nView invoice: {{invoice_link}}\nPay online: {{payment_link}}\n\nWe appreciate your business,\n{{company_name}}",
    },
    sms: {
      body: "Thanks for choosing {{company_name}}, {{customer_first_name}}! Your invoice is ready: {{invoice_link}}",
    },
  },
  {
    key: "payment_reminder",
    name: "Payment Reminder",
    description: "Reminds the customer about an unpaid invoice.",
    trigger: "After an invoice is sent",
    defaultTiming: "3_days_after",
    email: {
      subject: "Friendly reminder: invoice from {{company_name}}",
      body:
        "Hi {{customer_first_name}},\n\nThis is a friendly reminder that your invoice from {{company_name}} is still open.\n\nPay securely here: {{payment_link}}\n\nIf you've already paid, thank you and please disregard this note.\n\n{{company_name}}",
    },
    sms: {
      body: "Hi {{customer_first_name}}, a reminder that your {{company_name}} invoice is still open. Pay here: {{payment_link}}",
    },
  },
  {
    key: "review_request",
    name: "Review Request",
    description: "Asks for a review after a completed cleaning.",
    trigger: "After an appointment",
    defaultTiming: "1_day_after",
    email: {
      subject: "How did we do, {{customer_first_name}}?",
      body:
        "Hi {{customer_first_name}},\n\nThank you for having {{company_name}} clean your home. We hope everything looks great.\n\nIf you have a moment, we'd really appreciate a quick review. It helps other homeowners find us.\n\nThanks again,\n{{company_name}}",
    },
    sms: {
      body: "Thanks for choosing {{company_name}}, {{customer_first_name}}! If you have a moment, we'd love a quick review.",
    },
  },
]

/** Replace merge tokens with sample values for previews. */
export function renderPreview(text: string): string {
  return MERGE_FIELDS.reduce((out, f) => out.split(f.token).join(f.example), text)
}

export function formatTiming(t: Timing): string {
  return TIMING_OPTIONS.find((o) => o.value === t)?.label ?? t
}
