import React, { Suspense, lazy, useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import { I18nProvider } from "./i18n";
import { useAuth } from "./hooks/useAuth";
import { useOnboarding } from "./hooks/useOnboarding";
import { AuthSessionSync } from "./components/AuthSessionSync";
import { RegistryHearingNotifications } from "./components/RegistryHearingNotifications";
import {
  SidebarNavigation,
  TopNavigation,
  MobileNavigation,
} from "./components/navigation";
import { ErrorBoundary } from "./components/ErrorBoundary";
import {
  buildLoginRedirectPath,
  getAuthRedirectTarget,
} from "./utils/authRedirect";
import "./App.css";

const LoginPage = lazy(() =>
  import("./pages/auth/LoginPage").then((module) => ({
    default: module.LoginPage,
  })),
);
const RegisterPage = lazy(() =>
  import("./pages/auth/RegisterPage").then((module) => ({
    default: module.RegisterPage,
  })),
);
const LandingPage = lazy(() =>
  import("./pages/landing/LandingPage").then((module) => ({
    default: module.LandingPage,
  })),
);
const DashboardPage = lazy(() =>
  import("./pages/dashboard/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const BillingPage = lazy(() =>
  import("./pages/billing/BillingPage").then((module) => ({
    default: module.BillingPage,
  })),
);
const PaymentSuccessPage = lazy(() =>
  import("./pages/billing/PaymentResult").then((module) => ({
    default: module.PaymentSuccessPage,
  })),
);
const PaymentCancelPage = lazy(() =>
  import("./pages/billing/PaymentResult").then((module) => ({
    default: module.PaymentCancelPage,
  })),
);
const OnboardingWizard = lazy(() =>
  import("./pages/onboarding/OnboardingWizard").then((module) => ({
    default: module.OnboardingWizard,
  })),
);
const ProfilePage = lazy(() =>
  import("./pages/profile/ProfilePage").then((module) => ({
    default: module.ProfilePage,
  })),
);
const AddClientPage = lazy(() =>
  import("./pages/clients/AddClientPage").then((module) => ({
    default: module.AddClientPage,
  })),
);
const ClientsPage = lazy(() =>
  import("./pages/clients/ClientsPage").then((module) => ({
    default: module.ClientsPage,
  })),
);
const ClientDetailsPage = lazy(() =>
  import("./pages/clients/ClientDetailsPage").then((module) => ({
    default: module.ClientDetailsPage,
  })),
);
const CasesPage = lazy(() =>
  import("./pages/cases/CasesPage").then((module) => ({
    default: module.CasesPage,
  })),
);
const AddCasePage = lazy(() =>
  import("./pages/cases/AddCasePage").then((module) => ({
    default: module.AddCasePage,
  })),
);
const CaseDetailsPage = lazy(() =>
  import("./pages/cases/CaseDetailsPage").then((module) => ({
    default: module.CaseDetailsPage,
  })),
);
const DocumentsPageContent = lazy(() =>
  import("./pages/documents/DocumentsPage").then((module) => ({
    default: module.DocumentsPage,
  })),
);
const DocumentComposerPage = lazy(() =>
  import("./pages/documents/DocumentComposerPage").then((module) => ({
    default: module.DocumentComposerPage,
  })),
);
const ScanSessionPage = lazy(() =>
  import("./pages/documents/ScanSessionPage").then((module) => ({
    default: module.ScanSessionPage,
  })),
);
const DocumentViewerPage = lazy(() =>
  import("./pages/documents/DocumentViewerPage").then((module) => ({
    default: module.DocumentViewerPage,
  })),
);
const MobileScanPage = lazy(() => import("./pages/documents/MobileScanPage"));
const ActivityPageContent = lazy(() =>
  import("./pages/activity/ActivityPage").then((module) => ({
    default: module.ActivityPage,
  })),
);
const CalendarPage = lazy(() =>
  import("./pages/calendar/CalendarPage").then((module) => ({
    default: module.CalendarPage,
  })),
);
const AddEventPage = lazy(() =>
  import("./pages/events/AddEventPage").then((module) => ({
    default: module.AddEventPage,
  })),
);
const PricelistsPage = lazy(() =>
  import("./pages/pricelists/PricelistsPage").then((module) => ({
    default: module.PricelistsPage,
  })),
);
const PricelistEditorPage = lazy(() =>
  import("./pages/pricelists/PricelistEditorPage").then((module) => ({
    default: module.PricelistEditorPage,
  })),
);
const PricelistDetailsPage = lazy(() =>
  import("./pages/pricelists/PricelistDetailsPage").then((module) => ({
    default: module.PricelistDetailsPage,
  })),
);
const CalculationsPage = lazy(() =>
  import("./pages/calculations/CalculationsPage").then((module) => ({
    default: module.CalculationsPage,
  })),
);
const CalculationCreatePage = lazy(() =>
  import("./pages/calculations/CalculationCreatePage").then((module) => ({
    default: module.CalculationCreatePage,
  })),
);
const CalculationDetailsPage = lazy(() =>
  import("./pages/calculations/CalculationDetailsPage").then((module) => ({
    default: module.CalculationDetailsPage,
  })),
);
const ReportsPage = lazy(() =>
  import("./pages/reports/ReportsPage").then((module) => ({
    default: module.ReportsPage,
  })),
);
const UsersPage = lazy(() =>
  import("./pages/users/UsersPage").then((module) => ({
    default: module.UsersPage,
  })),
);
const AuditPage = lazy(() =>
  import("./pages/audit/AuditPage").then((module) => ({
    default: module.AuditPage,
  })),
);
const SettingsPage = lazy(() =>
  import("./pages/settings/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
);
const PrintFormsPage = lazy(() =>
  import("./pages/print-forms/PrintFormsPage").then((module) => ({
    default: module.PrintFormsPage,
  })),
);
const NotesPage = lazy(() =>
  import("./pages/notes/NotesPage").then((module) => ({
    default: module.NotesPage,
  })),
);
const ArchivePage = lazy(() =>
  import("./pages/archive/ArchivePage").then((module) => ({
    default: module.ArchivePage,
  })),
);
const ChatPage = lazy(() =>
  import("./pages/chat/ChatPage").then((module) => ({
    default: module.ChatPage,
  })),
);
const MailPage = lazy(() =>
  import("./pages/mail/MailPage").then((module) => ({
    default: module.MailPage,
  })),
);

const RouteFallback: React.FC = () => (
  <div className="loading-screen">
    <div className="spinner"></div>
  </div>
);

/**
 * Protected Route Component
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={buildLoginRedirectPath(
          location.pathname,
          location.search,
          location.hash,
        )}
        replace
      />
    );
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate to={getAuthRedirectTarget(location.search)} replace />;
  }

  return <>{children}</>;
};

/**
 * Onboarding Route Component
 * Redirects to onboarding if not completed
 */
const OnboardingRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const { progress, isLoading } = useOnboarding();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={buildLoginRedirectPath(
          location.pathname,
          location.search,
          location.hash,
        )}
        replace
      />
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  // If onboarding not completed, show wizard
  if (progress && !progress.completed) {
    return <OnboardingWizard />;
  }

  return <>{children}</>;
};

/**
 * Owner Only Route Component
 */
const OwnerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={buildLoginRedirectPath(
          location.pathname,
          location.search,
          location.hash,
        )}
        replace
      />
    );
  }

  const isOwner = user?.role === "organization_owner";

  if (!isOwner) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

