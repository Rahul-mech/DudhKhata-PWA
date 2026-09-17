import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { listenSettings, saveSettings, applyRateToMonth } from "../lib/db";
import { currentMonthKey } from "../types";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [baseRate, setBaseRate] = useState("90");
  const [monthlyRates, setMonthlyRates] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [applyMonth, setApplyMonth] = useState(currentMonthKey());
  const [applyRate, setApplyRate] = useState("95");
  const [applying, setApplying] = useState(false);
  const [applyMsg, setApplyMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    return listenSettings(user.uid, (s) => {
      if (s?.baseRate) setBaseRate(String(s.baseRate));
      if (s?.monthlyRates) setMonthlyRates(s.monthlyRates);
    });
  }, [user]);

  const handleSaveDefault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const rate = parseFloat(baseRate);
    if (!rate || rate <= 0) {
      alert("Enter valid rate");
      return;
    }
    setSaving(true);
    try {
      await saveSettings(user.uid, { baseRate: rate, monthlyRates });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const rate = parseFloat(applyRate);
    if (!rate || rate <= 0) {
      alert("Enter valid rate");
      return;
    }
    if (
      !confirm(
        `Apply rate Rs ${rate} to ALL milk entries in ${applyMonth}?\n\nOnly this month changes. Other months stay same.`
      )
    ) {
      return;
    }
    setApplying(true);
    setApplyMsg("");
    try {
      const count = await applyRateToMonth(user.uid, applyMonth, rate);
      const nextRates = { ...monthlyRates, [applyMonth]: rate };
      await saveSettings(user.uid, {
        baseRate: parseFloat(baseRate) || rate,
        monthlyRates: nextRates,
      });
      setMonthlyRates(nextRates);
      setApplyMsg(
        count === 0
          ? `No entries in ${applyMonth}. Rate saved for future.`
          : `Updated ${count} entries in ${applyMonth} to Rs ${rate}.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed";
      setApplyMsg(msg);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[var(--background)] pb-8">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link to="/" className="text-sm text-[var(--muted-foreground)]">
            Back
          </Link>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4 space-y-4">
        <form
          onSubmit={handleSaveDefault}
          className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
        >
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
            Default Base Rate (new entries only)
          </label>
          <input
            type="number"
            step="0.01"
            min="1"
            value={baseRate}
            onChange={(e) => setBaseRate(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
          />
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            Formula: Litres x Fat x (Rate / 10). Does not change old entries.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 w-full rounded-xl bg-[var(--primary)] py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : saved ? "Saved!" : "Save default rate"}
          </button>
        </form>

        <form
          onSubmit={handleApplyMonth}
          className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3"
        >
          <p className="text-sm font-medium">Apply rate to a whole month</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Use when broker changes rate mid-month. Only selected month updates.
          </p>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted-foreground)]">Month</label>
            <input
              type="month"
              value={applyMonth}
              onChange={(e) => setApplyMonth(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted-foreground)]">New rate</label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={applyRate}
              onChange={(e) => setApplyRate(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={applying}
            className="w-full rounded-xl border border-[var(--primary)] py-2.5 text-sm font-medium text-[var(--primary)] disabled:opacity-60"
          >
            {applying ? "Updating..." : "Apply to this month"}
          </button>
          {applyMsg && (
            <p className="text-xs text-[var(--muted-foreground)]">{applyMsg}</p>
          )}
          {Object.keys(monthlyRates).length > 0 && (
            <div className="pt-2 border-t border-[var(--border)]">
              <p className="text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Saved month rates
              </p>
              <ul className="text-xs space-y-0.5">
                {Object.entries(monthlyRates)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([m, r]) => (
                    <li key={m}>
                      {m}: Rs {r}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </form>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-sm text-[var(--muted-foreground)]">Signed in as</p>
          <p className="mt-1 font-medium">{user?.displayName || user?.email}</p>
          <button
            onClick={() => signOut()}
            className="mt-4 w-full rounded-xl border border-red-200 py-2.5 text-sm font-medium text-red-600"
          >
            Sign out
          </button>
        </div>
      </main>
    </div>
  );
}
