import BottomNav from "./BottomNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[var(--background)]">
      <div className="pb-nav">{children}</div>
      <BottomNav />
    </div>
  );
}
