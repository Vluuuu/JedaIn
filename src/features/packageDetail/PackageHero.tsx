import { Badge } from "../../components/ui";
import { getPackageVisual } from "../../lib/assets/packageImages";
import type { PackageRecommendationSource } from "../recommendation/types";

export interface PackageHeroProps {
  packageData: PackageRecommendationSource;
}

export function PackageHero({ packageData }: PackageHeroProps) {
  const visual = getPackageVisual(packageData.id);

  return (
    <header className="package-detail-hero">
      <div
        className="package-detail-hero__visual"
        style={{ backgroundImage: `url("${visual.svgDataUri}")` }}
        role="img"
        aria-label={`Ilustrasi suasana ${packageData.title}`}
      />
      <div className="package-detail-hero__badges">
        <Badge tone="neutral">
          {packageData.verificationLevel === "PLUS"
            ? "Terverifikasi Plus"
            : "Terverifikasi Dasar"}
        </Badge>
        <span className="package-detail-hero__rating-pill">
          {packageData.rating !== undefined && packageData.rating !== null
            ? `★ ${packageData.rating.toFixed(1)}`
            : "Belum ada rating"}
        </span>
      </div>
    </header>
  );
}
