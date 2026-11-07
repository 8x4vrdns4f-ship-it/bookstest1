export const CLAIM_CONFLICT = "This request is already being processed or has been handled";

export function claimDecision<T extends { id: string; charge_attempts: number }>(row: T | null) {
  if (!row) return { claimed: false as const, status: 409, message: CLAIM_CONFLICT };
  return { claimed: true as const, row, idempotencyKey: `accept-${row.id}-${row.charge_attempts}` };
}