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

export function extraSigned(
  kind: Contact["kind"],
  extra: Pick<ExtraTxn, "type" | "amount">
): number {
  switch (extra.type) {
    case "ghee":
    case "other":
      return extra.amount;
    case "advance_received":
      return kind === "customer" ? -extra.amount : extra.amount;
    case "advance_given":
      return kind === "customer" ? extra.amount : -extra.amount;
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
    sum += extraSigned(contact.kind, x);
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
