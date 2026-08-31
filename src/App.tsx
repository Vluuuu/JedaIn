import { Link, Route, Routes } from "react-router";
import {
  DistractionFreeShell,
  PlaceholderPage,
  TravelerAppShell,
  TravelerPublicShell,
  WorkspaceShell,
  adminNavigation,
  partnerNavigation,
} from "./components/shells";
import "./App.css";

const travelerRoutes = [
  ["home", "Home"],
  ["explore", "Explore"],
  ["packages/:packageId", "Package detail"],
  ["packages/:packageId/sessions", "Choose session"],
  ["checkout/:sessionId", "Checkout"],
  ["trips", "My Trips"],
  ["trips/:bookingId", "Trip detail"],
  ["trips/:bookingId/review", "Trip review"],
  ["profile", "Profile"],
  ["profile/preferences", "Preferences"],
  ["complaints/new", "New complaint"],
] as const;

const distractionFreeRoutes = [
  ["login", "Masuk / Daftar"],
  ["onboarding/consent", "Consent"],
  ["onboarding/quiz", "Quiz"],
  ["onboarding/result", "Recommendation result"],
  ["payment/:bookingId", "Payment"],
  ["payment/:bookingId/result", "Payment result"],
] as const;

const partnerRoutes = [
  ["eo", "Overview"],
  ["eo/insights", "Insights"],
  ["eo/packages", "Packages"],
  ["eo/packages/new", "New package"],
  ["eo/packages/:packageId", "Package detail"],
  ["eo/packages/:packageId/sessions", "Package sessions"],
  ["eo/bookings", "Bookings"],
  ["eo/destinations", "Destinations"],
  ["eo/reviews", "Reviews"],
  ["eo/profile", "Profile"],
  ["destination", "Destination overview"],
  ["destination/profile", "Destination profile"],
  ["destination/verification", "Verification"],
  ["destination/schedule", "Schedule"],
  ["destination/capacity", "Capacity"],
  ["destination/reviews", "Reviews"],
] as const;

const adminRoutes = [
  ["", "Overview"],
  ["eo-approvals", "EO approvals"],
  ["eo-approvals/:applicationId", "EO approval detail"],
  ["destination-verifications", "Destination verifications"],
  ["destination-verifications/:applicationId", "Verification detail"],
  ["package-approvals", "Package approvals"],
  ["package-approvals/:submissionId", "Package approval detail"],
  ["bookings", "Bookings"],
  ["complaints", "Complaints"],
  ["complaints/:complaintId", "Complaint detail"],
  ["trust", "Trust"],
  ["audit", "Audit"],
] as const;

export function App() {
  return (
    <Routes>
      <Route element={<TravelerPublicShell />}>
        <Route index element={<PublicLandingPlaceholder />} />
      </Route>

      <Route element={<DistractionFreeShell />}>
        {distractionFreeRoutes.map(([path, title]) => (
          <Route
            key={path}
            path={path}
            element={<PlaceholderPage eyebrow="Traveler flow" title={title} />}
          />
        ))}
      </Route>

      <Route element={<TravelerAppShell />}>
        {travelerRoutes.map(([path, title]) => (
          <Route
            key={path}
            path={path}
            element={<PlaceholderPage eyebrow="Traveler" title={title} />}
          />
        ))}
      </Route>

      <Route path="partner/login" element={<DistractionFreeShell />}>
        <Route
          index
          element={<PlaceholderPage eyebrow="Partner" title="Partner login" />}
        />
      </Route>
      <Route
        path="partner"
        element={
          <WorkspaceShell
            surface="partner"
            title="Partner workspace"
            navigation={partnerNavigation}
          />
        }
      >
        <Route
          index
          element={<PlaceholderPage eyebrow="Partner" title="Partner portal" />}
        />
        <Route
          path="apply/eo"
          element={<PlaceholderPage eyebrow="Partner" title="EO application" />}
        />
        <Route
          path="apply/destination"
          element={
            <PlaceholderPage
              eyebrow="Partner"
              title="Destination application"
            />
          }
        />
        <Route
          path="application"
          element={
            <PlaceholderPage eyebrow="Partner" title="Application status" />
          }
        />
        {partnerRoutes.map(([path, title]) => (
          <Route
            key={path}
            path={path}
            element={<PlaceholderPage eyebrow="Partner" title={title} />}
          />
        ))}
      </Route>

      <Route path="admin/login" element={<DistractionFreeShell />}>
        <Route
          index
          element={<PlaceholderPage eyebrow="Admin" title="Admin login" />}
        />
      </Route>
      <Route
        path="admin"
        element={
          <WorkspaceShell
            surface="admin"
            title="Admin operations"
            navigation={adminNavigation}
          />
        }
      >
        {adminRoutes.map(([path, title]) => (
          <Route
            key={path || "index"}
            index={!path || undefined}
            path={path || undefined}
            element={<PlaceholderPage eyebrow="Admin" title={title} />}
          />
        ))}
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function PublicLandingPlaceholder() {
  return (
    <section className="landing-placeholder">
      <p className="eyebrow">JedaIn</p>
      <h1>Temukan jeda yang benar-benar kamu butuhkan.</h1>
      <p>
        Public shell sudah siap. Konten landing akan hadir pada issue terpisah.
      </p>
      <div className="landing-placeholder__actions">
        <Link to="/login">Mulai Cari Jedamu</Link>
        <Link to="/explore">Explore</Link>
      </div>
    </section>
  );
}

function NotFoundPage() {
  return (
    <main className="page">
      <p className="eyebrow">404</p>
      <h1>Halaman tidak ditemukan.</h1>
      <Link to="/">Kembali ke halaman utama</Link>
    </main>
  );
}

export default App;
