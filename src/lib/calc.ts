import type { Contact, ExtraTxn, MilkEntry } from "../types";

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Amount = Litres × Fat × (Base Rate ÷ 10) */
export function milkAmount(litres: number, fat: number, baseRate: number): number {
  if (!litres || !fat) return 0;
  return round2(litres * fat * (baseRate / 10));
}

export function entryTotals(
  entry: Pick<
    MilkEntry,
    "morningLitres" | "morningFat" | "eveningLitres" | "eveningFat" | "baseRate"
  >
) {
  const morning = milkAmount(entry.morningLitres, entry.morningFat, entry.baseRate);
  const evening = milkAmount(entry.eveningLitres, entry.eveningFat, entry.baseRate);
  const litres = round2(entry.morningLitres + entry.eveningLitres);
  return { morning, evening, litres, amount: round2(morning + evening) };
}

/**
 * Simple ledger math (no customer/supplier):
 * - Milk entries: always +amount
 * - Advance / payment: always −amount (deducted from milk total)
 * - Ghee / other goods: +amount (added to total)
 */
export function extraSigned(extra: Pick<ExtraTxn, "type" | "amount">): number {
  switch (extra.type) {
    case "advance_given":
    case "advance_received":
      return -Math.abs(extra.amount);
    case "ghee":
    case "other":
      return Math.abs(extra.amount);
    default:
      return extra.amount;
  }
}

export function contactBalance(
  contact: Contact,
  entries: MilkEntry[],
  extras: ExtraTxn[]
): number {
  let sum = 0;
  for (const e of entries) {
    if (e.contactId !== contact.id) continue;
    sum += entryTotals(e).amount;
  }
  for (const x of extras) {
    if (x.contactId !== contact.id) continue;
    sum += extraSigned(x);
  }
  return round2(sum);
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatLitres(n: number): string {
  return `${n.toFixed(2)} L`;
}

export function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
