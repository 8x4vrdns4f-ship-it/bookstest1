/** No-show maths for the free calculator. Deposits are assumed to recover ~70% of no-shows. */
export const DEPOSIT_RECOVERY = 0.7;

export function noShowLoss(avgPrice: number, perWeek: number, weeksOpen = 50) {
  const p = Math.max(0, avgPrice || 0);
  const n = Math.max(0, perWeek || 0);
  const weekly = p * n;
  const yearly = weekly * weeksOpen;
  return { weekly, monthly: (yearly / 12), yearly, recovered: yearly * DEPOSIT_RECOVERY };
}
