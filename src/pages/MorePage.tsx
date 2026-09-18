import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const links = [
  {
    to: "/reports",
    title: "Monthly Settlement",
    desc: "Contact-wise totals, print & WhatsApp",
  },
  {
    to: "/settings",
    title: "Settings",
    desc: "Base rate, apply rate to month, sign out",
  },
];

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
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="block rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 hover:bg-[var(--muted)]"
          >
            <p className="text-sm font-semibold">{l.title}</p>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{l.desc}</p>
          </Link>
        ))}

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
