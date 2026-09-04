import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
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
  const navigate = useNavigate();
  const [data, setData] = useState<TravelerProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await adapter.logout();
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      setIsLoggingOut(false);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Gagal keluar sesi. Silakan coba lagi.",
      );
    }
  };

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

  const { user, isPhoneVerified, quizDraft } = data;

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
    <div className="profile-container">
      {errorMessage && (
        <div className="profile-error-box" role="alert">
          <p>{errorMessage}</p>
        </div>
      )}

      {/* 1. Profile Header: Typographic Identity */}
      <header className="profile-header">
        <span className="profile-eyebrow">Profil</span>
        <h1 className="profile-name">
          {user.name?.trim() ? user.name : "Traveler JedaIn"}
        </h1>
        {user.email && <p className="profile-email">{user.email}</p>}
        <p className="profile-lead">
          Preferensi dan informasi perjalananmu di JedaIn.
        </p>
      </header>

      {/* 2. Current Preferences */}
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

      {/* 3. Contact & Account Identity */}
      <section
        className="profile-section"
        aria-labelledby="profile-contact-heading"
      >
        <div className="profile-section-header">
          <h2 id="profile-contact-heading" className="profile-section-title">
            Kontak & Akun
          </h2>
        </div>

        <div className="profile-info-list">
          {user.name && (
            <div className="profile-info-row">
              <span className="profile-info-term">Nama Lengkap</span>
              <span className="profile-info-desc">{user.name}</span>
            </div>
          )}

          {user.email && (
            <div className="profile-info-row">
              <span className="profile-info-term">Email</span>
              <span className="profile-info-desc">{user.email}</span>
            </div>
          )}

          <div className="profile-info-row">
            <span className="profile-info-term">Nomor HP</span>
            <div className="profile-phone-status">
              <span className="profile-info-desc">
                {user.phone ? user.phone : "Belum ditambahkan"}
              </span>
              {user.phone && (
                <span
                  className={`profile-verification-text ${
                    isPhoneVerified
                      ? "profile-verification-text--verified"
                      : "profile-verification-text--unverified"
                  }`}
                >
                  {isPhoneVerified
                    ? "✓ Nomor terverifikasi"
                    : "Belum terverifikasi"}
                </span>
              )}
              {!isPhoneVerified && (
                <p className="profile-verification-note">
                  Verifikasi nomor akan diminta secara kontekstual saat kamu
                  melakukan transaksi pemesanan.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Privacy & Data Information */}
      <section
        className="profile-section"
        aria-labelledby="profile-privacy-heading"
      >
        <div className="profile-section-header">
          <h2 id="profile-privacy-heading" className="profile-section-title">
            Privasi & Data
          </h2>
        </div>
        <p className="profile-privacy-note">
          Preferensimu digunakan untuk personalisasi rekomendasi dan insight
          agregat, bukan untuk menampilkan data pribadi ke partner.
        </p>
      </section>

      {/* 5. Logout */}
      <section className="profile-logout-section">
        <button
          type="button"
          className="profile-logout-button"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Keluar..." : "Keluar dari Akun"}
        </button>
      </section>
    </div>
  );
}
