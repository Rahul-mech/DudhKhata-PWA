import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  listenContacts,
  listenEntries,
  listenExtras,
  listenSettings,
} from "../lib/db";
import {
  contactBalance,
  entryTotals,
  formatInr,
  formatLitres,
  todayIsoDate,
} from "../lib/calc";
import type { Contact, MilkEntry, ExtraTxn } from "../types";
import { EXTRA_LABELS } from "../types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [entries, setEntries] = useState<MilkEntry[]>([]);
  const [extras, setExtras] = useState<ExtraTxn[]>([]);
  const [baseRate, setBaseRate] = useState(90);
  const [showMonthBreak, setShowMonthBreak] = useState(false);

  useEffect(() => {
    if (!user) return;
    const u1 = listenContacts(user.uid, setContacts);
    const u2 = listenEntries(user.uid, setEntries);
    const u3 = listenExtras(user.uid, setExtras);
    const u4 = listenSettings(user.uid, (s) => {
      if (s?.baseRate) setBaseRate(s.baseRate);
    });
    return () => {
      u1();
      u2();
      u3();
      u4();
    };
  }, [user]);

  const today = todayIsoDate();
  const monthKey = today.slice(0, 7);
  const monthStart = today.slice(0, 8) + "01";

  const todayEntries = entries.filter((e) => e.entryDate === today);
  const todayLitres = todayEntries.reduce((s, e) => s + entryTotals(e).litres, 0);
  const todayAmount = todayEntries.reduce((s, e) => s + entryTotals(e).amount, 0);

  const monthEntries = entries.filter(
    (e) => e.entryDate >= monthStart && e.entryDate <= today
  );
  const monthAmount = monthEntries.reduce((s, e) => s + entryTotals(e).amount, 0);

  const monthByContact = contacts
    .map((c) => {
      const mine = monthEntries.filter((e) => e.contactId === c.id);
      const amount = mine.reduce((s, e) => s + entryTotals(e).amount, 0);
      const litres = mine.reduce((s, e) => s + entryTotals(e).litres, 0);
      return { contact: c, amount, litres, count: mine.length };
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => b.amount - a.amount);

  // Sign-based only: positive balance → collect, negative → pay
  let toCollect = 0;
  let toPay = 0;
  for (const c of contacts) {
    const bal = contactBalance(c, entries, extras);
    if (bal > 0) toCollect += bal;
    else if (bal < 0) toPay += -bal;
  }

  const nameOf = (id: string) => contacts.find((c) => c.id === id)?.name ?? "Contact";

  type Activity = {
    id: string;
    date: string;
    title: string;
    subtitle: string;
    amount: number;
  };

  const activity: Activity[] = [
    ...entries.map((e) => {
      const t = entryTotals(e);
      return {
        id: e.id,
        date: e.entryDate,
        title: nameOf(e.contactId),
        subtitle: `${formatLitres(t.litres)} milk`,
        amount: t.amount,
      };
    }),
    ...extras.map((x) => ({
      id: x.id,
      date: x.entryDate,
      title: nameOf(x.contactId),
      subtitle: EXTRA_LABELS[x.type],
      amount: x.amount,
    })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 6);

  return (
    <div className="min-h-dvh bg-[var(--background)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-[var(--primary)]">
              DudhKhata
            </h1>
            <p className="text-xs text-[var(--muted-foreground)]">{today}</p>
          </div>
          <Link
            to="/settings"
            className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--muted-foreground)]"
          >
            Settings
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4 space-y-4">
        <section>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Today
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs text-[var(--muted-foreground)]">Milk</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                {formatLitres(todayLitres)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs text-[var(--muted-foreground)]">Amount</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                {formatInr(todayAmount)}
              </p>
            </div>
          </div>
        </section>

        <section>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Net balances
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs text-[var(--muted-foreground)]">Positive total</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--collect)]">
                {formatInr(toCollect)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs text-[var(--muted-foreground)]">Negative total</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--pay)]">
                {formatInr(toPay)}
              </p>
            </div>
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
            You decide who to collect from or pay — app only shows net per person
          </p>
        </section>

        <Link
          to="/entry"
          className="flex w-full items-center justify-center rounded-2xl bg-[var(--primary)] py-3.5 text-sm font-semibold text-white shadow-sm active:opacity-90"
        >
          + Add Milk Entry
        </Link>

        <button
          type="button"
          onClick={() => setShowMonthBreak(!showMonthBreak)}
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4 text-left"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            This month milk {showMonthBreak ? "▲" : "▼"}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{formatInr(monthAmount)}</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {monthKey} · rate Rs {baseRate} · tap for who contributed
          </p>
        </button>

        {showMonthBreak && (
          <div className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
            {monthByContact.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
                No milk entries this month yet
              </p>
            ) : (
              monthByContact.map(({ contact, amount, litres, count }) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{contact.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {count} entries · {formatLitres(litres)}
                    </p>
                  </div>
                  <p className="tabular-nums text-sm font-semibold">{formatInr(amount)}</p>
                </div>
              ))
            )}
          </div>
        )}

        <section>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Recent activity
          </p>
          {activity.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center">
              <p className="text-sm text-[var(--muted-foreground)]">No entries yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
              {activity.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{row.title}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {row.date} · {row.subtitle}
                    </p>
                  </div>
                  <p className="tabular-nums text-sm font-medium">{formatInr(row.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
