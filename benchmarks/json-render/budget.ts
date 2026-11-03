export function reserveCost(inputBytes: number, maxOutputTokens: number, pricing: any) {
  if (pricing.prompt == null || pricing.completion == null) throw new Error("Missing prices; paid runs disabled");
  const input = Number(pricing.prompt), output = Number(pricing.completion);
  if (!Number.isFinite(input) || !Number.isFinite(output) || input < 0 || output < 0) throw new Error("Missing or invalid prices; paid runs disabled");
  // UTF-8 bytes plus chat framing allowance conservatively bound text input tokens.
  return ((inputBytes + 1024) * input + maxOutputTokens * output) * 1.25;
}
export class Budget {
  used = 0;
  constructor(public maximum: number) { if (!(maximum > 0) || !Number.isFinite(maximum)) throw new Error("Set a finite positive --max-spend-usd"); }
  reserve(amount: number) { if (!Number.isFinite(amount) || amount < 0 || this.used + amount > this.maximum) throw new Error("Spend cap reached before starting next call"); this.used += amount; }
  settle(reserved: number, actual: number | null) {
    // Keep the full reservation for incomplete/unknown usage, never treat it as free.
    if (actual !== null && Number.isFinite(actual) && actual >= 0) this.used += actual - reserved;
    if (this.used > this.maximum) throw new Error("Reported charge exceeded the conservative reservation; stop the run");
  }
}
