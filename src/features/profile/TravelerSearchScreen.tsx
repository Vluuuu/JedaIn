import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeftIcon, SearchIcon } from "../../components/shells/icons";
import {
  mockTravelerCommunityStore,
  type PublicTravelerRecord,
} from "./mockCommunityStore";
import "./profile.css";

export function TravelerSearchScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicTravelerRecord[]>(() =>
    mockTravelerCommunityStore.getAllTravelers(),
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim();
    if (!clean) {
      setResults(mockTravelerCommunityStore.getAllTravelers());
    } else {
      setResults(mockTravelerCommunityStore.searchTravelers(clean));
    }
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setResults(mockTravelerCommunityStore.getAllTravelers());
    } else {
      setResults(mockTravelerCommunityStore.searchTravelers(val));
    }
  };

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
        <h1 className="profile-subpage-title">Cari Traveler</h1>
        <p className="profile-subpage-lead">
          Temukan sesama traveler dan inspirasi perjalanan jeda mereka.
        </p>
      </header>

      <form onSubmit={handleSearch} className="profile-search-form">
        <div className="profile-search-input-wrap">
          <SearchIcon width={18} height={18} className="profile-search-icon" />
          <input
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Cari nama traveler..."
            className="profile-search-input"
            aria-label="Cari nama traveler"
            autoFocus
          />
        </div>
      </form>

      <main
        className="profile-search-results"
        aria-label="Hasil pencarian traveler"
      >
        {results.length > 0 ? (
          <ul className="profile-travelers-list">
            {results.map((t) => {
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
            <p>Tidak ada traveler ditemukan.</p>
            <p className="profile-empty-subtext">
              Coba cari dengan kata kunci nama traveler yang lain.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
