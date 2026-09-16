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
  const todayEntries = entries.filter((e) => e.entryDate === today);
  const todayLitres = todayEntries.reduce((s, e) => s + entryTotals(e).litres, 0);
  const todayAmount = todayEntries.reduce((s, e) => s + entryTotals(e).amount, 0);

  const monthStart = today.slice(0, 8) + "01";
  const monthAmount = entries
    .filter((e) => e.entryDate >= monthStart && e.entryDate <= today)
    .reduce((s, e) => s + entryTotals(e).amount, 0);

  let toCollect = 0;
  let toPay = 0;
  for (const c of contacts) {
    const bal = contactBalance(c, entries, extras);
    if (c.kind === "customer") {
      if (bal > 0) toCollect += bal;
      else toPay += -bal;
    } else {
      if (bal > 0) toPay += bal;
      else toCollect += -bal;
    }
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
    .slice(0, 8);

  return (
    <div className="min-h-dvh bg-[var(--background)] pb-20">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <h1 className="text-lg font-semibold text-[var(--primary)]">DudhKhata</h1>
          <Link to="/settings" className="text-sm text-[var(--muted-foreground)]">
            Settings
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
              Today&apos;s milk
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{formatLitres(todayLitres)}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
              Today&apos;s amount
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{formatInr(todayAmount)}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
              To collect
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--collect)]">
              {formatInr(toCollect)}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
              To pay
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--pay)]">
              {formatInr(toPay)}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            This month
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{formatInr(monthAmount)}</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">Base rate: ₹{baseRate}</p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Link
            to="/entry"
            className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] py-3 text-xs font-medium"
          >
            <span className="text-lg">+</span>
            Add entry
          </Link>
          <Link
            to="/contacts"
            className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] py-3 text-xs font-medium"
          >
            <span className="text-lg">☰</span>
            Contacts
          </Link>
          <Link
            to="/extra"
            className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] py-3 text-xs font-medium"
          >
            <span className="text-lg">₹</span>
            Extra
          </Link>
        </div>

        <section className="mt-8">
          <h2 className="mb-3 text-base font-medium">Recent</h2>
          {activity.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center">
              <p className="text-sm text-[var(--muted-foreground)]">No entries yet</p>
              <Link to="/contacts" className="mt-2 inline-block text-sm font-medium text-[var(--primary)]">
                Add a contact first
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
              {activity.map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
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
