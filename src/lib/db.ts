import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Contact, MilkEntry, ExtraTxn, UserSettings } from "../types";
import { newId, nowIso } from "./utils";

function userCol(uid: string, name: string) {
  return collection(db, "users", uid, name);
}

// ---------- Contacts ----------
export function listenContacts(uid: string, cb: (items: Contact[]) => void) {
  const q = query(userCol(uid, "contacts"), orderBy("name"));
  return onSnapshot(q, (snap) => {
    const list: Contact[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Contact, "id">) }));
    cb(list);
  });
}

export async function saveContact(uid: string, data: Partial<Contact> & { name: string; kind: Contact["kind"] }) {
  const id = data.id || newId();
  const ref = doc(db, "users", uid, "contacts", id);
  const payload = {
    name: data.name.trim(),
    phone: (data.phone || "").trim(),
    kind: data.kind,
    note: (data.note || "").trim(),
    updatedAt: nowIso(),
    ...(data.id ? {} : { createdAt: nowIso() }),
  };
  await setDoc(ref, payload, { merge: true });
  return id;
}

export async function removeContact(uid: string, id: string) {
  await deleteDoc(doc(db, "users", uid, "contacts", id));
}

// ---------- Entries ----------
export function listenEntries(uid: string, cb: (items: MilkEntry[]) => void) {
  const q = query(userCol(uid, "entries"), orderBy("entryDate", "desc"));
  return onSnapshot(q, (snap) => {
    const list: MilkEntry[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<MilkEntry, "id">) }));
    cb(list);
  });
}

export async function saveEntry(
  uid: string,
  data: {
    id?: string;
    contactId: string;
    entryDate: string;
    morningLitres: number;
    morningFat: number;
    eveningLitres: number;
    eveningFat: number;
    baseRate: number;
    note?: string;
  }
) {
  const id = data.id || newId();
  const ref = doc(db, "users", uid, "entries", id);
  const payload = {
    contactId: data.contactId,
    entryDate: data.entryDate,
    morningLitres: data.morningLitres || 0,
    morningFat: data.morningFat || 0,
    eveningLitres: data.eveningLitres || 0,
    eveningFat: data.eveningFat || 0,
    baseRate: data.baseRate,
    note: (data.note || "").trim(),
    updatedAt: nowIso(),
    ...(data.id ? {} : { createdAt: nowIso() }),
  };
  await setDoc(ref, payload, { merge: true });
  return id;
}

export async function removeEntry(uid: string, id: string) {
  await deleteDoc(doc(db, "users", uid, "entries", id));
}

/** Update baseRate on all milk entries in a given month (YYYY-MM). Returns count updated. */
export async function applyRateToMonth(uid: string, monthKey: string, newRate: number): Promise<number> {
  const snap = await getDocs(userCol(uid, "entries"));
  const batch = writeBatch(db);
  let count = 0;
  snap.forEach((d) => {
    const data = d.data() as MilkEntry;
    if (data.entryDate && data.entryDate.startsWith(monthKey)) {
      batch.update(d.ref, { baseRate: newRate, updatedAt: nowIso() });
      count++;
    }
  });
  if (count > 0) await batch.commit();
  return count;
}

// ---------- Extras ----------
export function listenExtras(uid: string, cb: (items: ExtraTxn[]) => void) {
  const q = query(userCol(uid, "extras"), orderBy("entryDate", "desc"));
  return onSnapshot(q, (snap) => {
    const list: ExtraTxn[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<ExtraTxn, "id">) }));
    cb(list);
  });
}

export async function saveExtra(
  uid: string,
  data: {
    id?: string;
    contactId: string;
    type: ExtraTxn["type"];
    amount: number;
    entryDate: string;
    note?: string;
  }
) {
  const id = data.id || newId();
  const ref = doc(db, "users", uid, "extras", id);
  const payload = {
    contactId: data.contactId,
    type: data.type,
    amount: data.amount,
    entryDate: data.entryDate,
    note: (data.note || "").trim(),
    updatedAt: nowIso(),
    ...(data.id ? {} : { createdAt: nowIso() }),
  };
  await setDoc(ref, payload, { merge: true });
  return id;
}

export async function removeExtra(uid: string, id: string) {
  await deleteDoc(doc(db, "users", uid, "extras", id));
}

// ---------- Settings ----------
export function listenSettings(uid: string, cb: (s: UserSettings | null) => void) {
  const ref = doc(db, "users", uid, "meta", "settings");
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) cb(snap.data() as UserSettings);
    else cb(null);
  });
}

export async function saveSettings(
  uid: string,
  data: { baseRate: number; monthlyRates?: Record<string, number> }
) {
  const ref = doc(db, "users", uid, "meta", "settings");
  await setDoc(
    ref,
    {
      baseRate: data.baseRate,
      ...(data.monthlyRates !== undefined ? { monthlyRates: data.monthlyRates } : {}),
      updatedAt: nowIso(),
    },
    { merge: true }
  );
}
