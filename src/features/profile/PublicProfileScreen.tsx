import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeftIcon } from "../../components/shells/icons";
import {
  MilestoneSproutIcon,
  MilestoneTrailIcon,
} from "../../components/shells/icons";
import { sessionStore } from "../onboarding/sessionStore";
import { mockTravelerCommunityStore } from "./mockCommunityStore";
import "./profile.css";

export function PublicProfileScreen() {
  const { travelerId } = useParams<{ travelerId: string }>();
  const navigate = useNavigate();
  const currentUser = sessionStore.get().user;

  const targetTraveler = travelerId
    ? mockTravelerCommunityStore.getTravelerById(travelerId)
    : undefined;

  const isOwnProfile = currentUser?.id === travelerId;

  const [isFollowing, setIsFollowing] = useState(() =>
    currentUser && travelerId
      ? mockTravelerCommunityStore.isFollowing(currentUser.id, travelerId)
      : false,
  );

  const [counts, setCounts] = useState(() =>
    travelerId
      ? mockTravelerCommunityStore.getCommunityCounts(travelerId)
      : { followers: 0, following: 0 },
  );

  if (!targetTraveler || !travelerId) {
    return (
      <div className="profile-container profile-subpage">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="profile-back-button"
        >
          <ArrowLeftIcon width={18} height={18} />
          <span>Kembali</span>
        </button>
        <div className="profile-empty-content">
          <p>Traveler tidak ditemukan.</p>
          <Link to="/travelers/search" className="profile-text-link">
            Cari Traveler Lain &rarr;
          </Link>
        </div>
      </div>
    );
  }

  const handleToggleFollow = () => {
    if (!currentUser || isOwnProfile) return;
    if (isFollowing) {
      mockTravelerCommunityStore.unfollow(currentUser.id, travelerId);
      setIsFollowing(false);
      setCounts(mockTravelerCommunityStore.getCommunityCounts(travelerId));
    } else {
      mockTravelerCommunityStore.follow(currentUser.id, travelerId);
      setIsFollowing(true);
      setCounts(mockTravelerCommunityStore.getCommunityCounts(travelerId));
    }
  };

  const monogram = targetTraveler.displayName.charAt(0).toUpperCase() || "T";

  // Source-backed milestone derivation:
  // Jeda Pertama earned strictly when completedJedaCount >= 1
  // Tiga Jeda earned strictly when completedJedaCount >= 3
  // 5 Destinasi & Pemberi Ulasan omitted because unprovable from public record
  const jedaPertamaEarned = targetTraveler.completedJedaCount >= 1;
  const tigaJedaEarned = targetTraveler.completedJedaCount >= 3;

  return (
    <div className="profile-container profile-main-page">
      {/* 1. Forest Identity Cover */}
      <header className="profile-hero-forest">
        <div
          className="profile-hero-top-action"
          style={{ justifyContent: "space-between" }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="profile-settings-gear-link"
            aria-label="Kembali"
          >
            <ArrowLeftIcon width={20} height={20} />
          </button>
        </div>

        <div className="profile-identity-center">
          <div className="profile-avatar-monogram" aria-hidden="true">
            {targetTraveler.avatarUrl ? (
              <img
                src={targetTraveler.avatarUrl}
                alt={targetTraveler.displayName}
                className="profile-avatar-img"
              />
            ) : (
              monogram
            )}
          </div>
          <h1 className="profile-hero-name">{targetTraveler.displayName}</h1>
          {targetTraveler.bio && (
            <p className="profile-hero-bio">{targetTraveler.bio}</p>
          )}

          {/* Follow Button: ONLY on other travelers' profiles, NEVER on own profile */}
          {!isOwnProfile && currentUser && (
            <button
              type="button"
              onClick={handleToggleFollow}
              className={`profile-follow-action-btn ${
                isFollowing
                  ? "profile-follow-action-btn--following"
                  : "profile-follow-action-btn--follow"
              }`}
              aria-label={isFollowing ? "Berhenti mengikuti" : "Ikuti traveler"}
            >
              {isFollowing ? "Mengikuti" : "+ Ikuti"}
            </button>
          )}
        </div>

        {/* 2. Interactive Journey + Social Stat Row */}
        <div
          className="profile-stats-row"
          role="group"
          aria-label="Statistik Perjalanan"
        >
          <div className="profile-stat-col">
            <span className="profile-stat-number">
              {targetTraveler.completedJedaCount}
            </span>
            <span className="profile-stat-label">Jeda Selesai</span>
          </div>
          <div className="profile-stat-divider" aria-hidden="true" />
          <Link
            to={`/travelers/${travelerId}/followers`}
            className="profile-stat-col profile-stat-link"
            aria-label={`Daftar pengikut: ${counts.followers}`}
          >
            <span className="profile-stat-number">{counts.followers}</span>
            <span className="profile-stat-label">Followers</span>
          </Link>
          <div className="profile-stat-divider" aria-hidden="true" />
          <Link
            to={`/travelers/${travelerId}/following`}
            className="profile-stat-col profile-stat-link"
            aria-label={`Daftar yang diikuti: ${counts.following}`}
          >
            <span className="profile-stat-number">{counts.following}</span>
            <span className="profile-stat-label">Following</span>
          </Link>
        </div>

        {/* 3. Truthful Public Jeda Milestones */}
        <section
          className="profile-milestones-section"
          aria-label="Pencapaian Jeda"
        >
          <h2 className="profile-milestones-title">Pencapaian Jeda</h2>
          <div
            className="profile-milestones-strip"
            style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
          >
            <div
              className={`profile-milestone-item ${
                jedaPertamaEarned
                  ? "profile-milestone-item--earned"
                  : "profile-milestone-item--locked"
              }`}
              title="Jeda Pertama"
            >
              <div className="profile-milestone-medallion" aria-hidden="true">
                <MilestoneSproutIcon width={18} height={18} />
              </div>
              <span className="profile-milestone-name">Jeda Pertama</span>
              <span className="profile-milestone-status">
                {jedaPertamaEarned ? "Tercapai" : "0/1"}
              </span>
            </div>

            <div
              className={`profile-milestone-item ${
                tigaJedaEarned
                  ? "profile-milestone-item--earned"
                  : "profile-milestone-item--locked"
              }`}
              title="Tiga Jeda"
            >
              <div className="profile-milestone-medallion" aria-hidden="true">
                <MilestoneTrailIcon width={18} height={18} />
              </div>
              <span className="profile-milestone-name">Tiga Jeda</span>
              <span className="profile-milestone-status">
                {tigaJedaEarned
                  ? "Tercapai"
                  : `${Math.min(targetTraveler.completedJedaCount, 3)}/3`}
              </span>
            </div>
          </div>
        </section>
      </header>

      {/* Warm Sand Content */}
      <div className="profile-warm-content">
        <section
          className="profile-section"
          aria-labelledby="public-activity-heading"
        >
          <h2 id="public-activity-heading" className="profile-section-title">
            Aktivitas Perjalanan
          </h2>
          <div className="profile-empty-activity">
            <p>
              Jejak perjalanan {targetTraveler.displayName} di alam nusantara.
            </p>
          </div>
        </section>

        <section
          className="profile-section"
          aria-labelledby="public-moments-heading"
        >
          <h2 id="public-moments-heading" className="profile-section-title">
            Momen Jeda
          </h2>
          <div className="profile-empty-moments">
            <p className="profile-empty-lead">
              Belum ada Momen Jeda dibagikan.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
