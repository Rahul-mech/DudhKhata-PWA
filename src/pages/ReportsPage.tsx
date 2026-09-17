import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  listenContacts,
  listenEntries,
  listenExtras,
} from "../lib/db";
import {
  contactBalance,
  entryTotals,
  extraSigned,
  formatInr,
  formatLitres,
} from "../lib/calc";
import type { Contact, MilkEntry, ExtraTxn } from "../types";
import { KIND_LABELS, currentMonthKey } from "../types";

function inMonth(date: string, monthKey: string) {
  return date.startsWith(monthKey);
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [entries, setEntries] = useState<MilkEntry[]>([]);
  const [extras, setExtras] = useState<ExtraTxn[]>([]);
  const [month, setMonth] = useState(currentMonthKey());

  useEffect(() => {
    if (!user) return;
    const u1 = listenContacts(user.uid, setContacts);
    const u2 = listenEntries(user.uid, setEntries);
    const u3 = listenExtras(user.uid, setExtras);
    return () => {
      u1();
      u2();
      u3();
    };
  }, [user]);

  const months = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => set.add(e.entryDate.slice(0, 7)));
    extras.forEach((x) => set.add(x.entryDate.slice(0, 7)));
    set.add(currentMonthKey());
    return Array.from(set).sort().reverse();
  }, [entries, extras]);

  const monthEntries = entries.filter((e) => inMonth(e.entryDate, month));
  const monthExtras = extras.filter((x) => inMonth(x.entryDate, month));

  const totalMilk = monthEntries.reduce((s, e) => s + entryTotals(e).amount, 0);
  const totalLitres = monthEntries.reduce((s, e) => s + entryTotals(e).litres, 0);

  const rows = contacts
    .map((c) => {
      const cEntries = monthEntries.filter((e) => e.contactId === c.id);
      const cExtras = monthExtras.filter((x) => x.contactId === c.id);
      const milkAmt = cEntries.reduce((s, e) => s + entryTotals(e).amount, 0);
      const litres = cEntries.reduce((s, e) => s + entryTotals(e).litres, 0);
      let extraNet = 0;
      for (const x of cExtras) {
        extraNet += extraSigned(c.kind, x);
      }
      // Month-only balance approx: milk + signed extras in this month
      const settlement = milkAmt + extraNet;
      return {
        contact: c,
        milkAmt,
        litres,
        extraNet,
        settlement,
        entryCount: cEntries.length,
      };
    })
    .filter((r) => r.entryCount > 0 || r.extraNet !== 0)
    .sort((a, b) => Math.abs(b.settlement) - Math.abs(a.settlement));

  const grandSettlement = rows.reduce((s, r) => s + r.settlement, 0);

  return (
    <div className="min-h-dvh bg-[var(--background)] pb-8">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link to="/" className="text-sm text-[var(--muted-foreground)]">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold">Monthly Settlement</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
            Select month
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm outline-none"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
            <p className="text-xs text-[var(--muted-foreground)]">Total milk</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{formatLitres(totalLitres)}</p>
            <p className="text-sm text-[var(--muted-foreground)]">{formatInr(totalMilk)}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
            <p className="text-xs text-[var(--muted-foreground)]">Net settlement</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{formatInr(grandSettlement)}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Milk ± advances</p>
          </div>
        </div>

        <section>
          <h2 className="mb-2 text-sm font-medium">
            Contact-wise ({rows.length})
          </h2>
          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm text-[var(--muted-foreground)]">
              No data for this month
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
              {rows.map(({ contact, milkAmt, litres, extraNet, settlement, entryCount }) => (
                <Link
                  key={contact.id}
                  to={`/contacts/${contact.id}?month=${month}`}
                  className="block px-4 py-3 hover:bg-[var(--muted)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{contact.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {KIND_LABELS[contact.kind]} · {entryCount} entries ·{" "}
                        {formatLitres(litres)}
                      </p>
                      {extraNet !== 0 && (
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Extras: {formatInr(extraNet)}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums">{formatInr(settlement)}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Milk {formatInr(milkAmt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <p className="text-center text-xs text-[var(--muted-foreground)]">
          Contact pe click → us mahine ki detail list
        </p>
      </main>
    </div>
  );
}
