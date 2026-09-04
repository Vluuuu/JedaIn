import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  LeafIcon,
  MilestoneMapPinIcon,
  MilestoneReflectionStarIcon,
  MilestoneSproutIcon,
  MilestoneTrailIcon,
  PlayCircleIcon,
  SearchIcon,
  SettingsIcon,
} from "../../components/shells/icons";
import { QUIZ_INTENT_OPTIONS } from "../quiz/config";
import { isCompletedQuizDraft } from "../recommendation/mockAdapter";
import { defaultProfileAdapter } from "./mockAdapter";
import type { ProfileAdapter, TravelerProfileData } from "./types";
import "./profile.css";

export interface ProfileScreenProps {
  adapter?: ProfileAdapter;
}

export function ProfileScreen({
  adapter = defaultProfileAdapter,
}: ProfileScreenProps) {
  const [data, setData] = useState<TravelerProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    adapter
      .getProfile()
      .then((profileData) => {
        if (!isMounted) return;
        setData(profileData);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Gagal memuat informasi profil. Silakan coba lagi.",
        );
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [adapter]);

  if (isLoading) {
    return (
      <div className="profile-container" aria-busy="true">
        <div className="profile-loading">
          <div
            className="profile-skeleton-bar"
            style={{ width: "25%", height: "1rem" }}
          />
          <div
            className="profile-skeleton-bar"
            style={{ width: "50%", height: "2.25rem" }}
          />
          <div
            className="profile-skeleton-bar"
            style={{ width: "40%", height: "1.25rem" }}
          />
          <div
            className="profile-skeleton-bar"
            style={{ width: "100%", height: "8rem", marginTop: "1.5rem" }}
          />
        </div>
      </div>
    );
  }

  if (errorMessage && !data) {
    return (
      <div className="profile-container">
        <div className="profile-error-box" role="alert">
          <p>{errorMessage}</p>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setErrorMessage(null);
              adapter
                .getProfile()
                .then((profileData) => {
                  setData(profileData);
                  setIsLoading(false);
                })
                .catch((err: unknown) => {
                  setErrorMessage(
                    err instanceof Error ? err.message : "Gagal memuat profil.",
                  );
                  setIsLoading(false);
                });
            }}
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    user,
    presentation,
    stats,
    achievements,
    recentActivities,
    moments,
    quizDraft,
    isPhoneVerified,
  } = data;

  // Resolve displayName, avatar & monogram
  const displayName = presentation?.displayName?.trim()
    ? presentation.displayName
    : user.name?.trim()
      ? user.name
      : "Traveler JedaIn";

  const monogram = displayName.charAt(0).toUpperCase() || "J";
  const avatarUrl = presentation?.avatarUrl;
  const bioText = presentation?.bio?.trim() || null;

  // Resolve human-readable labels from quiz draft
  const hasValidPreferences = isCompletedQuizDraft(quizDraft);

  const intentLabel = quizDraft?.current_intent
    ? (QUIZ_INTENT_OPTIONS.find((opt) => opt.value === quizDraft.current_intent)
        ?.label ?? quizDraft.current_intent)
    : null;

  // Phone nudge condition: user has phone AND phone is unverified
  const showPhoneNudge = Boolean(user.phone && !isPhoneVerified);

  return (
    <div className="profile-container profile-main-page">
      {errorMessage && (
        <div className="profile-error-box" role="alert">
          <p>{errorMessage}</p>
        </div>
      )}

      {/* 1. Forest Identity Cover / Hero */}
      <header className="profile-hero-forest">
        <div className="profile-hero-top-action">
          <Link
            to="/travelers/search"
            className="profile-top-icon-btn"
            aria-label="Cari Traveler"
            title="Cari Traveler"
          >
            <SearchIcon width={20} height={20} />
          </Link>
          <Link
            to="/profile/settings"
            className="profile-top-icon-btn profile-settings-gear-link"
            aria-label="Pengaturan Profil"
            title="Pengaturan Profil"
          >
            <SettingsIcon width={20} height={20} />
          </Link>
        </div>

        <div className="profile-identity-center">
          <div className="profile-avatar-monogram" aria-hidden="true">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="profile-avatar-img"
              />
            ) : (
              monogram
            )}
          </div>
          <h1 className="profile-hero-name">{displayName}</h1>
          {bioText && <p className="profile-hero-bio">{bioText}</p>}

          {/* Micro-identity: Current Jeda intent */}
          {hasValidPreferences && intentLabel && (
            <div className="profile-current-jeda-pill">
              <span className="profile-current-jeda-prefix">Lagi butuh:</span>
              <div className="profile-current-jeda-badge">
                <LeafIcon
                  width={14}
                  height={14}
                  className="profile-current-jeda-icon"
                />
                <span>{intentLabel}</span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Journey + Social Stat Row (Interactive) */}
        <div
          className="profile-stats-row"
          role="group"
          aria-label="Statistik Perjalanan"
        >
          <div className="profile-stat-col">
            <span className="profile-stat-number">
              {stats.completedJedaCount}
            </span>
            <span className="profile-stat-label">Jeda Selesai</span>
          </div>
          <div className="profile-stat-divider" aria-hidden="true" />
          <Link
            to={`/travelers/${user.id}/followers`}
            className="profile-stat-col profile-stat-link"
            aria-label={`Daftar pengikut: ${stats.followersCount}`}
          >
            <span className="profile-stat-number">{stats.followersCount}</span>
            <span className="profile-stat-label">Followers</span>
          </Link>
          <div className="profile-stat-divider" aria-hidden="true" />
          <Link
            to={`/travelers/${user.id}/following`}
            className="profile-stat-col profile-stat-link"
            aria-label={`Daftar yang diikuti: ${stats.followingCount}`}
          >
            <span className="profile-stat-number">{stats.followingCount}</span>
            <span className="profile-stat-label">Following</span>
          </Link>
        </div>

        {/* 3. Jeda Milestones Strip with Custom SVG Medallion Icons */}
        <section
          className="profile-milestones-section"
          aria-label="Pencapaian Jeda"
        >
          <h2 className="profile-milestones-title">Jeda Milestones</h2>
          <div className="profile-milestones-strip">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`profile-milestone-item ${
                  ach.earned
                    ? "profile-milestone-item--earned"
                    : "profile-milestone-item--locked"
                }`}
                title={`${ach.title}: ${ach.description}`}
              >
                <div className="profile-milestone-medallion" aria-hidden="true">
                  {ach.id === "JEDA_PERTAMA" && (
                    <MilestoneSproutIcon width={18} height={18} />
                  )}
                  {ach.id === "TIGA_JEDA" && (
                    <MilestoneTrailIcon width={18} height={18} />
                  )}
                  {ach.id === "LIMA_DESTINASI" && (
                    <MilestoneMapPinIcon width={18} height={18} />
                  )}
                  {ach.id === "PEMBERI_ULASAN" && (
                    <MilestoneReflectionStarIcon width={18} height={18} />
                  )}
                </div>
                <span className="profile-milestone-name">{ach.title}</span>
                <span className="profile-milestone-status">
                  {ach.earned ? "Tercapai" : ach.progressText || "Terkunci"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </header>

      {/* Warm Sand Content Area */}
      <div className="profile-warm-content">
        {/* Contextual Phone Verification Nudge (Only if unverified and phone exists) */}
        {showPhoneNudge && (
          <aside
            className="profile-nudge-card"
            aria-label="Verifikasi nomor HP"
          >
            <div className="profile-nudge-text">
              <span className="profile-nudge-title">Lengkapi profilmu</span>
              <p className="profile-nudge-desc">
                Verifikasi nomor agar kontak perjalananmu siap saat booking.
              </p>
            </div>
            <Link
              to="/profile/verify-phone"
              className="profile-nudge-cta"
              aria-label="Verifikasi nomor HP sekarang"
            >
              Verifikasi Nomor
            </Link>
          </aside>
        )}

        {/* 4. Recent Activity (Max 3) */}
        <section
          className="profile-section"
          aria-labelledby="profile-activity-heading"
        >
          <div className="profile-section-header-split">
            <h2 id="profile-activity-heading" className="profile-section-title">
              <Link
                to="/profile/activity"
                className="profile-section-title-link profile-view-all-link"
                aria-label="Aktivitas Terbaru"
              >
                <span>Aktivitas Terbaru</span>
                <span aria-hidden="true" className="profile-title-arrow">
                  &rarr;
                </span>
              </Link>
            </h2>
          </div>

          {recentActivities.length > 0 ? (
            <ul
              className="profile-activity-list"
              aria-label="Aktivitas perjalanan terbaru"
            >
              {recentActivities.map((act) => (
                <li key={act.id} className="profile-activity-row">
                  <div
                    className="profile-activity-icon-bullet"
                    aria-hidden="true"
                  >
                    {act.type === "TRIP_COMPLETED" && (
                      <MilestoneTrailIcon width={14} height={14} />
                    )}
                    {act.type === "REVIEW_SUBMITTED" && (
                      <MilestoneReflectionStarIcon width={14} height={14} />
                    )}
                    {act.type === "ACHIEVEMENT_EARNED" && (
                      <MilestoneSproutIcon width={14} height={14} />
                    )}
                    {act.type === "MOMENT_SHARED" && (
                      <PlayCircleIcon width={14} height={14} />
                    )}
                  </div>
                  <div className="profile-activity-text">
                    <span className="profile-activity-title">{act.title}</span>
                    <span className="profile-activity-subtitle">
                      {act.subtitle}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="profile-empty-activity">
              <p>Belum ada aktivitas perjalanan.</p>
              <p className="profile-empty-subtext">
                Jejak perjalananmu akan muncul di sini setelah menyelesaikan
                pengalaman jeda.
              </p>
            </div>
          )}
        </section>

        {/* 5. Momen Jeda */}
        <section
          className="profile-section"
          aria-labelledby="profile-moments-heading"
        >
          <div className="profile-section-header">
            <h2 id="profile-moments-heading" className="profile-section-title">
              Momen Jeda
            </h2>
          </div>

          {moments.length > 0 ? (
            <div
              className="profile-moments-grid"
              aria-label="Galeri Momen Jeda"
            >
              {moments.map((m) => (
                <div key={m.momentId} className="profile-moment-card">
                  {m.mediaType === "VIDEO" ? (
                    <div className="profile-moment-video-wrap">
                      <img
                        src={m.thumbnailSource || m.mediaSource}
                        alt={m.caption || "Momen jeda perjalanan"}
                        className="profile-moment-img"
                      />
                      <div
                        className="profile-moment-video-indicator"
                        aria-hidden="true"
                      >
                        <PlayCircleIcon width={24} height={24} />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={m.mediaSource}
                      alt={m.caption || "Momen jeda perjalanan"}
                      className="profile-moment-img"
                    />
                  )}
                  {m.caption && (
                    <span className="profile-moment-caption">{m.caption}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="profile-empty-moments">
              <p className="profile-empty-lead">Belum ada Momen Jeda.</p>
              <p className="profile-empty-subtext">
                Setelah perjalanan selesai, foto dan video perjalananmu bisa
                tampil di sini.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
