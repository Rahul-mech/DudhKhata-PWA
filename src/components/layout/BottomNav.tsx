import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import ActionSheet from "./ActionSheet";

const tabs = [
  { to: "/", label: "Home", end: true },
  { to: "/contacts", label: "Contacts", end: false },
  { to: "__add__", label: "Add", end: false },
  { to: "/entries", label: "Ledger", end: false },
  { to: "/more", label: "More", end: false },
] as const;

export default function BottomNav() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const location = useLocation();

  // Hide on login
  if (location.pathname === "/login") return null;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--card)] bottom-nav-safe">
        <div className="mx-auto flex h-16 max-w-lg items-stretch">
          {tabs.map((tab) => {
            if (tab.to === "__add__") {
              return (
                <button
                  key="add"
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  className="flex flex-1 flex-col items-center justify-center gap-0.5"
                  aria-label="Add"
                >
                  <span className="flex h-11 w-11 -mt-5 items-center justify-center rounded-full bg-[var(--primary)] text-xl font-semibold text-white shadow-md ring-4 ring-[var(--background)]">
                    +
                  </span>
                  <span className="text-[10px] font-medium text-[var(--muted-foreground)]">Add</span>
                </button>
              );
            }

            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
                    isActive
                      ? "text-[var(--primary)]"
                      : "text-[var(--muted-foreground)]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`h-1 w-1 rounded-full ${
                        isActive ? "bg-[var(--primary)]" : "bg-transparent"
                      }`}
                    />
                    <span className="text-xs">{tab.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
      <ActionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
