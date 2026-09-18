import { useOnlineStatus } from "../hooks/useOnlineStatus";

/** Persistent, honest offline signal — Claude blueprint: trust > silent failure */
export default function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="status"
      className="border-b border-[var(--border)] bg-[#f5e6c8] px-4 py-2 text-center text-xs font-medium text-[var(--foreground)]"
    >
      Offline · entries save on this device and will sync when online
    </div>
  );
}
