import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockDestinationStore } from "./mockDestinationStore";
import "./eo.css";

export function EoDestinationsScreen() {
  const navigate = useNavigate();
  const destinations = mockDestinationStore.getAll();

  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<"ALL" | "BASIC" | "PLUS">(
    "ALL",
  );

  const filteredDestinations = useMemo(() => {
    return destinations.filter((dest) => {
      if (dest.status !== "ACTIVE") return false;

      // Filter verification level
      if (levelFilter !== "ALL" && dest.verificationLevel !== levelFilter) {
        return false;
      }

      // Search matching name, city, locationLabel
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = dest.name.toLowerCase().includes(query);
        const matchesCity = dest.city.toLowerCase().includes(query);
        const matchesLoc = dest.locationLabel.toLowerCase().includes(query);
        if (!matchesName && !matchesCity && !matchesLoc) return false;
      }

      return true;
    });
  }, [destinations, levelFilter, searchQuery]);

  return (
    <div className="eo-destinations-container">
      {/* 1. Header */}
      <header className="eo-destinations-header">
        <div className="eo-destinations-header__main">
          <h1>Destinasi Terverifikasi</h1>
          <p className="eo-destinations-header__subtitle">
            Temukan mitra destinasi dan pelajari potensi aktivitasnya sebelum
            merancang package.
          </p>
        </div>
      </header>

      {/* 2. Scalable Filter & Search Toolbar */}
      <div className="eo-destinations-toolbar">
        <div className="eo-destinations-search">
          <input
            type="search"
            placeholder="Cari nama atau area destinasi…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="eo-destinations-search-input"
            aria-label="Cari destinasi"
          />
        </div>

        <div className="eo-destinations-filter-chips" role="tablist">
          <button
            type="button"
            className={`eo-dest-chip ${levelFilter === "ALL" ? "eo-dest-chip--active" : ""}`}
            onClick={() => setLevelFilter("ALL")}
            role="tab"
            aria-selected={levelFilter === "ALL"}
          >
            Semua
          </button>
          <button
            type="button"
            className={`eo-dest-chip ${levelFilter === "PLUS" ? "eo-dest-chip--active" : ""}`}
            onClick={() => setLevelFilter("PLUS")}
            role="tab"
            aria-selected={levelFilter === "PLUS"}
          >
            Terverifikasi Plus
          </button>
          <button
            type="button"
            className={`eo-dest-chip ${levelFilter === "BASIC" ? "eo-dest-chip--active" : ""}`}
            onClick={() => setLevelFilter("BASIC")}
            role="tab"
            aria-selected={levelFilter === "BASIC"}
          >
            Terverifikasi Dasar
          </button>
        </div>
      </div>

      {/* 3. Destination Cards Grid */}
      <section
        className="eo-destinations-grid"
        aria-label="Katalog destinasi mitra"
      >
        {filteredDestinations.length === 0 ? (
          <div className="eo-destinations-empty">
            <p>Tidak ada destinasi yang cocok dengan pencarian Anda.</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setLevelFilter("ALL");
              }}
            >
              Reset Filter
            </Button>
          </div>
        ) : (
          filteredDestinations.map((dest) => (
            <article key={dest.destinationId} className="eo-dest-card">
              {/* Media Thumb */}
              <div className="eo-dest-card__media">
                {dest.imageUrl ? (
                  <img
                    src={dest.imageUrl}
                    alt={dest.name}
                    className="eo-dest-card__img"
                  />
                ) : (
                  <div className="eo-dest-card__img-placeholder" />
                )}
                <div className="eo-dest-card__badges">
                  <Badge
                    tone={
                      dest.verificationLevel === "PLUS" ? "info" : "success"
                    }
                  >
                    {dest.verificationLevel === "PLUS"
                      ? "Terverifikasi Plus"
                      : "Terverifikasi Dasar"}
                  </Badge>
                </div>
              </div>

              {/* Body */}
              <div className="eo-dest-card__body">
                <div>
                  <h2 className="eo-dest-card__title">{dest.name}</h2>
                  <p className="eo-dest-card__location">{dest.locationLabel}</p>
                  <p className="eo-dest-card__desc">{dest.description}</p>

                  {/* Highlights / Activities */}
                  {dest.highlights && dest.highlights.length > 0 && (
                    <ul className="eo-dest-card__highlights">
                      {dest.highlights.slice(0, 3).map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Local Guide info */}
                <div className="eo-dest-card__guide">
                  <span className="eo-dest-card__guide-status">
                    🌿 Pemandu lokal tersedia
                  </span>
                  <span className="eo-dest-card__capacity">
                    Kapasitas {dest.capacityPerSession} orang/sesi
                  </span>
                </div>

                {/* Footer: Price & Actions */}
                <div className="eo-dest-card__footer">
                  <div className="eo-dest-card__pricing">
                    <span className="eo-dest-card__price-label">
                      Biaya dasar destinasi
                    </span>
                    <strong className="eo-dest-card__price-value">
                      Rp{dest.baseCostPerPerson.toLocaleString("id-ID")}
                      <small> / orang</small>
                    </strong>
                  </div>

                  <div className="eo-dest-card__actions">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/partner/eo/destinations/${dest.destinationId}`,
                        )
                      }
                    >
                      Lihat Detail
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/partner/eo/packages/new?destinationId=${dest.destinationId}`,
                        )
                      }
                    >
                      Buat Paket
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
