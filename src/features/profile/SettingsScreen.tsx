import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeftIcon } from "../../components/shells/icons";
import { QUIZ_INTENT_OPTIONS } from "../quiz/config";
import { defaultProfileAdapter } from "./mockAdapter";
import type { ProfileAdapter, TravelerProfileData } from "./types";
import "./profile.css";

export interface SettingsScreenProps {
  adapter?: ProfileAdapter;
}

export function SettingsScreen({
  adapter = defaultProfileAdapter,
}: SettingsScreenProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<TravelerProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Edit presentation state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    adapter
      .getProfile()
      .then((profileData) => {
        if (!isMounted) return;
        setData(profileData);
        setDisplayName(
          profileData.presentation?.displayName ?? profileData.user.name ?? "",
        );
        setBio(profileData.presentation?.bio ?? "");
        setAvatarUrl(profileData.presentation?.avatarUrl);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Gagal memuat pengaturan profil.",
        );
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [adapter]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("File harus berupa gambar (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Ukuran gambar maksimal 5MB.");
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adapter.updatePresentationProfile) return;

    setIsSavingProfile(true);
    setSaveSuccessMessage(null);
    try {
      const updated = await adapter.updatePresentationProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatarUrl,
      });
      setDisplayName(updated.displayName);
      setBio(updated.bio ?? "");
      setAvatarUrl(updated.avatarUrl);
      setSaveSuccessMessage("Profil berhasil diperbarui.");
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Gagal memperbarui profil tampilan.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

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
      <div className="profile-container profile-subpage" aria-busy="true">
        <div className="profile-loading">
          <div
            className="profile-skeleton-bar"
            style={{ width: "35%", height: "1.5rem" }}
          />
          <div
            className="profile-skeleton-bar"
            style={{ width: "100%", height: "8rem", marginTop: "1rem" }}
          />
          <div
            className="profile-skeleton-bar"
            style={{ width: "100%", height: "8rem", marginTop: "1rem" }}
          />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user, isPhoneVerified, quizDraft } = data;

  const intentLabel = quizDraft?.current_intent
    ? (QUIZ_INTENT_OPTIONS.find((opt) => opt.value === quizDraft.current_intent)
        ?.label ?? quizDraft.current_intent)
    : null;

  const monogram = (displayName.trim() || user.name?.trim() || "J")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="profile-container profile-subpage">
      <header className="profile-subpage-header">
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="profile-back-button"
          aria-label="Kembali ke profil"
        >
          <ArrowLeftIcon width={18} height={18} />
          <span>Kembali ke Profil</span>
        </button>
        <h1 className="profile-subpage-title">Pengaturan Profil</h1>
        <p className="profile-subpage-lead">
          Kelola identitas traveler, kontak, preferensi jeda, dan privasi akunmu
          di JedaIn.
        </p>
      </header>

      {errorMessage && (
        <div className="profile-error-box" role="alert">
          <p>{errorMessage}</p>
        </div>
      )}

      {saveSuccessMessage && (
        <div className="profile-success-box" role="status">
          <p>{saveSuccessMessage}</p>
        </div>
      )}

      {/* 1. Identity Editor with Avatar Upload (Visual Rebuild at TOP) */}
      <section
        className="profile-settings-section"
        aria-labelledby="heading-edit-profile"
      >
        <h2
          id="heading-edit-profile"
          className="profile-settings-section-title"
        >
          Edit Profil
        </h2>
        <form onSubmit={handleSaveProfile} className="profile-settings-form">
          <div className="profile-settings-avatar-row">
            <div className="profile-avatar-preview-wrap">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="profile-avatar-preview-img"
                />
              ) : (
                <div
                  className="profile-avatar-preview-monogram"
                  aria-hidden="true"
                >
                  {monogram}
                </div>
              )}
            </div>

            <div className="profile-avatar-upload-controls">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="profile-upload-btn"
                aria-label="Pilih foto profil"
              >
                Ubah Foto Profil
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                style={{ display: "none" }}
                aria-hidden="true"
              />
              <span className="profile-upload-hint">
                Format JPG, PNG, atau WebP. Maks 5MB.
              </span>
            </div>
          </div>

          <div className="profile-settings-field">
            <label htmlFor="settings-name" className="profile-settings-label">
              Nama Tampilan
            </label>
            <input
              id="settings-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nama panggilanmu di JedaIn"
              className="profile-settings-input"
              maxLength={60}
              required
            />
          </div>

          <div className="profile-settings-field">
            <label htmlFor="settings-bio" className="profile-settings-label">
              Bio Singkat
            </label>
            <input
              id="settings-bio"
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ceritakan ketenangan yang kamu cari..."
              className="profile-settings-input"
              maxLength={120}
            />
          </div>

          <button
            type="submit"
            disabled={isSavingProfile}
            className="profile-save-button"
          >
            {isSavingProfile ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </form>
      </section>

      {/* 2. Kontak & Akun */}
      <section
        className="profile-settings-section"
        aria-labelledby="heading-contact-account"
      >
        <h2
          id="heading-contact-account"
          className="profile-settings-section-title"
        >
          Kontak & Akun
        </h2>

        <div className="profile-info-list">
          {user.name && (
            <div className="profile-info-row">
              <span className="profile-info-term">Nama Akun</span>
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
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
                  {!isPhoneVerified && (
                    <Link
                      to="/profile/verify-phone"
                      className="profile-text-link"
                      style={{ marginTop: 0 }}
                    >
                      Verifikasi Sekarang &rarr;
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Preferensi Jeda */}
      <section
        className="profile-settings-section"
        aria-labelledby="heading-preferences"
      >
        <h2 id="heading-preferences" className="profile-settings-section-title">
          Preferensi Jeda
        </h2>
        <div className="profile-settings-pref-summary">
          <p className="profile-settings-pref-text">
            {intentLabel
              ? `Fokus utama saat ini: ${intentLabel}`
              : "Preferensi jeda belum diatur."}
          </p>
          <Link
            to="/profile/preferences"
            className="profile-settings-action-link"
            aria-label="Ubah preferensi perjalanan"
          >
            <span>Ubah Preferensi</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </section>

      {/* 4. Privasi & Data */}
      <section
        className="profile-settings-section"
        aria-labelledby="heading-privacy"
      >
        <h2 id="heading-privacy" className="profile-settings-section-title">
          Privasi & Data
        </h2>
        <p className="profile-privacy-note">
          Preferensimu digunakan untuk personalisasi rekomendasi dan insight
          agregat, bukan untuk menampilkan data pribadi ke partner.
        </p>
      </section>

      {/* 5. Keluar dari Akun */}
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
