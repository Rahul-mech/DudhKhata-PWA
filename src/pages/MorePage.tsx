import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function MorePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-dvh bg-[var(--background)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3">
        <div className="mx-auto max-w-lg">
          <h1 className="text-lg font-semibold">More</h1>
          <p className="text-xs text-[var(--muted-foreground)]">
            {user?.displayName || user?.email || "Account"}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-3 px-4 py-4">
        <Link
          to="/reports"
          className="block rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 hover:bg-[var(--muted)]"
        >
          <p className="text-sm font-semibold">Monthly settlement</p>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            Month totals · print PDF · WhatsApp summary
          </p>
        </Link>

        <Link
          to="/settings"
          className="block rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 hover:bg-[var(--muted)]"
        >
          <p className="text-sm font-semibold">Settings</p>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            Base rate, apply rate to a month, sign out
          </p>
        </Link>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-4">
          <p className="text-sm font-semibold">DudhKhata</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Digital milk ledger · Fat-based pricing · Monthly settlement
          </p>
        </div>
      </main>
    </div>
  );
}
