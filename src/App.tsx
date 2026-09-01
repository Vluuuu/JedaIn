import { Link, Route, Routes } from "react-router";
import {
  DistractionFreeShell,
  PlaceholderPage,
  TravelerAppShell,
  TravelerPublicShell,
  WorkspaceShell,
  adminNavigation,
  partnerDestinationNavigation,
  partnerEoNavigation,
} from "./components/shells";
import { TravelerLoginScreen } from "./features/auth";
import { CheckoutScreen } from "./features/checkout";
import { ContactVerificationScreen } from "./features/contactVerification";
import {
  EoApplicationScreen,
  EoApplicationStatusScreen,
  EoBookingsScreen,
  EoDestinationsScreen,
  EoInsightsScreen,
  EoOverviewScreen,
  EoPackageBuilderScreen,
  EoPackageDetailScreen,
  EoPackagesScreen,
  EoProfileScreen,
  EoReviewsScreen,
  EoSessionsScreen,
  PartnerLoginScreen,
  PartnerPortalLandingScreen,
  PartnerRouteGuard,
} from "./features/eo";
import { ExploreScreen } from "./features/explore";
import { HomeScreen } from "./features/home";
import {
  OnboardingRouteGuard,
  TravelerConsentScreen,
} from "./features/onboarding";
import { PackageDetailScreen } from "./features/packageDetail";
import { PaymentResultScreen, PaymentScreen } from "./features/payment";
import { PendingPaymentResolutionScreen } from "./features/pendingPayment";
import { TravelerQuizScreen } from "./features/quiz";
import { RecommendationResultScreen } from "./features/recommendation";
import { TripReviewScreen } from "./features/reviews";
import { SessionSelectionScreen } from "./features/sessionSelection";
import { MyTripsScreen, TripDetailScreen } from "./features/trips";
import "./App.css";

const placeholderTravelerRoutes = [
  ["profile", "Profile"],
  ["profile/preferences", "Preferences"],
  ["complaints/new", "New complaint"],
] as const;

const partnerDestinationRoutes = [
  ["destination", "Overview"],
  ["destination/profile", "Destination Profile"],
  ["destination/verification", "Verification"],
  ["destination/schedule", "Schedule"],
  ["destination/capacity", "Capacity"],
  ["destination/reviews", "Reviews"],
  ["destination/profile-settings", "Profile"],
] as const;

const adminRoutes = [
  ["", "Overview"],
  ["eo-approvals", "EO Approvals"],
  ["eo-approvals/:applicationId", "EO approval detail"],
  ["destination-verifications", "Destination Verification"],
  ["destination-verifications/:applicationId", "Verification detail"],
  ["package-approvals", "Package Approvals"],
  ["package-approvals/:submissionId", "Package approval detail"],
  ["bookings", "Bookings / Payments"],
  ["complaints", "Complaints"],
  ["complaints/:complaintId", "Complaint detail"],
  ["trust", "Trust & Status"],
  ["audit", "Audit / Activity"],
] as const;

