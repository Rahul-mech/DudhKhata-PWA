import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  limit,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./firebase";

/**
 * Owner emails — auto-approved + Access admin page.
 * Must be exact Google login email, lowercase.
 */
export const OWNER_EMAILS: string[] = [
  "gurumaincastle1@gmail.com",
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

/** True if this uid already used the app before access system (has data). */
async function hasExistingAppData(uid: string): Promise<boolean> {
  try {
    const settings = await getDoc(doc(db, "users", uid, "meta", "settings"));
    if (settings.exists()) return true;

    const contactsSnap = await getDocs(
      query(collection(db, "users", uid, "contacts"), limit(1))
    );
    if (!contactsSnap.empty) return true;

    const entriesSnap = await getDocs(
      query(collection(db, "users", uid, "entries"), limit(1))
    );
    if (!entriesSnap.empty) return true;

    return false;
  } catch {
    return false;
  }
}

/**
 * Ensure access doc exists.
 * - Owner email → approved
 * - Already has contacts/entries/settings → approved (old user)
 * - Brand new account → pending
 * - OWNER_EMAILS empty → everyone approved (open mode)
 */
export async function ensureAccessRecord(user: User): Promise<AccessRecord> {
  const ref = doc(db, "access", user.uid);
  const snap = await getDoc(ref);
  const email = (user.email || "").toLowerCase();
  const displayName = user.displayName || "";

  if (snap.exists()) {
    const data = snap.data() as AccessRecord;
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
  let status: AccessStatus = "pending";

  if (openMode || isOwnerEmail(email)) {
    status = "approved";
  } else {
    // Purane users jinke paas pehle se data hai → auto approve
    const legacy = await hasExistingAppData(user.uid);
    status = legacy ? "approved" : "pending";
  }

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
