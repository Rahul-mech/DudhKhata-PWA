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
  updatedAt: string;
}

export const EXTRA_LABELS: Record<ExtraType, string> = {
  advance_given: "Advance Given",
  advance_received: "Advance Received",
  ghee: "Ghee",
  other: "Other",
};

export const KIND_LABELS: Record<ContactKind, string> = {
  customer: "Customer",
  supplier: "Supplier",
};
