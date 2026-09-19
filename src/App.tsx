import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { useAccess } from "./hooks/useAccess";
import AppShell from "./components/layout/AppShell";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ContactsPage from "./pages/ContactsPage";
import ContactDetailPage from "./pages/ContactDetailPage";
import EntryPage from "./pages/EntryPage";
import ExtraPage from "./pages/ExtraPage";
import SettingsPage from "./pages/SettingsPage";
import EntriesPage from "./pages/EntriesPage";
import ReportsPage from "./pages/ReportsPage";
import MorePage from "./pages/MorePage";
import PendingPage from "./pages/PendingPage";
import AdminPage from "./pages/AdminPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isApproved, loading: accessLoading } = useAccess();

  if (authLoading || accessLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--background)]">
        <p className="text-sm text-[var(--muted-foreground)]">Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isApproved) {
    return <PendingPage />;
  }

  return <AppShell>{children}</AppShell>;
}

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { isApproved, loading: accessLoading } = useAccess();

  if (authLoading || (user && accessLoading)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--background)]">
        <p className="text-sm text-[var(--muted-foreground)]">Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            isApproved ? (
              <Navigate to="/" replace />
            ) : (
              <PendingPage />
            )
          ) : (
            <LoginPage />
          )
        }
      />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/contacts" element={<ProtectedRoute><ContactsPage /></ProtectedRoute>} />
      <Route path="/contacts/:contactId" element={<ProtectedRoute><ContactDetailPage /></ProtectedRoute>} />
      <Route path="/entries" element={<ProtectedRoute><EntriesPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/entry" element={<ProtectedRoute><EntryPage /></ProtectedRoute>} />
      <Route path="/extra" element={<ProtectedRoute><ExtraPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/more" element={<ProtectedRoute><MorePage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
