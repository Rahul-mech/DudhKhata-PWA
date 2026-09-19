import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAccess } from "../hooks/useAccess";
import {
  listenAllAccess,
  setAccessStatus,
  type AccessRecord,
} from "../lib/access";

export default function AdminPage() {
  const { user } = useAuth();
  const { isOwner } = useAccess();
  const [list, setList] = useState<AccessRecord[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!isOwner) return;
    return listenAllAccess(setList);
  }, [isOwner]);

  if (!isOwner) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--background)] px-4">
        <p className="text-sm text-[var(--muted-foreground)]">Admins only</p>
      </div>
    );
  }

  const pending = list.filter((r) => r.status === "pending");
  const approved = list.filter((r) => r.status === "approved");
  const blocked = list.filter((r) => r.status === "blocked");

  const act = async (uid: string, status: "approved" | "blocked" | "pending") => {
    setBusy(uid);
    try {
      await setAccessStatus(uid, status);
    } finally {
      setBusy(null);
    }
  };

  const Row = ({ r }: { r: AccessRecord }) => (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
      <p className="text-sm font-medium truncate">{r.displayName || "—"}</p>
      <p className="text-xs text-[var(--muted-foreground)] truncate">{r.email}</p>
      <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
        {r.status} · {r.createdAt?.slice(0, 10)}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {r.status !== "approved" && (
          <button
            type="button"
            disabled={busy === r.uid}
            onClick={() => act(r.uid, "approved")}
            className="rounded-lg bg-[var(--collect)] px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50"
          >
            Approve
          </button>
        )}
        {r.status !== "blocked" && r.email !== user?.email?.toLowerCase() && (
          <button
            type="button"
            disabled={busy === r.uid}
            onClick={() => act(r.uid, "blocked")}
            className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 disabled:opacity-50"
          >
            Block
          </button>
        )}
        {r.status === "blocked" && (
          <button
            type="button"
            disabled={busy === r.uid}
            onClick={() => act(r.uid, "pending")}
            className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium disabled:opacity-50"
          >
            Unblock → pending
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[var(--background)] pb-8">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3">
        <div className="mx-auto max-w-lg">
          <Link to="/more" className="text-sm text-[var(--muted-foreground)]">
            ← More
          </Link>
          <h1 className="text-lg font-semibold">Access admin</h1>
          <p className="text-xs text-[var(--muted-foreground)]">
            Approve who can use DudhKhata
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-6 px-4 py-4">
        <section>
          <h2 className="mb-2 text-sm font-medium">Pending ({pending.length})</h2>
          {pending.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)]">No pending requests</p>
          ) : (
            <div className="space-y-2">
              {pending.map((r) => (
                <Row key={r.uid} r={r} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-medium">Approved ({approved.length})</h2>
          <div className="space-y-2">
            {approved.map((r) => (
              <Row key={r.uid} r={r} />
            ))}
          </div>
        </section>

        {blocked.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-medium">Blocked ({blocked.length})</h2>
            <div className="space-y-2">
              {blocked.map((r) => (
                <Row key={r.uid} r={r} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
