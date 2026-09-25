import { createEmailWebhookHandler } from 'npm:@lovable.dev/email-js@0.1.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

// Notification-only record of delivery outcomes in the app's existing tables.
// Lovable enforces suppression at send time; these rows never gate sends.
function db() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
}

async function record(
  eventId: string,
  recipient: string,
  messageId: string | undefined,
  reason: 'bounce' | 'complaint' | 'unsubscribe',
  status: 'bounced' | 'complained' | 'suppressed',
  message: string,
) {
  const supabase = db()
  const email = recipient.toLowerCase()

  const { error: suppressError } = await supabase
    .from('suppressed_emails')
    .upsert({ email, reason, metadata: null }, { onConflict: 'email' })
  if (suppressError) {
    console.error('Failed to upsert suppressed email', {
      event_id: eventId,
      code: suppressError.code,
      message: suppressError.message,
    })
    throw new Error('Failed to write suppression')
  }

  const { error: logError } = await supabase.from('email_send_log').insert({
    message_id: messageId ?? null,
    template_name: 'system',
    recipient_email: email,
    status,
    error_message: message,
    metadata: null,
  })
  if (logError) {
    console.error('Failed to insert email_send_log', {
      event_id: eventId,
      code: logError.code,
      message: logError.message,
    })
    throw new Error('Failed to write send log')
  }
}

const handler = createEmailWebhookHandler({
  apiKey: Deno.env.get('LOVABLE_API_KEY')!,
  on: {
    'email.bounced': async (event) => {
      await record(event.event_id, event.data.recipient, event.data.message_id, 'bounce', 'bounced',
        'Permanent bounce — email address is invalid or rejected')
    },
    'email.complaint': async (event) => {
      await record(event.event_id, event.data.recipient, event.data.message_id, 'complaint', 'complained',
        'Spam complaint — recipient marked email as spam')
    },
    'email.unsubscribed': async (event) => {
      await record(event.event_id, event.data.recipient, event.data.message_id, 'unsubscribe', 'suppressed',
        'Recipient unsubscribed')
    },
  },
})

Deno.serve((req) => handler(req))
