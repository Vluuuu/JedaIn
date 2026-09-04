import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  LeafIcon,
  PlayCircleIcon,
  SettingsIcon,
} from "../../components/shells/icons";
import {
  QUIZ_ACTIVITY_OPTIONS,
  QUIZ_BUDGET_OPTIONS,
  QUIZ_DEPARTURE_OPTIONS,
  QUIZ_DURATION_OPTIONS,
  QUIZ_GROUP_SIZE_OPTIONS,
  QUIZ_GROUP_TYPE_OPTIONS,
  QUIZ_INTENT_OPTIONS,
} from "../quiz/config";
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
  } = data;

  // Resolve displayName & monogram
  const displayName = presentation?.displayName?.trim()
    ? presentation.displayName
    : user.name?.trim()
      ? user.name
      : "Traveler JedaIn";

  const monogram = displayName.charAt(0).toUpperCase() || "J";
  const bioText = presentation?.bio?.trim() || null;

  // Resolve human-readable labels from quiz draft
  const hasValidPreferences = isCompletedQuizDraft(quizDraft);

  const intentLabel = quizDraft?.current_intent
    ? (QUIZ_INTENT_OPTIONS.find((opt) => opt.value === quizDraft.current_intent)
        ?.label ?? quizDraft.current_intent)
    : null;

  const activityLabels = (quizDraft?.preferred_activities ?? []).map(
    (act) =>
      QUIZ_ACTIVITY_OPTIONS.find((opt) => opt.value === act)?.label ?? act,
  );

  const budgetLabel = quizDraft?.budget_band
    ? (QUIZ_BUDGET_OPTIONS.find((opt) => opt.value === quizDraft.budget_band)
        ?.label ?? quizDraft.budget_band)
    : null;

  const durationLabel = quizDraft?.duration_preference
    ? (QUIZ_DURATION_OPTIONS.find(
        (opt) => opt.value === quizDraft.duration_preference,
      )?.label ?? quizDraft.duration_preference)
    : null;

  const departureLabel =
    quizDraft?.departure_area_label ||
    (quizDraft?.departure_area_id
      ? (QUIZ_DEPARTURE_OPTIONS.find(
          (opt) => opt.value === quizDraft.departure_area_id,
        )?.label ?? quizDraft.departure_area_id)
      : null);

  const groupTypeLabel = quizDraft?.group_type
    ? (QUIZ_GROUP_TYPE_OPTIONS.find((opt) => opt.value === quizDraft.group_type)
        ?.label ?? quizDraft.group_type)
    : null;

  const groupSizeLabel = quizDraft?.group_size_band
    ? (QUIZ_GROUP_SIZE_OPTIONS.find(
        (opt) => opt.value === quizDraft.group_size_band,
      )?.label ?? quizDraft.group_size_band)
    : null;

  const groupSummary =
    quizDraft?.group_type === "SOLO"
      ? "Sendiri"
      : quizDraft?.group_type === "PARTNER"
        ? "Pasangan"
        : groupTypeLabel && groupSizeLabel
          ? `${groupTypeLabel} (${groupSizeLabel})`
          : groupTypeLabel || null;

  return (
    <div className="profile-container profile-main-page">
      {errorMessage && (
        <div className="profile-error-box" role="alert">
          <p>{errorMessage}</p>
        </div>
      )}

      {/* 1. Forest Green Profile Identity Hero */}
      <header className="profile-hero-forest">
        <div className="profile-hero-top-action">
          <Link
            to="/profile/settings"
            className="profile-settings-gear-link"
            aria-label="Pengaturan Profil"
          >
            <SettingsIcon width={22} height={22} />
          </Link>
        </div>

        <div className="profile-identity-center">
          <div className="profile-avatar-monogram" aria-hidden="true">
            {monogram}
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

        {/* 2. Journey + Social Stat Row */}
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
          <div className="profile-stat-col">
            <span className="profile-stat-number">{stats.followersCount}</span>
            <span className="profile-stat-label">Followers</span>
          </div>
          <div className="profile-stat-divider" aria-hidden="true" />
          <div className="profile-stat-col">
            <span className="profile-stat-number">{stats.followingCount}</span>
            <span className="profile-stat-label">Following</span>
          </div>
        </div>

        {/* 3. Jeda Milestones Strip */}
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
                <div className="profile-milestone-mark" aria-hidden="true">
                  {ach.earned ? "✓" : ach.progressText || "•"}
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
        {/* 4. Current Preferences Section */}
        <section
          className="profile-section"
          aria-labelledby="profile-pref-heading"
        >
          <div className="profile-section-header">
            <h2 id="profile-pref-heading" className="profile-section-title">
              Jeda yang kamu butuhkan sekarang
            </h2>
          </div>

          {hasValidPreferences && quizDraft ? (
            <div className="profile-preference-content">
              <div className="profile-intent-block">
                <div className="profile-intent-badge">Fokus Utama</div>
                <div className="profile-intent-value">{intentLabel}</div>
              </div>

              <div className="profile-facts-grid">
                {activityLabels.length > 0 && (
                  <div className="profile-fact-item">
                    <span className="profile-fact-label">Aktivitas</span>
                    <div className="profile-chips-group">
                      {activityLabels.map((act) => (
                        <span key={act} className="profile-restrained-chip">
                          {act}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {budgetLabel && (
                  <div className="profile-fact-item">
                    <span className="profile-fact-label">Budget</span>
                    <span className="profile-fact-value">{budgetLabel}</span>
                  </div>
                )}

                {durationLabel && (
                  <div className="profile-fact-item">
                    <span className="profile-fact-label">Durasi</span>
                    <span className="profile-fact-value">{durationLabel}</span>
                  </div>
                )}

                {departureLabel && (
                  <div className="profile-fact-item">
                    <span className="profile-fact-label">Berangkat dari</span>
                    <span className="profile-fact-value">{departureLabel}</span>
                  </div>
                )}

                {groupSummary && (
                  <div className="profile-fact-item">
                    <span className="profile-fact-label">Pergi bersama</span>
                    <span className="profile-fact-value">{groupSummary}</span>
                  </div>
                )}
              </div>

              <Link
                to="/profile/preferences"
                className="profile-preference-cta"
                aria-label="Ubah preferensi perjalanan"
              >
                <span>Ubah Preferensi</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          ) : (
            <div className="profile-empty-preference">
              <p>Preferensi belum tersedia.</p>
              <Link
                to="/profile/preferences"
                className="profile-preference-cta"
                aria-label="Atur preferensi perjalanan"
              >
                <span>Atur Preferensi</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          )}
        </section>

        {/* 5. Recent Activity (Max 3) */}
        <section
          className="profile-section"
          aria-labelledby="profile-activity-heading"
        >
          <div className="profile-section-header-split">
            <h2 id="profile-activity-heading" className="profile-section-title">
              Aktivitas Terbaru
            </h2>
            <Link
              to="/profile/activity"
              className="profile-view-all-link"
              aria-label="Lihat seluruh aktivitas perjalanan"
            >
              <span>Lihat Semua</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
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
                    {act.type === "TRIP_COMPLETED" && "🌿"}
                    {act.type === "REVIEW_SUBMITTED" && "★"}
                    {act.type === "ACHIEVEMENT_EARNED" && "✦"}
                    {act.type === "MOMENT_SHARED" && "📷"}
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

        {/* 6. Momen Jeda */}
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
