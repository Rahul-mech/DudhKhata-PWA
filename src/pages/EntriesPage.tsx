import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { listenContacts, listenEntries, removeEntry } from "../lib/db";
import { entryTotals, formatInr } from "../lib/calc";
import type { Contact, MilkEntry } from "../types";

export default function EntriesPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [entries, setEntries] = useState<MilkEntry[]>([]);
  const [filterContact, setFilterContact] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");

  useEffect(() => {
    if (!user) return;
    const u1 = listenContacts(user.uid, setContacts);
    const u2 = listenEntries(user.uid, setEntries);
    return () => {
      u1();
      u2();
    };
  }, [user]);

  const nameOf = (id: string) => contacts.find((c) => c.id === id)?.name ?? "—";

  const months = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => set.add(e.entryDate.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [entries]);

  const filtered = useMemo(() => {
    return entries
      .filter((e) => {
        if (filterContact !== "all" && e.contactId !== filterContact) return false;
        if (filterMonth !== "all" && !e.entryDate.startsWith(filterMonth)) return false;
        return true;
      })
      .sort((a, b) => (a.entryDate < b.entryDate ? 1 : -1));
  }, [entries, filterContact, filterMonth]);

  const totalAmt = filtered.reduce((s, e) => s + entryTotals(e).amount, 0);
  const totalLitres = filtered.reduce((s, e) => s + entryTotals(e).litres, 0);

  const handleDelete = async (id: string) => {
    if (!user || !confirm("Delete this entry? Totals will update automatically.")) return;
    await removeEntry(user.uid, id);
  };

  return (
    <div className="min-h-dvh bg-[var(--background)] pb-8">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link to="/" className="text-sm text-[var(--muted-foreground)]">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold">All Entries</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <select
            value={filterContact}
            onChange={(e) => setFilterContact(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm outline-none"
          >
            <option value="all">All contacts</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm outline-none"
          >
            <option value="all">All months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm">
          <span className="text-[var(--muted-foreground)]">
            {filtered.length} entries · {totalLitres.toFixed(2)} L
          </span>
          <span className="font-semibold tabular-nums">{formatInr(totalAmt)}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm text-[var(--muted-foreground)]">
            No entries found
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((e) => {
              const t = entryTotals(e);
              return (
                <div
                  key={e.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {e.entryDate}{" · "}
                        <Link
                          to={`/contacts/${e.contactId}`}
                          className="text-[var(--primary)] hover:underline"
                        >
                          {nameOf(e.contactId)}
                        </Link>
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        M: {e.morningLitres || 0}L @{e.morningFat || 0}%
                        {" · "}
                        E: {e.eveningLitres || 0}L @{e.eveningFat || 0}%
                      </p>
                      <p className="mt-1 text-sm font-semibold tabular-nums">
                        {formatInr(t.amount)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Link
                        to={`/entry?edit=${e.id}`}
                        className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(e.id)}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
