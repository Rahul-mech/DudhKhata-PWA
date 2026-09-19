/** Kept for old Firestore docs; UI no longer uses customer/supplier. */
export type ContactKind = "customer" | "supplier";

export type ExtraType = "advance_given" | "advance_received" | "ghee" | "other";

export interface Contact {
  id: string;
  name: string;
  phone: string;
  kind: ContactKind;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface MilkEntry {
  id: string;
  contactId: string;
  entryDate: string;
  morningLitres: number;
  morningFat: number;
  eveningLitres: number;
  eveningFat: number;
  baseRate: number;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExtraTxn {
  id: string;
  contactId: string;
  type: ExtraType;
  amount: number;
  entryDate: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  baseRate: number;
  monthlyRates?: Record<string, number>;
  updatedAt: string;
}

export const EXTRA_LABELS: Record<ExtraType, string> = {
  advance_given: "Advance / Payment (deduct)",
  advance_received: "Advance / Payment (deduct)",
  ghee: "Ghee (add)",
  other: "Other (add)",
};

export function monthKeyFromDate(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function currentMonthKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
