import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { FROM_DOMAIN, SITE_NAME } from './transactional-email-templates/send-email.ts'

/**
 * Resolves the sender identity used for customer-facing emails.
 *
 * Two modes, stored per business on business_settings.email_from_mode:
 *  - 'booksuite' (default): "Business Name via BookSuite <noreply@booksuite.online>",
 *    replies land with BookSuite support.
 *  - 'own': "Business Name <their-word@booksuite.online>", replies land in the
 *    business's own inbox (business_settings.business_email).
 *
 * The address always sits on the verified sending domain — that is what keeps
 * customer mail out of spam folders. Anything outside it is rejected.
 */

export const SUPPORT_EMAIL = 'help@booksuite.online'

export interface SenderIdentity {
  fromName: string
  fromAddress: string
  replyTo?: string
}

/** Local parts that would look official or collide with BookSuite's own mail. */
const RESERVED_LOCAL_PARTS = new Set([
  'noreply', 'no-reply', 'postmaster', 'abuse', 'admin', 'root', 'support', 'help',
  'mailer-daemon', 'daemon', 'bounce', 'bounces', 'feedback', 'unsubscribe',
  'security', 'webmaster', 'owner', 'hostmaster', 'booksuite', 'lovable',
])

/** True for a safe, human-readable local part such as "sarahs-salon". */
export function isValidLocalPart(value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (!/^[a-z0-9](?:[a-z0-9._-]{1,38}[a-z0-9])$/.test(value)) return false
  if (value.includes('..') || value.includes('--')) return false
  return !RESERVED_LOCAL_PARTS.has(value)
}

/** Turns a business name into a readable local part, e.g. "Sarah's Salon" -> "sarahs-salon". */
export function slugToLocalPart(businessName?: string | null): string {
  const base = (businessName || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 32)
    .replace(/-+$/g, '')
  const safe = base.length >= 3 ? base : base ? `${base}-booking` : 'booking'
  return RESERVED_LOCAL_PARTS.has(safe) ? `${safe}-booking` : safe
}

function cleanBusinessName(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.replace(/[\r\n\t<>]/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, 70)
}

function cleanEmail(value: unknown): string {
  if (typeof value !== 'string') return ''
  const email = value.trim().toLowerCase()
  if (!email || email.length > 254 || email.includes('@') === false) return ''
  if (/[\r\n<>"'\s]/.test(email)) return ''
  return email
}

function bookSuiteIdentity(): SenderIdentity {
  return {
    fromName: SITE_NAME,
    fromAddress: `noreply@${FROM_DOMAIN}`,
    replyTo: SUPPORT_EMAIL,
  }
}

/**
 * Reads the business's sender choice. Falls back to the BookSuite identity
 * whenever the account, its settings row, or the data needed is missing.
 */
export async function resolveSenderIdentity(
  supabase: SupabaseClient,
  userId: string | null | undefined
): Promise<SenderIdentity> {
  if (!userId) return bookSuiteIdentity()

  let row: Record<string, unknown> | null = null
  try {
    const { data, error } = await supabase
      .from('business_settings')
      .select('business_name, business_email, email_from_mode, email_from_local')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) {
      console.warn('sender-identity: settings read failed', { code: error.code })
      return bookSuiteIdentity()
    }
    row = (data as Record<string, unknown> | null) ?? null
  } catch {
    return bookSuiteIdentity()
  }

  const businessName = cleanBusinessName(row?.business_name)
  const replyEmail = cleanEmail(row?.business_email)

  if (row?.email_from_mode === 'own' && businessName) {
    const local = isValidLocalPart(row?.email_from_local)
      ? row!.email_from_local as string
      : slugToLocalPart(businessName)
    return {
      fromName: businessName,
      fromAddress: `${local}@${FROM_DOMAIN}`,
      replyTo: replyEmail || SUPPORT_EMAIL,
    }
  }

  return {
    fromName: businessName ? `${businessName} via ${SITE_NAME}` : SITE_NAME,
    fromAddress: `noreply@${FROM_DOMAIN}`,
    replyTo: SUPPORT_EMAIL,
  }
}
