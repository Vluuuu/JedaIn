import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeftIcon } from "../../components/shells/icons";
import {
  mockTravelerCommunityStore,
  type PublicTravelerRecord,
} from "./mockCommunityStore";
import "./profile.css";

export function FollowListScreen({
  type,
}: {
  type: "followers" | "following";
}) {
  const { travelerId } = useParams<{ travelerId: string }>();
  const navigate = useNavigate();

  const traveler = travelerId
    ? mockTravelerCommunityStore.getTravelerById(travelerId)
    : undefined;

  const list: PublicTravelerRecord[] = travelerId
    ? type === "followers"
      ? mockTravelerCommunityStore.getFollowersList(travelerId)
      : mockTravelerCommunityStore.getFollowingList(travelerId)
    : [];

  const title = type === "followers" ? "Followers" : "Following";
  const travelerName = traveler?.displayName || "Traveler";

  return (
    <div className="profile-container profile-subpage">
      <header className="profile-subpage-header">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="profile-back-button"
          aria-label="Kembali"
        >
          <ArrowLeftIcon width={18} height={18} />
          <span>Kembali</span>
        </button>
        <h1 className="profile-subpage-title">{title}</h1>
        <p className="profile-subpage-lead">
          Daftar {type} untuk {travelerName} di JedaIn.
        </p>
      </header>

      <main className="profile-follow-list-main" aria-label={`Daftar ${title}`}>
        {list.length > 0 ? (
          <ul className="profile-travelers-list">
            {list.map((t) => {
              const monogram = t.displayName.charAt(0).toUpperCase() || "T";
              return (
                <li key={t.travelerId} className="profile-traveler-card">
                  <Link
                    to={`/travelers/${t.travelerId}`}
                    className="profile-traveler-link"
                    aria-label={`Lihat profil ${t.displayName}`}
                  >
                    <div className="profile-traveler-avatar">
                      {t.avatarUrl ? (
                        <img
                          src={t.avatarUrl}
                          alt={t.displayName}
                          className="profile-avatar-img"
                        />
                      ) : (
                        <div
                          className="profile-avatar-small-monogram"
                          aria-hidden="true"
                        >
                          {monogram}
                        </div>
                      )}
                    </div>
                    <div className="profile-traveler-meta">
                      <span className="profile-traveler-name">
                        {t.displayName}
                      </span>
                      {t.bio && (
                        <span className="profile-traveler-bio">{t.bio}</span>
                      )}
                      <span className="profile-traveler-trips">
                        {t.completedJedaCount} Jeda Selesai
                      </span>
                    </div>
                    <span className="profile-traveler-arrow" aria-hidden="true">
                      &rarr;
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="profile-empty-content">
            <p>Belum ada {title.toLowerCase()}.</p>
          </div>
        )}
      </main>
    </div>
  );
}
