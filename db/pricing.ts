export interface Fee {
  label: string;
  amount: number | null;
  frequency: string;
  required: boolean;
}

/** Known fixed costs only; optional and usage-dependent expenses stay separate. */
export function calculateCosts(rent: number, fees: Fee[]) {
  const monthly = fees.filter(
    (fee) => fee.required && fee.frequency === "monthly",
  );
  const once = fees.filter((fee) => fee.required && fee.frequency === "once");
  const knownMonthlySubtotal =
    rent + monthly.reduce((sum, fee) => sum + (fee.amount ?? 0), 0);
  const monthlyTotal = monthly.some((fee) => fee.amount === null)
    ? null
    : knownMonthlySubtotal;
  const knownMoveInSubtotal =
    knownMonthlySubtotal +
    once.reduce((sum, fee) => sum + (fee.amount ?? 0), 0);
  return {
    monthlyTotal,
    knownMonthlySubtotal,
    moveInTotal:
      monthlyTotal === null || once.some((fee) => fee.amount === null)
        ? null
        : knownMoveInSubtotal,
    knownMoveInSubtotal,
    excludes:
      "Optional fees and usage-dependent utilities. Move-in includes the first month and required one-time charges, including refundable deposits.",
  };
}
