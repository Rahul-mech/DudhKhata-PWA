import { useAuth } from "../hooks/useAuth";
import { useAccess } from "../hooks/useAccess";

export default function PendingPage() {
  const { user, signOut } = useAuth();
  const { status } = useAccess();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--background)] px-6">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
        <h1 className="text-lg font-semibold text-[var(--primary)]">DudhKhata</h1>
        {status === "blocked" ? (
          <>
            <p className="mt-4 text-sm font-medium">Access blocked</p>
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              This account cannot use the app. Contact the owner if this is a mistake.
            </p>
          </>
        ) : (
          <>
            <p className="mt-4 text-sm font-medium">Waiting for approval</p>
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Signed in as <strong>{user?.email}</strong>.
              <br />
              Owner must approve your account before you can use DudhKhata.
              This stops random sign-ups from filling the database.
            </p>
          </>
        )}
        <button
          type="button"
          onClick={() => signOut()}
          className="mt-6 w-full rounded-xl border border-[var(--border)] py-2.5 text-sm font-medium"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
