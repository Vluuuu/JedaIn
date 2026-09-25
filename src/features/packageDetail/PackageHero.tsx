import { useState } from "react";
import { Badge } from "../../components/ui";
import { getPackageVisual } from "../../lib/assets/packageImages";
import type { PackageRecommendationSource } from "../recommendation/types";

export interface PackageHeroProps {
  packageData: PackageRecommendationSource;
}

const PROTOTYPE_GALLERY_VIEWS = [
  {
    label: "Gambaran utama",
    scale: 1,
    transformOrigin: "center center",
  },
  {
    label: "Detail suasana I",
    scale: 1.24,
    transformOrigin: "left center",
  },
  {
    label: "Detail suasana II",
    scale: 1.24,
    transformOrigin: "right center",
  },
] as const;

export function PackageHero({ packageData }: PackageHeroProps) {
  const visual = getPackageVisual(
    packageData.id,
    packageData.destinationName,
    packageData.visualAsset,
  );
  const [activeViewIndex, setActiveViewIndex] = useState(0);
  const activeView = PROTOTYPE_GALLERY_VIEWS[activeViewIndex];

  return (
    <section
      className="package-detail-media"
      aria-labelledby="package-gallery-heading"
    >
      <header className="package-detail-hero">
        <img
          className="package-detail-hero__visual"
          src={visual.svgDataUri}
          alt={`Ilustrasi suasana ${packageData.title}`}
          role="img"
          aria-label={`Ilustrasi suasana ${packageData.title}`}
          width={800}
          height={500}
          fetchPriority="high"
          style={{
            transform: `scale(${activeView.scale})`,
            transformOrigin: activeView.transformOrigin,
          }}
        />
        <div className="package-detail-hero__visual-scrim" aria-hidden="true" />
        <div className="package-detail-hero__badges">
          <Badge tone="success" className="package-detail-hero__trust-badge">
            {packageData.verificationLevel === "PLUS"
              ? "Terverifikasi Plus"
              : "Terverifikasi Dasar"}
          </Badge>
          <span className="package-detail-hero__rating-pill">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="package-detail-hero__rating-star"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>
              {packageData.rating !== undefined && packageData.rating !== null
                ? packageData.rating.toFixed(1)
                : "Belum ada rating"}
            </span>
          </span>
        </div>
      </header>

      <div className="package-detail-gallery">
        <div className="package-detail-gallery__heading-row">
          <div>
            <span className="package-detail-gallery__eyebrow">\n              Galeri suasana\n            </span>
            <h2
              id="package-gallery-heading"
              className="package-detail-gallery__title"
            >
              Lihat gambaran pengalaman
            </h2>
          </div>
          <span
            className="package-detail-gallery__counter"
            aria-live="polite"
            aria-atomic="true"
          >
            {activeViewIndex + 1}/{PROTOTYPE_GALLERY_VIEWS.length}
          </span>
        </div>

        <div
          className="package-detail-gallery__thumbnails"
          role="group"
          aria-label="Pilihan visual suasana experience"
        >
          {PROTOTYPE_GALLERY_VIEWS.map((view, index) => {
            const isActive = index === activeViewIndex;

            return (
              <button
                key={view.label}
                type="button"
                className={`package-detail-gallery__thumb${
                  isActive ? " package-detail-gallery__thumb--active" : ""
                }`}
                aria-pressed={isActive}
                aria-label={`Tampilkan ${view.label.toLowerCase()}`}
                onClick={() => setActiveViewIndex(index)}
              >
                <span className="package-detail-gallery__thumb-media">
                  <img
                    src={visual.svgDataUri}
                    alt=""
                    aria-hidden="true"
                    width={240}
                    height={150}
                    loading="lazy"
                    style={{
                      transform: `scale(${view.scale})`,
                      transformOrigin: view.transformOrigin,
                    }}
                  />
                </span>
                <span className="package-detail-gallery__thumb-label">
                  {view.label}
                </span>
              </button>
            );
          })}
        </div>

        <p className="package-detail-gallery__note">
          Visual suasana pada prototype untuk memberi gambaran experience,
          bukan dokumentasi kondisi aktual destinasi.
        </p>
      </div>
    </section>
  );
}
