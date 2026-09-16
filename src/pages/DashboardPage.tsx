import { useAuth } from "../hooks/useAuth";

export default function DashboardPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-dvh bg-[var(--background)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <h1 className="text-lg font-semibold text-[var(--primary)]">DudhKhata</h1>
          <button
            onClick={() => signOut()}
            className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-sm text-[var(--muted-foreground)]">Signed in as</p>
          <p className="mt-1 font-medium">{user?.displayName || user?.email}</p>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            Dashboard coming next...
          </p>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            Contacts, Daily Entry, Reports will be added here.
          </p>
        </div>
      </main>
    </div>
  );
}
