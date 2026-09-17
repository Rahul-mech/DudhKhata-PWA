import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { listenContacts, listenEntries } from "../lib/db";
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
        {/* Filters */}
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

        {/* Summary */}
        <div className="flex justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm">
          <span className="text-[var(--muted-foreground)]">
            {filtered.length} entries · {totalLitres.toFixed(2)} L
          </span>
          <span className="font-semibold tabular-nums">{formatInr(totalAmt)}</span>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm text-[var(--muted-foreground)]">
            No entries found
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border)] bg-[var(--muted)]">
                <tr>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-2 py-2 font-medium">Contact</th>
                  <th className="px-2 py-2 font-medium text-right">M</th>
                  <th className="px-2 py-2 font-medium text-right">E</th>
                  <th className="px-3 py-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((e) => {
                  const t = entryTotals(e);
                  return (
                    <tr key={e.id}>
                      <td className="px-3 py-2 whitespace-nowrap">{e.entryDate}</td>
                      <td className="px-2 py-2 max-w-[100px] truncate">
                        <Link
                          to={`/contacts/${e.contactId}`}
                          className="text-[var(--primary)] hover:underline"
                        >
                          {nameOf(e.contactId)}
                        </Link>
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        {e.morningLitres ? `${e.morningLitres}@${e.morningFat}` : "-"}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        {e.eveningLitres ? `${e.eveningLitres}@${e.eveningFat}` : "-"}
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums">{formatInr(t.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-center text-xs text-[var(--muted-foreground)]">
          Tip: Contact name pe click karke uska pura hisab dekh sakte ho
        </p>
      </main>
    </div>
  );
}
