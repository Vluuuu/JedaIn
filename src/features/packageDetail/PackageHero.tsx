import { useRef, useState } from "react";
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
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const packageImages = packageData.visualAssets?.length
    ? [
        ...new Set(
          [packageData.visualAsset, ...packageData.visualAssets].filter(
            Boolean,
          ),
        ),
      ]
    : [];
  const isPackageGallery = packageImages.length > 0;
  const views = isPackageGallery
    ? packageImages.map((url, index) => ({
        label: index === 0 ? "Cover package" : `Media package ${index + 1}`,
        url,
        scale: 1,
        transformOrigin: "center center",
      }))
    : PROTOTYPE_GALLERY_VIEWS.map((view) => ({
        ...view,
        url: visual.svgDataUri,
      }));
  const safeIndex = Math.min(activeViewIndex, views.length - 1);
  const activeView = views[safeIndex];
  const moveView = (direction: number) => {
    setActiveViewIndex(
      (current) => (current + direction + views.length) % views.length,
    );
  };

  return (
    <section
      className="package-detail-media"
      aria-labelledby="package-gallery-heading"
    >
      <header
        className="package-detail-hero"
        onTouchStart={(event) => {
          const touch = event.touches[0];
          if (touch)
            touchStart.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          const touch = event.changedTouches[0];
          touchStart.current = null;
          if (!start || !touch || views.length < 2) return;
          const deltaX = touch.clientX - start.x;
          const deltaY = touch.clientY - start.y;
          if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY)) {
            moveView(deltaX < 0 ? 1 : -1);
          }
        }}
        onTouchCancel={() => {
          touchStart.current = null;
        }}
      >
        <img
          className="package-detail-hero__visual"
          src={activeView.url}
          alt={`${isPackageGallery ? "Visual package" : "Ilustrasi suasana"} ${packageData.title}`}
          role="img"
          aria-label={`${isPackageGallery ? "Visual package" : "Ilustrasi suasana"} ${packageData.title}`}
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
                ? `${packageData.rating.toFixed(1)}${packageData.ratingProvenance === "SAMPLE" ? " (contoh)" : ""}`
                : "Belum ada rating"}
            </span>
          </span>
        </div>
        {views.length > 1 && (
          <div className="package-detail-hero__carousel">
            <span
              className="package-detail-hero__slide-count"
              aria-live="polite"
            >
              {safeIndex + 1} / {views.length}
            </span>
            <div className="package-detail-hero__slide-actions">
              <button
                type="button"
                className="package-detail-hero__slide-button"
                aria-label="Foto sebelumnya"
                onClick={() => moveView(-1)}
              >
                ←
              </button>
              <button
                type="button"
                className="package-detail-hero__slide-button"
                aria-label="Foto berikutnya"
                onClick={() => moveView(1)}
              >
                →
              </button>
            </div>
          </div>
        )}
      </header>

      <details className="package-detail-gallery">
        <summary className="package-detail-gallery__heading-row">
          <div>
            <h2
              id="package-gallery-heading"
              className="package-detail-gallery__title"
            >
              Galeri suasana
            </h2>
            <span className="package-detail-gallery__eyebrow">
              Lihat gambaran pengalaman
            </span>
          </div>
          <span className="package-detail-gallery__summary-end">
            <span
              className="package-detail-gallery__counter"
              aria-live="polite"
              aria-atomic="true"
            >
              {safeIndex + 1}/{views.length}
            </span>
            <span
              className="package-detail-gallery__chevron"
              aria-hidden="true"
            >
              ⌄
            </span>
          </span>
        </summary>

        <div
          className="package-detail-gallery__thumbnails"
          role="group"
          aria-label="Pilihan visual suasana experience"
        >
          {views.map((view, index) => {
            const isActive = index === safeIndex;

            return (
              <button
                key={`${view.url}-${index}`}
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
                    src={view.url}
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
          {isPackageGallery
            ? "Media package dipilih Travel Organizer. Visual prototype dalam galeri tetap merupakan ilustrasi, bukan foto kondisi aktual destinasi."
            : "Satu ilustrasi prototype ditampilkan dalam beberapa crop untuk memberi gambaran suasana, bukan foto kondisi aktual destinasi."}
        </p>
      </details>
    </section>
  );
}
