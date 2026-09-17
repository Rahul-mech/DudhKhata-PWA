import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { listenContacts, listenEntries, listenSettings, saveEntry } from "../lib/db";
import { milkAmount, formatInr, todayIsoDate } from "../lib/calc";
import type { Contact, MilkEntry } from "../types";

export default function EntryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit") || "";

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [entries, setEntries] = useState<MilkEntry[]>([]);
  const [baseRate, setBaseRate] = useState(90);
  const [contactId, setContactId] = useState("");
  const [entryDate, setEntryDate] = useState(todayIsoDate());
  const [mLitres, setMLitres] = useState("");
  const [mFat, setMFat] = useState("");
  const [eLitres, setELitres] = useState("");
  const [eFat, setEFat] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!editId);

  useEffect(() => {
    if (!user) return;
    const unsub1 = listenContacts(user.uid, setContacts);
    const unsub2 = listenSettings(user.uid, (s) => {
      if (s?.baseRate) setBaseRate(s.baseRate);
    });
    const unsub3 = listenEntries(user.uid, setEntries);
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [user]);

  // Prefill when editing
  useEffect(() => {
    if (!editId || entries.length === 0 || loaded) return;
    const existing = entries.find((e) => e.id === editId);
    if (existing) {
      setContactId(existing.contactId);
      setEntryDate(existing.entryDate);
      setMLitres(existing.morningLitres ? String(existing.morningLitres) : "");
      setMFat(existing.morningFat ? String(existing.morningFat) : "");
      setELitres(existing.eveningLitres ? String(existing.eveningLitres) : "");
      setEFat(existing.eveningFat ? String(existing.eveningFat) : "");
      setNote(existing.note || "");
      setBaseRate(existing.baseRate || 90);
      setLoaded(true);
    }
  }, [editId, entries, loaded]);

  const ml = parseFloat(mLitres) || 0;
  const mf = parseFloat(mFat) || 0;
  const el = parseFloat(eLitres) || 0;
  const ef = parseFloat(eFat) || 0;

  const morningAmt = milkAmount(ml, mf, baseRate);
  const eveningAmt = milkAmount(el, ef, baseRate);
  const totalAmt = morningAmt + eveningAmt;
  const totalLitres = ml + el;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !contactId) return;
    if (totalLitres <= 0) {
      alert("Enter at least some litres");
      return;
    }
    setSaving(true);
    try {
      await saveEntry(user.uid, {
        id: editId || undefined,
        contactId,
        entryDate,
        morningLitres: ml,
        morningFat: mf,
        eveningLitres: el,
        eveningFat: ef,
        baseRate,
        note,
      });
      if (editId) {
        navigate(`/contacts/${contactId}`);
      } else {
        navigate("/");
      }
    } finally {
      setSaving(false);
    }
  };

  const backTo = editId && contactId ? `/contacts/${contactId}` : "/";

  return (
    <div className="min-h-dvh bg-[var(--background)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link to={backTo} className="text-sm text-[var(--muted-foreground)]">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold">{editId ? "Edit Entry" : "Add Entry"}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4">
        {editId && !loaded ? (
          <p className="text-sm text-[var(--muted-foreground)]">Loading entry...</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Contact</label>
                <select
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  required
                  disabled={!!editId}
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)] disabled:opacity-60"
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
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Date</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="mb-3 text-sm font-medium">Morning</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-[var(--muted-foreground)]">Litres</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={mLitres}
                    onChange={(e) => setMLitres(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--muted-foreground)]">Fat %</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={mFat}
                    onChange={(e) => setMFat(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                    placeholder="0.00"
                  />
                </div>
              </div>
              {morningAmt > 0 && (
                <p className="mt-2 text-right text-sm font-medium text-[var(--primary)]">
                  {formatInr(morningAmt)}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="mb-3 text-sm font-medium">Evening</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-[var(--muted-foreground)]">Litres</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={eLitres}
                    onChange={(e) => setELitres(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--muted-foreground)]">Fat %</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={eFat}
                    onChange={(e) => setEFat(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                    placeholder="0.00"
                  />
                </div>
              </div>
              {eveningAmt > 0 && (
                <p className="mt-2 text-right text-sm font-medium text-[var(--primary)]">
                  {formatInr(eveningAmt)}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">Total Litres</span>
                <span className="font-medium">{totalLitres.toFixed(2)} L</span>
              </div>
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">Base Rate</span>
                <span className="font-medium">₹{baseRate}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-[var(--border)] pt-2">
                <span className="font-medium">Total Amount</span>
                <span className="text-lg font-semibold text-[var(--primary)]">
                  {formatInr(totalAmt)}
                </span>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Note (optional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !contactId}
              className="w-full rounded-xl bg-[var(--primary)] py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : editId ? "Update Entry" : "Save Entry"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
