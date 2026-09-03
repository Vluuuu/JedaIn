import { getPackageVisual } from "../../lib/assets/packageImages";
import type { PackageRecommendationSource } from "../recommendation/types";

export interface PackageHeroProps {
  packageData: PackageRecommendationSource;
}

export function PackageHero({ packageData }: PackageHeroProps) {
  const visual = getPackageVisual(packageData.id, packageData.destinationName);

  return (
    <header className="package-detail-hero">
      <div
        className="package-detail-hero__visual"
        style={{ backgroundImage: `url("${visual.svgDataUri}")` }}
        role="img"
        aria-label={`Ilustrasi suasana ${packageData.title}`}
      />
      <div className="package-detail-hero__visual-scrim" aria-hidden="true" />
      <div className="package-detail-hero__badges">
        <span className="package-detail-hero__trust-badge">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="package-detail-hero__trust-icon"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
          <span>
            {packageData.verificationLevel === "PLUS"
              ? "Terverifikasi Plus"
              : "Terverifikasi Dasar"}
          </span>
        </span>
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
  );
}
