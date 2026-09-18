import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Users, ScrollText, Menu } from "lucide-react";
import ActionSheet from "./ActionSheet";

export default function BottomNav() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const location = useLocation();

  if (location.pathname === "/login") return null;

  const itemClass = (active: boolean) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[44px] ${
      active ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
    }`;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--card)] bottom-nav-safe">
        <div className="mx-auto flex h-16 max-w-lg items-stretch">
          <NavLink to="/" end className={({ isActive }) => itemClass(isActive)}>
            {({ isActive }) => (
              <>
                <Home size={22} strokeWidth={isActive ? 2.25 : 1.75} aria-hidden />
                <span className="text-[10px] font-medium">Home</span>
              </>
            )}
          </NavLink>

          <NavLink to="/contacts" className={({ isActive }) => itemClass(isActive)}>
            {({ isActive }) => (
              <>
                <Users size={22} strokeWidth={isActive ? 2.25 : 1.75} aria-hidden />
                <span className="text-[10px] font-medium">Contacts</span>
              </>
            )}
          </NavLink>

          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5"
            aria-label="Add entry"
          >
            <span className="flex h-11 w-11 -mt-5 items-center justify-center rounded-full bg-[var(--primary)] text-2xl font-semibold leading-none text-white shadow-md ring-4 ring-[var(--background)]">
              +
            </span>
            <span className="text-[10px] font-medium text-[var(--muted-foreground)]">Add</span>
          </button>

          <NavLink to="/entries" className={({ isActive }) => itemClass(isActive)}>
            {({ isActive }) => (
              <>
                <ScrollText size={22} strokeWidth={isActive ? 2.25 : 1.75} aria-hidden />
                <span className="text-[10px] font-medium">Ledger</span>
              </>
            )}
          </NavLink>

          <NavLink to="/more" className={({ isActive }) => itemClass(isActive)}>
            {({ isActive }) => (
              <>
                <Menu size={22} strokeWidth={isActive ? 2.25 : 1.75} aria-hidden />
                <span className="text-[10px] font-medium">More</span>
              </>
            )}
          </NavLink>
        </div>
      </nav>
      <ActionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
