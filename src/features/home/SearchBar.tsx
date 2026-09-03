import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";

export function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return; // Empty submit does not navigate
    navigate(`/explore?query=${encodeURIComponent(cleanQuery)}`);
  };

  return (
    <form className="home-search-bar" onSubmit={handleSubmit} role="search">
      <div className="home-search-bar__input-wrap">
        <span className="home-search-bar__icon" aria-hidden="true">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="search"
          className="home-search-bar__input"
          placeholder="Cari healing, lokasi, atau experience..."
          aria-label="Cari healing, lokasi, atau experience"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <button type="submit" className="home-search-bar__submit">
        <span>Cari</span>
      </button>
    </form>
  );
}
