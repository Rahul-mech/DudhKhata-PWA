import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import {
  ensureAccessRecord,
  listenAccess,
  isOwnerEmail,
  type AccessRecord,
  type AccessStatus,
} from "../lib/access";

export function useAccess() {
  const { user, loading: authLoading } = useAuth();
  const [record, setRecord] = useState<AccessRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRecord(null);
      setLoading(false);
      return;
    }

    let unsub = () => {};
    let cancelled = false;

    (async () => {
      try {
        await ensureAccessRecord(user);
        if (cancelled) return;
        unsub = listenAccess(user.uid, (r) => {
          setRecord(r);
          setLoading(false);
        });
      } catch (err) {
        console.error("Access check failed", err);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      unsub();
    };
  }, [user, authLoading]);

  const status: AccessStatus | null = record?.status ?? null;
  const isApproved = status === "approved";
  const isOwner = isOwnerEmail(user?.email);

  return {
    record,
    status,
    isApproved,
    isOwner,
    loading: authLoading || loading,
  };
}