/**
 * Main Layout Component
 */
const SIDEBAR_STATE_STORAGE_KEY = "law-organizer.sidebar-collapsed";

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(SIDEBAR_STATE_STORAGE_KEY) === "true";
  });

  useEffect(() => {
    window.localStorage.setItem(
      SIDEBAR_STATE_STORAGE_KEY,
      String(isSidebarCollapsed),
    );
  }, [isSidebarCollapsed]);

  return (
    <div
      className={`app-layout ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}
      style={{
        ["--sidebar-width" as string]: isSidebarCollapsed
          ? "4.5rem"
          : "14.4rem",
        ["--topbar-height" as string]: "3.7rem",
        ["--mobile-header-height" as string]: "4.85rem",
      }}
    >
      <SidebarNavigation
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((value) => !value)}
      />
      <div className="main-content">
        <TopNavigation isSidebarCollapsed={isSidebarCollapsed} />
        <main className="page-content" id="main-content">
          <RegistryHearingNotifications />
          {children}
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
};

/**
 * App Component with Routing
 */
export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AuthSessionSync />
      <I18nProvider>
        <ErrorBoundary>
          <Router>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                {/* Public Routes */}
                <Route
                  path="/"
                  element={
                    <PublicRoute>
                      <LandingPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <RegisterPage />
                    </PublicRoute>
                  }
                />

                {/* Billing callback routes (public) */}
                <Route
                  path="/billing/success"
                  element={
                    <ProtectedRoute>
                      <PaymentSuccessPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/billing/cancel"
                  element={
                    <ProtectedRoute>
                      <PaymentCancelPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/mobile-scan" element={<MobileScanPage />} />

                {/* Onboarding Route */}
                <Route
                  path="/onboarding"
                  element={
                    <OnboardingRoute>
                      <OnboardingWizard />
                    </OnboardingRoute>
                  }
                />

                {/* Protected Routes with Layout */}
                <Route
                  path="/dashboard"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <DashboardPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />

                <Route
                  path="/billing"
                  element={
                    <OwnerRoute>
                      <MainLayout>
                        <BillingPage />
                      </MainLayout>
                    </OwnerRoute>
                  }
                />

                {/* Cases Routes */}
                <Route
                  path="/cases"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <CasesPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />
                <Route
                  path="/cases/add"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <AddCasePage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />
                <Route
                  path="/cases/:id"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <CaseDetailsPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />

                {/* Clients Routes */}
                <Route
                  path="/clients"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <ClientsPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />
                <Route
                  path="/clients/add"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <AddClientPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />
                <Route
                  path="/clients/:id"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <ClientDetailsPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />

                {/* Documents Routes */}
                <Route
                  path="/documents"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <DocumentsPageContent />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />
                <Route
                  path="/documents/create"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <DocumentComposerPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />
                <Route
                  path="/documents/scan-session"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <ScanSessionPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />
                <Route
                  path="/documents/:id"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <DocumentViewerPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />
                <Route
                  path="/cases/:caseId/documents"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <DocumentsPageContent />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />
                <Route
                  path="/clients/:clientId/documents"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <DocumentsPageContent />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />

                {/* Calendar Route */}
                <Route
                  path="/calendar"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <CalendarPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />
                <Route
                  path="/events/add"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <AddEventPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />

                {/* Calculations Route */}
                <Route
                  path="/pricelists"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <PricelistsPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />
                <Route
                  path="/pricelists/add"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <PricelistEditorPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />
                <Route
                  path="/pricelists/:id/edit"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <PricelistEditorPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />
                <Route
                  path="/pricelists/:id"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <PricelistDetailsPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />

                <Route
                  path="/calculations"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <CalculationsPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />
                <Route
                  path="/calculations/add"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <CalculationCreatePage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />
                <Route
                  path="/calculations/:id"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <CalculationDetailsPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />
                <Route
                  path="/calculations/:id/edit"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <CalculationCreatePage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />

                {/* Activity Route */}
                <Route
                  path="/activity"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <ActivityPageContent />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />

                {/* Reports Route */}
                <Route
                  path="/reports"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <ReportsPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />

                {/* Print Forms Route */}
                <Route
                  path="/print-forms"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <PrintFormsPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />

                <Route
                  path="/notes"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <NotesPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />

                <Route
                  path="/archive"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <ArchivePage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />

                {/* Chat Route */}
                <Route
                  path="/chat"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <ChatPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />

                {/* Mail Route */}
                <Route
                  path="/mail"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <MailPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />

                {/* Users Route */}
                <Route
                  path="/users"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <UsersPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />

                {/* Backward-compatible Team Route */}
                <Route
                  path="/team"
                  element={<Navigate to="/users" replace />}
                />

                {/* Audit Route */}
                <Route
                  path="/audit"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <AuditPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />

                {/* Settings Route */}
                <Route
                  path="/settings"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <SettingsPage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />

                {/* Profile Route */}
                <Route
                  path="/profile"
                  element={
                    <OnboardingRoute>
                      <MainLayout>
                        <ProfilePage />
                      </MainLayout>
                    </OnboardingRoute>
                  }
                />

                {/* Default Route */}

                {/* 404 Route */}
                <Route
                  path="*"
                  element={
                    <div className="not-found-page">
                      <div className="not-found-content">
                        <h1>404</h1>
                        <p>Сторінку не знайдено</p>
                        <a href="/dashboard" className="back-link">
                          Перейти на дашборд
                        </a>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </Suspense>
          </Router>
        </ErrorBoundary>
      </I18nProvider>
    </Provider>
  );
};

export default App;
