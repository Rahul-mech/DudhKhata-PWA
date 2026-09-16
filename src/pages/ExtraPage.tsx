import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { listenContacts, saveExtra } from "../lib/db";
import { todayIsoDate } from "../lib/calc";
import type { Contact, ExtraType } from "../types";
import { EXTRA_LABELS } from "../types";

export default function ExtraPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactId, setContactId] = useState("");
  const [type, setType] = useState<ExtraType>("advance_received");
  const [amount, setAmount] = useState("");
  const [entryDate, setEntryDate] = useState(todayIsoDate());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    return listenContacts(user.uid, setContacts);
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !contactId) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      alert("Enter valid amount");
      return;
    }
    setSaving(true);
    try {
      await saveExtra(user.uid, {
        contactId,
        type,
        amount: amt,
        entryDate,
        note,
      });
      navigate("/");
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
          <h1 className="text-lg font-semibold">Extra Transaction</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Contact</label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                required
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              >
                <option value="">Select contact</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.kind})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ExtraType)}
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              >
                {(Object.keys(EXTRA_LABELS) as ExtraType[]).map((k) => (
                  <option key={k} value={k}>
                    {EXTRA_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Date</label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                required
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Note (optional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !contactId}
            className="w-full rounded-xl bg-[var(--primary)] py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
      </main>
    </div>
  );
}
