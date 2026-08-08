export const PENDING_VERIFICATION_EMAIL_KEY = "booksuite.pendingVerificationEmail";
export const PENDING_AUTH_DESTINATION_KEY = "booksuite.pendingAuthDestination";

export const buildJoinPath = (companyCode: string, email: string) =>
  `/join?company=${encodeURIComponent(companyCode.trim().toUpperCase())}&email=${encodeURIComponent(email.trim())}`;

export const getInviteCompanyCode = (params: URLSearchParams): string => {
  const current = params.get("company")?.trim();
  if (current) return current.toUpperCase();

  // Older invite links used `code`, which now belongs to the auth callback.
  const legacyCodes = params.getAll("code");
  const legacyCompanyCode = legacyCodes.find((value) => /^BS-/i.test(value.trim()));
  return (legacyCompanyCode ?? "").toUpperCase();
};

export const getSafeRelativeDestination = (value: string | null): string =>
  value && /^\/(?!\/)/.test(value) ? value : "";