export function App() {
  return (
    <Routes>
      <Route element={<TravelerPublicShell />}>
        <Route index element={<PublicLandingPlaceholder />} />
      </Route>

      <Route element={<DistractionFreeShell />}>
        <Route path="login" element={<TravelerLoginScreen />} />
        <Route
          path="onboarding/consent"
          element={
            <OnboardingRouteGuard>
              <TravelerConsentScreen />
            </OnboardingRouteGuard>
          }
        />
        <Route
          path="onboarding/quiz"
          element={
            <OnboardingRouteGuard>
              <TravelerQuizScreen />
            </OnboardingRouteGuard>
          }
        />
        <Route
          path="onboarding/result"
          element={
            <OnboardingRouteGuard>
              <RecommendationResultScreen />
            </OnboardingRouteGuard>
          }
        />
        <Route
          path="payment/:bookingId"
          element={
            <OnboardingRouteGuard>
              <PaymentScreen />
            </OnboardingRouteGuard>
          }
        />
        <Route
          path="payment/:bookingId/result"
          element={
            <OnboardingRouteGuard>
              <PaymentResultScreen />
            </OnboardingRouteGuard>
          }
        />
      </Route>

      <Route
        element={
          <OnboardingRouteGuard>
            <TravelerAppShell showBottomNav={false} />
          </OnboardingRouteGuard>
        }
      >
        <Route path="checkout/:sessionId" element={<CheckoutScreen />} />
        <Route
          path="checkout/:sessionId/contact"
          element={<ContactVerificationScreen />}
        />
        <Route
          path="checkout/:sessionId/pending-payment"
          element={<PendingPaymentResolutionScreen />}
        />
      </Route>

      <Route
        element={
          <OnboardingRouteGuard>
            <TravelerAppShell />
          </OnboardingRouteGuard>
        }
      >
        <Route path="home" element={<HomeScreen />} />
        <Route path="explore" element={<ExploreScreen />} />
        <Route path="packages/:packageId" element={<PackageDetailScreen />} />
        <Route
          path="packages/:packageId/sessions"
          element={<SessionSelectionScreen />}
        />
        <Route path="trips" element={<MyTripsScreen />} />
        <Route path="trips/:bookingId" element={<TripDetailScreen />} />
        <Route path="trips/:bookingId/review" element={<TripReviewScreen />} />
        {placeholderTravelerRoutes.map(([path, title]) => (
          <Route
            key={path}
            path={path}
            element={<PlaceholderPage eyebrow="Traveler" title={title} />}
          />
        ))}
      </Route>

      {/* Partner Entry & Application Routes */}
      <Route path="partner" element={<TravelerPublicShell />}>
        <Route index element={<PartnerPortalLandingScreen />} />
      </Route>
      <Route path="partner/login" element={<DistractionFreeShell />}>
        <Route index element={<PartnerLoginScreen />} />
      </Route>
      <Route path="partner/apply/eo" element={<DistractionFreeShell />}>
        <Route index element={<EoApplicationScreen />} />
      </Route>
      <Route path="partner/application" element={<DistractionFreeShell />}>
        <Route index element={<EoApplicationStatusScreen />} />
      </Route>

      {/* Destination Partner Placeholder Routes */}
      <Route
        path="partner/destination"
        element={
          <WorkspaceShell
            surface="partner"
            title="Destination partner workspace"
            navigation={partnerDestinationNavigation}
          />
        }
      >
        <Route
          index
          element={
            <PlaceholderPage eyebrow="Destination Partner" title="Overview" />
          }
        />
        {partnerDestinationRoutes.slice(1).map(([path, title]) => {
          const subPath = path.replace(/^destination\//, "");
          return (
            <Route
              key={path}
              path={subPath}
              element={
                <PlaceholderPage eyebrow="Destination Partner" title={title} />
              }
            />
          );
        })}
      </Route>

      {/* Operational EO Partner Workspace (Protected by PartnerRouteGuard) */}
      <Route
        path="partner/eo"
        element={
          <PartnerRouteGuard>
            <WorkspaceShell
              surface="partner"
              title="EO Partner Workspace"
              navigation={partnerEoNavigation}
            />
          </PartnerRouteGuard>
        }
      >
        <Route index element={<EoOverviewScreen />} />
        <Route path="insights" element={<EoInsightsScreen />} />
        <Route path="packages" element={<EoPackagesScreen />} />
        <Route path="packages/new" element={<EoPackageBuilderScreen />} />
        <Route path="packages/:packageId" element={<EoPackageDetailScreen />} />
        <Route
          path="packages/:packageId/sessions"
          element={<EoSessionsScreen />}
        />
        <Route path="sessions" element={<EoSessionsScreen />} />
        <Route path="bookings" element={<EoBookingsScreen />} />
        <Route path="destinations" element={<EoDestinationsScreen />} />
        <Route path="reviews" element={<EoReviewsScreen />} />
        <Route path="profile" element={<EoProfileScreen />} />
      </Route>

      {/* Admin Operations Placeholder */}
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
