import { publicOrigin } from "@/lib/publicUrl";

export const buildInviteUrl = (companyCode: string, email: string) =>
  `${publicOrigin()}/join?code=${encodeURIComponent(companyCode)}&email=${encodeURIComponent(email)}`;

export async function sendEmployeeInvite(opts: {
  employeeId?: string;
  name: string;
  email: string;
  businessName: string;
  companyCode: string;
}) {
  const { sendEmail } = await import("@/lib/sendEmail");
  await sendEmail(
    "employee-invited",
    opts.email,
    `emp-invite-${opts.employeeId ?? opts.email}-${Date.now()}`,
    {
      inviteeName: opts.name,
      businessName: opts.businessName || "the team",
      companyCode: opts.companyCode,
      joinUrl: buildInviteUrl(opts.companyCode, opts.email),
    }
  );
}
