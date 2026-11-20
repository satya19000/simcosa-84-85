import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./index.css";
import { AuthProvider, useAuth } from "./lib/auth";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { NewMeeting } from "./pages/NewMeeting";
import { RecordPage } from "./pages/RecordPage";
import { UploadPage } from "./pages/UploadPage";
import { MeetingWorkspace } from "./pages/MeetingWorkspace";
import { ActionItemsPage, PrintMinutes, SearchPage, SettingsPage } from "./pages/OtherPages";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-muted">Loading…</p>;
  return user ? <>{children}</> : <Login />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <RequireAuth>
          <Routes>
            <Route path="/meetings/:id/print" element={<PrintMinutes />} />
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="meetings/new" element={<NewMeeting />} />
              <Route path="meetings/:id" element={<MeetingWorkspace />} />
              <Route path="meetings/:id/record" element={<RecordPage />} />
              <Route path="meetings/:id/upload" element={<UploadPage />} />
              <Route path="tasks" element={<ActionItemsPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </RequireAuth>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
