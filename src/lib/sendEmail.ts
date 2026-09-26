import { supabase } from "@/integrations/supabase/client";

export async function sendEmail(
  templateName: string,
  recipientEmail: string,
  idempotencyKey: string,
  templateData: Record<string, unknown> = {},
  businessUserId?: string
) {
  try {
    const { error } = await supabase.functions.invoke("app-email", {
      body: { templateName, recipientEmail, idempotencyKey, templateData, businessUserId },
    });
    if (error) console.error("[sendEmail]", templateName, error);
  } catch (e) {
    console.error("[sendEmail threw]", templateName, e);
  }
}

export function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return d; }
}
export function formatTime(t: string): string { return (t || "").slice(0, 5); }
