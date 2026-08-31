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
          🔍
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
        Cari
      </button>
    </form>
  );
}
