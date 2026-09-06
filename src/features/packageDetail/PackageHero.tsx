import { Badge } from "../../components/ui";
import { getPackageVisual } from "../../lib/assets/packageImages";
import type { PackageRecommendationSource } from "../recommendation/types";

export interface PackageHeroProps {
  packageData: PackageRecommendationSource;
}

export function PackageHero({ packageData }: PackageHeroProps) {
  const visual = getPackageVisual(packageData.id, packageData.destinationName);

  return (
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
  );
}
