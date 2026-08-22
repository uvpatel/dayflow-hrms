const MONEY_PATTERN = /^\d+(?:\.\d{1,2})?$/;

export function moneyToCents(value: string): bigint {
  if (!MONEY_PATTERN.test(value)) {
    throw new Error("Money values must be non-negative with at most two decimals");
  }

  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
}

export function centsToMoney(value: bigint): string {
  if (value < BigInt(0)) {
    throw new Error("Money values cannot be negative");
  }

  const whole = value / BigInt(100);
  const fraction = (value % BigInt(100)).toString().padStart(2, "0");
  return `${whole}.${fraction}`;
}

export function calculateNetSalary(gross: string, deductions: string): string {
  const grossCents = moneyToCents(gross);
  const deductionCents = moneyToCents(deductions);
  if (deductionCents > grossCents) {
    throw new Error("Deductions cannot exceed gross salary");
  }
  return centsToMoney(grossCents - deductionCents);
}
