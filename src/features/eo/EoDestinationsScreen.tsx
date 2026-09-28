import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { destinationRepository } from "../../data/destinationRepository";
import { Button } from "../../components/ui";
import { getDestinationVisual } from "../../lib/assets/packageImages";
import { useRealtimeSubscription } from "../../lib/supabase/realtime";
import { mockDestinationStore } from "./mockDestinationStore";
import type { DestinationRecord } from "./types";
import "./eo.css";

export function EoDestinationsScreen() {
  const navigate = useNavigate();
  // EO catalog contains only active destinations that have passed the unified
  // JedaIn verification, including mandatory local-guide readiness.
  const [destinations, setDestinations] = useState<DestinationRecord[]>(() => [
    ...mockDestinationStore.getEligibleForEo(),
  ]);

  useEffect(() => {
    let isMounted = true;
    destinationRepository.getEligibleForEo().then((res) => {
      if (isMounted) setDestinations(res);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useRealtimeSubscription("destinations", () => {
    destinationRepository.getEligibleForEo().then(setDestinations);
  });

  const [searchQuery, setSearchQuery] = useState("");

  const filteredDestinations = useMemo(() => {
    return destinations.filter((dest) => {
      if (dest.status !== "ACTIVE") return false;

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
  }, [destinations, searchQuery]);

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
                <img
                  src={
                    dest.imageUrl || getDestinationVisual(dest.name).svgDataUri
                  }
                  alt={dest.name}
                  className="eo-dest-card__img"
                  loading="lazy"
                />
              </div>

              {/* Body */}
              <div className="eo-dest-card__body">
                <div className="eo-dest-card__header-info">
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

                {/* Capacity info */}
                <div className="eo-dest-card__guide">
                  <span className="eo-dest-card__capacity">
                    Kapasitas umum destinasi: {dest.capacityPerSession}{" "}
                    orang/sesi
                  </span>
                  <span className="eo-dest-card__capacity-hint">
                    Kapasitas umum destinasi per sesi, bukan kuota otomatis per
                    paket Travel Organizer.
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
                    <span>
                      Tarif pemandu lokal: Rp
                      {(dest.localGuideFeePerPerson ?? 0).toLocaleString(
                        "id-ID",
                      )}{" "}
                      / orang
                    </span>
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
