import BottomNav from "./BottomNav";
import OfflineBanner from "../OfflineBanner";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[var(--background)]">
      <OfflineBanner />
      <div className="pb-nav">{children}</div>
      <BottomNav />
    </div>
  );
}
