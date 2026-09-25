import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

// Auth note: this function uses verify_jwt = true in config.toml, so Supabase's
// gateway validates the caller's JWT (anon or service_role) before the request
// reaches this code. No in-function auth check is needed.

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables')
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // Reject anon-key callers. verify_jwt=true only validates signature and
  // accepts both anon and authenticated JWTs; the anon key is public, so
  // require a real signed-in user (or service_role) to call this endpoint.
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  let callerRole: 'authenticated' | 'service_role' | null = null
  let callerUserId: string | null = null
  let callerEmail: string | null = null
  const token = authHeader.replace('Bearer ', '')
  // Fast-path: raw service_role key from trusted server-to-server callers
  // (edge functions using SUPABASE_SERVICE_ROLE_KEY). getClaims can fail to
  // verify legacy-signed service-role JWTs, so accept the exact key match too.
  if (token === supabaseServiceKey) {
    callerRole = 'service_role'
  } else {
    // Try structured claims first
    try {
      const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? supabaseServiceKey)
      const { data: claimsData } = await authClient.auth.getClaims(token)
      const role = claimsData?.claims?.role
      if (role === 'authenticated' || role === 'service_role') {
        callerRole = role as 'authenticated' | 'service_role'
        callerUserId = (claimsData?.claims?.sub as string) || null
        callerEmail = ((claimsData?.claims?.email as string) || '').toLowerCase() || null
      }
    } catch { /* fall through to raw decode */ }
    // Fallback: decode the JWT payload without verification. verify_jwt=true has
    // already validated the signature at the Supabase gateway, so trusting the
    // payload's role claim here is safe.
    if (!callerRole) {
      try {
        const parts = token.split('.')
        if (parts.length === 3) {
          const pad = (s: string) => s + '='.repeat((4 - (s.length % 4)) % 4)
          const b64 = pad(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
          const payload = JSON.parse(atob(b64))
          const role = payload?.role
          if (role === 'authenticated' || role === 'service_role') {
            callerRole = role
            callerUserId = payload?.sub || null
            callerEmail = (payload?.email || '').toString().toLowerCase() || null
          }
        }
      } catch { /* ignore */ }
    }
    if (!callerRole) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  // Parse request body
  let templateName: string
  let recipientEmail: string
  let idempotencyKey: string
  let messageId: string
  let templateData: Record<string, any> = {}
  try {
    const body = await req.json()
    templateName = body.templateName || body.template_name
    recipientEmail = body.recipientEmail || body.recipient_email
    messageId = crypto.randomUUID()
    idempotencyKey = body.idempotencyKey || body.idempotency_key || messageId
    if (body.templateData && typeof body.templateData === 'object') {
      templateData = body.templateData
    }
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON in request body' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  if (!templateName) {
    return new Response(
      JSON.stringify({ error: 'templateName is required' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // 1. Look up template from registry (early — needed to resolve recipient)
  const template = TEMPLATES[templateName]

  if (!template) {
    console.error('Template not found in registry', { templateName })
    return new Response(
      JSON.stringify({
        error: `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(', ')}`,
      }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // Resolve effective recipient: template-level `to` takes precedence over
  // the caller-provided recipientEmail. This allows notification templates
  // to always send to a fixed address (e.g., site owner from env var).
  const effectiveRecipient = template.to || recipientEmail

  if (!effectiveRecipient) {
    return new Response(
      JSON.stringify({
        error: 'recipientEmail is required (unless the template defines a fixed recipient)',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // Create Supabase client with service role (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Ownership guard: an authenticated (non-service_role) caller may only send
  // to recipients they own — self, their clients, bookings, employees, or a
  // join-request they submitted. This prevents platform-branded email abuse.
  if (callerRole === 'authenticated') {
    const recipLower = effectiveRecipient.toLowerCase()
    let allowed = false
    if (callerEmail && recipLower === callerEmail) {
      allowed = true
    }
    if (!allowed && callerUserId) {
      const checks = await Promise.all([
        supabase.from('clients').select('id').eq('user_id', callerUserId).ilike('email', recipLower).limit(1).maybeSingle(),
        supabase.from('bookings').select('id').eq('user_id', callerUserId).ilike('client_email', recipLower).limit(1).maybeSingle(),
        supabase.from('employees').select('id').eq('user_id', callerUserId).ilike('email', recipLower).limit(1).maybeSingle(),
        supabase.from('employee_join_requests').select('id').eq('requester_auth_id', callerUserId).ilike('requester_email', recipLower).limit(1).maybeSingle(),
        // Owner-notification templates: allow sending to the business owner's email when the caller is the owner
        supabase.from('business_settings').select('user_id').eq('user_id', callerUserId).ilike('business_email', recipLower).limit(1).maybeSingle(),
      ])
      allowed = checks.some((r) => r.data)
      // Also allow the caller to email the owner of a company they submitted a join request to.
      if (!allowed) {
        const { data: joinOwner } = await supabase
          .from('employee_join_requests')
          .select('user_id')
          .eq('requester_auth_id', callerUserId)
          .limit(50)
        if (joinOwner && joinOwner.length) {
          const ownerIds = joinOwner.map((r: any) => r.user_id)
          const { data: ownerMatch } = await supabase
            .from('business_settings')
            .select('user_id')
            .in('user_id', ownerIds)
            .ilike('business_email', recipLower)
            .limit(1)
            .maybeSingle()
          if (ownerMatch) allowed = true
        }
      }
    }
    if (!allowed) {
      console.warn('app-email: recipient not owned by caller', {
        callerUserId,
        templateName,
      })
      return new Response(
        JSON.stringify({ error: 'Recipient not permitted for this account' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }


  // Send through Lovable's managed email API (suppression enforced server-side).
  const json = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  const log = async (row: Record<string, unknown>) => {
    const { error } = await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      ...row,
    })
    if (error) console.error('email_send_log insert failed', { code: error.code, message: error.message })
  }

  try {
    const result = await sendTemplateEmail(templateName, effectiveRecipient, {
      templateData,
      idempotencyKey,
    })
    if (!result.sent) {
      await log({ status: 'suppressed' })
      return json({ success: false, reason: 'email_suppressed' })
    }
    await log({ status: 'sent' })
    return json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Email send failed', { templateName, message })
    await log({ status: 'failed', error_message: message })
    return json({ error: 'Failed to send email' }, 500)
  }
})
