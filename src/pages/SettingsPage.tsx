import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { listenSettings, saveSettings } from "../lib/db";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [baseRate, setBaseRate] = useState("90");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    return listenSettings(user.uid, (s) => {
      if (s?.baseRate) setBaseRate(String(s.baseRate));
    });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const rate = parseFloat(baseRate);
    if (!rate || rate <= 0) {
      alert("Enter valid rate");
      return;
    }
    setSaving(true);
    try {
      await saveSettings(user.uid, rate);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[var(--background)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link to="/" className="text-sm text-[var(--muted-foreground)]">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4 space-y-4">
        <form onSubmit={handleSave} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
            Base Rate (for Fat 10)
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
            Formula: Litres × Fat × (Base Rate ÷ 10)
          </p>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 w-full rounded-xl bg-[var(--primary)] py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : saved ? "Saved!" : "Save Rate"}
          </button>
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
