import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  listenContacts,
  listenEntries,
  listenExtras,
  removeEntry,
  removeExtra,
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

  const handleDeleteEntry = async (id: string) => {
    if (!user || !confirm("Delete this entry? Calculation will update automatically.")) return;
    await removeEntry(user.uid, id);
  };

  const handleDeleteExtra = async (id: string) => {
    if (!user || !confirm("Delete this transaction?")) return;
    await removeExtra(user.uid, id);
  };

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

        <section>
          <h2 className="mb-2 text-sm font-medium">Milk Entries ({myEntries.length})</h2>
          {myEntries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-6 text-center text-sm text-[var(--muted-foreground)]">
              No milk entries yet
            </div>
          ) : (
            <div className="space-y-2">
              {myEntries.map((e) => {
                const t = entryTotals(e);
                return (
                  <div
                    key={e.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{e.entryDate}</p>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                          M: {e.morningLitres || 0}L @ {e.morningFat || 0}%
                          {" · "}
                          E: {e.eveningLitres || 0}L @ {e.eveningFat || 0}%
                        </p>
                        <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--primary)]">
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
                          onClick={() => handleDeleteEntry(e.id)}
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
        </section>

        {myExtras.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-medium">Extra Transactions ({myExtras.length})</h2>
            <div className="space-y-2">
              {myExtras.map((x) => (
                <div
                  key={x.id}
                  className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{EXTRA_LABELS[x.type]}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {x.entryDate}
                      {x.note ? ` · ${x.note}` : ""}
                    </p>
                    <p className="mt-0.5 text-sm font-medium tabular-nums">{formatInr(x.amount)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteExtra(x.id)}
                    className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
