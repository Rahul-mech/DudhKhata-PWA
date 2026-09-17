import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  listenContacts,
  listenEntries,
  listenExtras,
} from "../lib/db";
import {
  contactBalance,
  entryTotals,
  formatInr,
  formatLitres,
} from "../lib/calc";
import type { Contact, MilkEntry, ExtraTxn } from "../types";
import { EXTRA_LABELS, KIND_LABELS } from "../types";

export default function ContactDetailPage() {
  const { contactId } = useParams<{ contactId: string }>();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [entries, setEntries] = useState<MilkEntry[]>([]);
  const [extras, setExtras] = useState<ExtraTxn[]>([]);

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

  const contact = contacts.find((c) => c.id === contactId);
  const myEntries = entries
    .filter((e) => e.contactId === contactId)
    .sort((a, b) => (a.entryDate < b.entryDate ? 1 : -1));
  const myExtras = extras
    .filter((x) => x.contactId === contactId)
    .sort((a, b) => (a.entryDate < b.entryDate ? 1 : -1));

  const balance = contact ? contactBalance(contact, entries, extras) : 0;
  const totalLitres = myEntries.reduce((s, e) => s + entryTotals(e).litres, 0);
  const totalMilkAmt = myEntries.reduce((s, e) => s + entryTotals(e).amount, 0);

  if (!contact) {
    return (
      <div className="min-h-dvh bg-[var(--background)] flex items-center justify-center">
        <p className="text-sm text-[var(--muted-foreground)]">Loading contact...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[var(--background)] pb-8">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link to="/contacts" className="text-sm text-[var(--muted-foreground)]">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold truncate">{contact.name}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4 space-y-4">
        {/* Summary cards */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-xs text-[var(--muted-foreground)]">{KIND_LABELS[contact.kind]}</p>
          {contact.phone && (
            <p className="text-sm text-[var(--muted-foreground)]">{contact.phone}</p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Balance</p>
              <p className={`text-xl font-semibold tabular-nums ${
                balance >= 0 ? "text-[var(--collect)]" : "text-[var(--pay)]"
              }`}>
                {formatInr(Math.abs(balance))}
                <span className="ml-1 text-xs font-normal text-[var(--muted-foreground)]">
                  {balance >= 0 ? (contact.kind === "customer" ? "to collect" : "to pay") : (contact.kind === "customer" ? "to pay" : "to collect")}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Total milk</p>
              <p className="text-xl font-semibold tabular-nums">{formatLitres(totalLitres)}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Milk amount: {formatInr(totalMilkAmt)}
          </p>
        </div>

        {/* Milk entries table */}
        <section>
          <h2 className="mb-2 text-sm font-medium">Milk Entries ({myEntries.length})</h2>
          {myEntries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-6 text-center text-sm text-[var(--muted-foreground)]">
              No milk entries yet
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)]">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-2 py-2 font-medium text-right">M L</th>
                    <th className="px-2 py-2 font-medium text-right">M Fat</th>
                    <th className="px-2 py-2 font-medium text-right">E L</th>
                    <th className="px-2 py-2 font-medium text-right">E Fat</th>
                    <th className="px-3 py-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {myEntries.map((e) => {
                    const t = entryTotals(e);
                    return (
                      <tr key={e.id}>
                        <td className="px-3 py-2 whitespace-nowrap">{e.entryDate}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{e.morningLitres || "-"}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{e.morningFat || "-"}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{e.eveningLitres || "-"}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{e.eveningFat || "-"}</td>
                        <td className="px-3 py-2 text-right font-medium tabular-nums">{formatInr(t.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Extras */}
        {myExtras.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-medium">Extra Transactions ({myExtras.length})</h2>
            <div className="divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
              {myExtras.map((x) => (
                <div key={x.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{EXTRA_LABELS[x.type]}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{x.entryDate}{x.note ? ` · ${x.note}` : ""}</p>
                  </div>
                  <p className="text-sm font-medium tabular-nums">{formatInr(x.amount)}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
