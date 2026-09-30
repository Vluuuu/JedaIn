import { useEffect, useRef, useState } from "react";
import { getPackageVisual } from "../../lib/assets/packageImages";
import type { PackageRecommendationSource } from "../recommendation/types";

export interface PackageHeroProps {
  packageData: PackageRecommendationSource;
  preview?: boolean;
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

export function PackageHero({
  packageData,
  preview = false,
}: PackageHeroProps) {
  const visual = getPackageVisual(
    packageData.id,
    packageData.destinationName,
    packageData.visualAsset,
  );
  const [activeViewIndex, setActiveViewIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryTab, setGalleryTab] = useState<"photos" | "videos">("photos");
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const galleryOpener = useRef<HTMLButtonElement | null>(null);
  const galleryBack = useRef<HTMLButtonElement | null>(null);
  const galleryPanel = useRef<HTMLDivElement | null>(null);
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
  const hasPreviewMedia = !preview || isPackageGallery;
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
  const openGallery = (tab: "photos" | "videos", opener: HTMLButtonElement) => {
    galleryOpener.current = opener;
    setGalleryTab(tab);
    setGalleryOpen(true);
  };

  useEffect(() => {
    if (!galleryOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    galleryBack.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setGalleryOpen(false);
      if (event.key !== "Tab" || !galleryPanel.current) return;
      const focusable = Array.from(
        galleryPanel.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      galleryOpener.current?.focus();
    };
  }, [galleryOpen]);

  return (
    <section
      className="package-detail-media"
      aria-labelledby={hasPreviewMedia ? "package-gallery-heading" : undefined}
      aria-label={hasPreviewMedia ? undefined : "Visual paket"}
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
        {hasPreviewMedia ? (
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
        ) : (
          <div className="package-detail-hero__placeholder">
            Visual utama belum ditambahkan.
          </div>
        )}
        {hasPreviewMedia && (
          <div
            className="package-detail-hero__visual-scrim"
            aria-hidden="true"
          />
        )}
        {!preview && (
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
        )}
        {hasPreviewMedia && views.length > 1 && (
          <div
            className="package-detail-hero__dots"
            role="group"
            aria-label="Pilih foto cover"
          >
            {views.map((view, index) => (
              <button
                key={`${view.url}-${index}`}
                type="button"
                className={`package-detail-hero__dot${index === safeIndex ? " package-detail-hero__dot--active" : ""}`}
                aria-label={`Tampilkan foto ${index + 1} dari ${views.length}`}
                aria-current={index === safeIndex ? "true" : undefined}
                onClick={() => setActiveViewIndex(index)}
              >
                <span aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </header>

      {hasPreviewMedia && (
        <div className="package-detail-gallery">
          <div className="package-detail-gallery__heading-row">
            <div>
              <h2
                id="package-gallery-heading"
                className="package-detail-gallery__title"
              >
                Galeri destinasi
              </h2>
              <p className="package-detail-gallery__eyebrow">
                Jelajahi media pengalaman
              </p>
            </div>
          </div>
          <div className="package-detail-gallery__entry-grid">
            <button
              type="button"
              className="package-detail-gallery__entry package-detail-gallery__entry--photos"
              onClick={(event) => openGallery("photos", event.currentTarget)}
            >
              <img
                src={activeView.url}
                alt=""
                aria-hidden="true"
                loading="lazy"
              />
              <span className="package-detail-gallery__entry-content">
                <strong>Foto</strong>
                <span>{views.length} tampilan · Lihat semua</span>
              </span>
            </button>
            <button
              type="button"
              className="package-detail-gallery__entry package-detail-gallery__entry--videos"
              onClick={(event) => openGallery("videos", event.currentTarget)}
            >
              <span
                className="package-detail-gallery__video-icon"
                aria-hidden="true"
              >
                ▶
              </span>
              <span className="package-detail-gallery__entry-content">
                <strong>Video</strong>
                <span>Belum tersedia</span>
              </span>
            </button>
          </div>
        </div>
      )}

      {galleryOpen && (
        <div
          ref={galleryPanel}
          className="package-detail-gallery-view"
          role="dialog"
          aria-modal="true"
          aria-labelledby="package-gallery-view-title"
        >
          <div className="package-detail-gallery-view__inner">
            <div className="package-detail-gallery-view__topbar">
              <button
                ref={galleryBack}
                type="button"
                className="package-detail-gallery-view__back"
                onClick={() => setGalleryOpen(false)}
              >
                ← Kembali ke paket
              </button>
              <span>JedaIn / Galeri</span>
            </div>
            <header className="package-detail-gallery-view__header">
              <span className="package-detail-gallery-view__kicker">
                {packageData.destinationName}
              </span>
              <h2 id="package-gallery-view-title">Galeri destinasi</h2>
              <p>{packageData.title}</p>
            </header>
            <div
              className="package-detail-gallery-view__tabs"
              role="group"
              aria-label="Jenis media"
            >
              <button
                type="button"
                aria-pressed={galleryTab === "photos"}
                onClick={() => setGalleryTab("photos")}
              >
                Foto <span>{views.length}</span>
              </button>
              <button
                type="button"
                aria-pressed={galleryTab === "videos"}
                onClick={() => setGalleryTab("videos")}
              >
                Video <span>0</span>
              </button>
            </div>
            {galleryTab === "photos" ? (
              <div
                className="package-detail-gallery-view__photos"
                aria-label="Foto destinasi"
              >
                <div className="package-detail-gallery-view__featured">
                  <img
                    src={activeView.url}
                    alt={`${activeView.label} — ${packageData.title}`}
                    style={{
                      transform: `scale(${activeView.scale})`,
                      transformOrigin: activeView.transformOrigin,
                    }}
                  />
                  <span>
                    {activeView.label} · {safeIndex + 1}/{views.length}
                  </span>
                </div>
                <div className="package-detail-gallery-view__grid">
                  {views.map((view, index) => (
                    <button
                      key={`${view.url}-${index}`}
                      type="button"
                      className={
                        index === safeIndex
                          ? "package-detail-gallery-view__photo package-detail-gallery-view__photo--active"
                          : "package-detail-gallery-view__photo"
                      }
                      aria-label={`Lihat ${view.label.toLowerCase()}`}
                      aria-pressed={index === safeIndex}
                      onClick={() => setActiveViewIndex(index)}
                    >
                      <img
                        src={view.url}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        style={{
                          transform: `scale(${view.scale})`,
                          transformOrigin: view.transformOrigin,
                        }}
                      />
                      <span>{view.label}</span>
                    </button>
                  ))}
                </div>
                <p className="package-detail-gallery__note">
                  {isPackageGallery
                    ? "Media paket dipilih Travel Organizer. Ketersediaan foto aktual bergantung pada media yang mereka unggah; ilustrasi prototipe bukan dokumentasi kondisi destinasi."
                    : "Tiga tampilan ini berasal dari satu ilustrasi prototipe dengan crop berbeda, bukan tiga foto aktual destinasi."}
                </p>
              </div>
            ) : (
              <div
                className="package-detail-gallery-view__empty"
                aria-label="Video destinasi"
              >
                <span
                  className="package-detail-gallery-view__empty-icon"
                  aria-hidden="true"
                >
                  ▶
                </span>
                <h3>Belum ada video untuk pengalaman ini</h3>
                <p>
                  Jelajahi foto yang tersedia untuk melihat gambaran suasananya.
                </p>
                <button type="button" onClick={() => setGalleryTab("photos")}>
                  Lihat foto
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
