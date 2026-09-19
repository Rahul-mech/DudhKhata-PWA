import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./firebase";

/**
 * IMPORTANT: Apna Google account email yahan lowercase me likho.
 * Ye emails auto-approved + Admin page dekh sakte hain.
 * Example: "rahul@gmail.com"
 */
export const OWNER_EMAILS: string[] = [
  // "your.email@gmail.com",
];

export type AccessStatus = "pending" | "approved" | "blocked";

export type AccessRecord = {
  uid: string;
  email: string;
  displayName: string;
  status: AccessStatus;
  createdAt: string;
  updatedAt: string;
};

function nowIso() {
  return new Date().toISOString();
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  return OWNER_EMAILS.some((o) => o.toLowerCase().trim() === e);
}

/**
 * Ensure access doc exists. Owners auto-approved.
 * If OWNER_EMAILS is empty, everyone is approved (open mode)
 * so existing deploy doesn't lock you out before you add your email.
 */
export async function ensureAccessRecord(user: User): Promise<AccessRecord> {
  const ref = doc(db, "access", user.uid);
  const snap = await getDoc(ref);
  const email = (user.email || "").toLowerCase();
  const displayName = user.displayName || "";

  if (snap.exists()) {
    const data = snap.data() as AccessRecord;
    // Promote to approved if now in owner list
    if (isOwnerEmail(email) && data.status !== "approved") {
      const updated: AccessRecord = {
        ...data,
        email,
        displayName,
        status: "approved",
        updatedAt: nowIso(),
      };
      await setDoc(ref, updated, { merge: true });
      return updated;
    }
    return { ...data, uid: user.uid };
  }

  const openMode = OWNER_EMAILS.length === 0;
  const status: AccessStatus =
    openMode || isOwnerEmail(email) ? "approved" : "pending";

  const record: AccessRecord = {
    uid: user.uid,
    email,
    displayName,
    status,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await setDoc(ref, record);
  return record;
}

export function listenAccess(
  uid: string,
  cb: (record: AccessRecord | null) => void
) {
  const ref = doc(db, "access", uid);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      cb(null);
      return;
    }
    cb({ uid, ...(snap.data() as Omit<AccessRecord, "uid">) });
  });
}

export function listenAllAccess(cb: (items: AccessRecord[]) => void) {
  const q = query(collection(db, "access"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const list: AccessRecord[] = [];
    snap.forEach((d) => {
      list.push({ uid: d.id, ...(d.data() as Omit<AccessRecord, "uid">) });
    });
    cb(list);
  });
}

export async function setAccessStatus(uid: string, status: AccessStatus) {
  const ref = doc(db, "access", uid);
  await updateDoc(ref, { status, updatedAt: nowIso() });
}
