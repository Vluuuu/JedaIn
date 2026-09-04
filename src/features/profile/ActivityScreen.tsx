import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeftIcon } from "../../components/shells/icons";
import { defaultProfileAdapter } from "./mockAdapter";
import type { ProfileActivityItem, ProfileAdapter } from "./types";
import "./profile.css";

export interface ActivityScreenProps {
  adapter?: ProfileAdapter;
}

export function ActivityScreen({
  adapter = defaultProfileAdapter,
}: ActivityScreenProps) {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ProfileActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    adapter
      .getAllActivities()
      .then((items) => {
        if (!isMounted) return;
        setActivities(items);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Gagal memuat aktivitas perjalanan.",
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
            style={{ width: "35%", height: "1.5rem" }}
          />
          <div
            className="profile-skeleton-bar"
            style={{ width: "100%", height: "6rem", marginTop: "1rem" }}
          />
          <div
            className="profile-skeleton-bar"
            style={{ width: "100%", height: "6rem", marginTop: "1rem" }}
          />
        </div>
      </div>
    );
  }

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
        <h1 className="profile-subpage-title">Aktivitas Perjalanan</h1>
        <p className="profile-subpage-lead">
          Jejak langkah perjalanan dan refleksi jeda yang telah kamu lewati.
        </p>
      </header>

      {errorMessage && (
        <div className="profile-error-box" role="alert">
          <p>{errorMessage}</p>
        </div>
      )}

      <main className="profile-activity-full-list">
        {activities.length > 0 ? (
          <ul
            className="profile-activity-list"
            aria-label="Daftar aktivitas perjalanan"
          >
            {activities.map((item) => (
              <li key={item.id} className="profile-activity-row">
                <div
                  className="profile-activity-icon-bullet"
                  aria-hidden="true"
                >
                  {item.type === "TRIP_COMPLETED" && "🌿"}
                  {item.type === "REVIEW_SUBMITTED" && "★"}
                  {item.type === "ACHIEVEMENT_EARNED" && "✦"}
                  {item.type === "MOMENT_SHARED" && "📷"}
                </div>
                <div className="profile-activity-text">
                  <span className="profile-activity-title">{item.title}</span>
                  <span className="profile-activity-subtitle">
                    {item.subtitle}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="profile-empty-content">
            <p>Belum ada aktivitas perjalanan.</p>
            <p className="profile-empty-subtext">
              Aktivitas perjalananmu akan otomatis tercatat setelah kamu
              menyelesaikan perjalanan.
            </p>
            <Link to="/explore" className="profile-text-link">
              Jelajahi Paket Jeda &rarr;
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
