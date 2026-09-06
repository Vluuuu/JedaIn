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
import {
  AdminAuditActivityScreen,
  AdminBookingsScreen,
  AdminComplaintsScreen,
  AdminDestinationVerificationDetailScreen,
  AdminDestinationVerificationsScreen,
  AdminEoApplicationReviewScreen,
  AdminEoApprovalsScreen,
  AdminLoginScreen,
  AdminOverviewScreen,
  AdminPackageApprovalsScreen,
  AdminPackageReviewChecklistScreen,
  AdminRouteGuard,
  AdminTrustStatusScreen,
} from "./features/admin";
import { TravelerLoginScreen } from "./features/auth";
import { CheckoutScreen } from "./features/checkout";
import { ContactVerificationScreen } from "./features/contactVerification";
import {
  DestinationApplicationScreen,
  DestinationCapacityScreen,
  DestinationOverviewScreen,
  DestinationProfileScreen,
  DestinationReviewsScreen,
  DestinationRouteGuard,
  DestinationScheduleScreen,
  DestinationSettingsScreen,
  DestinationVerificationBadgeScreen,
} from "./features/destination";
import {
  EoApplicationScreen,
  EoBookingsScreen,
  EoDestinationDetailScreen,
  EoDestinationsScreen,
  EoInsightsScreen,
  EoOverviewScreen,
  EoPackageBuilderScreen,
  EoPackageDetailScreen,
  EoPackagesScreen,
  EoProfileScreen,
  EoReviewsScreen,
  EoSessionsScreen,
  PartnerApplicationStatusScreen,
  PartnerLoginScreen,
  PartnerPortalLandingScreen,
  PartnerRouteGuard,
} from "./features/eo";
import { ExploreScreen } from "./features/explore";
import { HomeScreen } from "./features/home";
import { OpeningHero } from "./features/landing";
import {
  OnboardingRouteGuard,
  TravelerConsentScreen,
} from "./features/onboarding";
import { PackageDetailScreen } from "./features/packageDetail";
import { PaymentResultScreen, PaymentScreen } from "./features/payment";
import { PendingPaymentResolutionScreen } from "./features/pendingPayment";
import {
  ActivityScreen,
  FollowListScreen,
  ProfilePhoneVerificationScreen,
  ProfileScreen,
  PublicProfileScreen,
  SettingsScreen,
  TravelerSearchScreen,
} from "./features/profile";
import { RetakeQuizAdapter, TravelerQuizScreen } from "./features/quiz";
import { RecommendationResultScreen } from "./features/recommendation";
import { TripReviewScreen } from "./features/reviews";
import { SessionSelectionScreen } from "./features/sessionSelection";
import { MyTripsScreen, TripDetailScreen } from "./features/trips";
import "./App.css";

const placeholderTravelerRoutes = [
  ["complaints/new", "New complaint"],
] as const;

export function App() {
  return (
    <Routes>
      <Route element={<TravelerPublicShell variant="opening" />}>
        <Route index element={<OpeningHero />} />
      </Route>

      <Route element={<DistractionFreeShell hideHeader />}>
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
          path="profile/preferences"
          element={
            <OnboardingRouteGuard>
              <TravelerQuizScreen
                mode="retake"
                adapter={new RetakeQuizAdapter()}
              />
            </OnboardingRouteGuard>
          }
        />
        <Route
          path="profile/verify-phone"
          element={
            <OnboardingRouteGuard>
              <ProfilePhoneVerificationScreen />
            </OnboardingRouteGuard>
          }
        />
      </Route>

      <Route element={<DistractionFreeShell />}>
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
        <Route path="profile" element={<ProfileScreen />} />
        <Route path="profile/settings" element={<SettingsScreen />} />
        <Route path="profile/activity" element={<ActivityScreen />} />
        <Route path="travelers/search" element={<TravelerSearchScreen />} />
        <Route path="travelers/:travelerId" element={<PublicProfileScreen />} />
        <Route
          path="travelers/:travelerId/followers"
          element={<FollowListScreen type="followers" />}
        />
        <Route
          path="travelers/:travelerId/following"
          element={<FollowListScreen type="following" />}
        />
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
      <Route
        path="partner/apply/destination"
        element={<DistractionFreeShell />}
      >
        <Route index element={<DestinationApplicationScreen />} />
      </Route>
      <Route path="partner/application" element={<DistractionFreeShell />}>
        <Route index element={<PartnerApplicationStatusScreen />} />
      </Route>

      {/* Destination Partner Protected Operational Workspace */}
      <Route
        path="partner/destination"
        element={
          <DestinationRouteGuard>
            <WorkspaceShell
              surface="partner"
              title="Destination Partner Workspace"
              navigation={partnerDestinationNavigation}
            />
          </DestinationRouteGuard>
        }
      >
        <Route index element={<DestinationOverviewScreen />} />
        <Route path="profile" element={<DestinationProfileScreen />} />
        <Route
          path="verification"
          element={<DestinationVerificationBadgeScreen />}
        />
        <Route path="schedule" element={<DestinationScheduleScreen />} />
        <Route path="capacity" element={<DestinationCapacityScreen />} />
        <Route path="reviews" element={<DestinationReviewsScreen />} />
        <Route
          path="profile-settings"
          element={<DestinationSettingsScreen />}
        />
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
        <Route
          path="destinations/:destinationId"
          element={<EoDestinationDetailScreen />}
        />
        <Route path="reviews" element={<EoReviewsScreen />} />
        <Route path="profile" element={<EoProfileScreen />} />
      </Route>

      {/* Admin Operations Protected Workspace */}
      <Route path="admin/login" element={<DistractionFreeShell />}>
        <Route index element={<AdminLoginScreen />} />
      </Route>
      <Route
        path="admin"
        element={
          <AdminRouteGuard>
            <WorkspaceShell
              surface="admin"
              title="Admin Trust & Governance"
              navigation={adminNavigation}
            />
          </AdminRouteGuard>
        }
      >
        <Route index element={<AdminOverviewScreen />} />
        <Route path="eo-approvals" element={<AdminEoApprovalsScreen />} />
        <Route
          path="eo-approvals/:applicationId"
          element={<AdminEoApplicationReviewScreen />}
        />
        <Route
          path="destination-verifications"
          element={<AdminDestinationVerificationsScreen />}
        />
        <Route
          path="destination-verifications/:applicationId"
          element={<AdminDestinationVerificationDetailScreen />}
        />
        <Route
          path="package-approvals"
          element={<AdminPackageApprovalsScreen />}
        />
        <Route
          path="package-approvals/:submissionId"
          element={<AdminPackageReviewChecklistScreen />}
        />
        <Route path="bookings" element={<AdminBookingsScreen />} />
        <Route path="complaints" element={<AdminComplaintsScreen />} />
        <Route
          path="complaints/:complaintId"
          element={<AdminComplaintsScreen />}
        />
        <Route path="trust" element={<AdminTrustStatusScreen />} />
        <Route path="audit" element={<AdminAuditActivityScreen />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
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
