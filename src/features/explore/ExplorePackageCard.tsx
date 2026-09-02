import { Link } from "react-router";
import { Badge } from "../../components/ui";
import { getPackageVisual } from "../../lib/assets/packageImages";
import { QUIZ_DURATION_OPTIONS } from "../quiz/config";
import type { PackageRecommendationSource } from "../recommendation/types";

export interface ExplorePackageCardProps {
  packageData: PackageRecommendationSource;
}

export function ExplorePackageCard({ packageData }: ExplorePackageCardProps) {
  const durationLabel =
    QUIZ_DURATION_OPTIONS.find((d) => d.value === packageData.durationType)
      ?.label ?? packageData.durationType;

  const visual = getPackageVisual(packageData.id, packageData.destinationName);
  const formattedPrice = `Rp${packageData.pricePerPerson.toLocaleString("id-ID")}`;

  return (
    <Link to={`/packages/${packageData.id}`} className="explore-package-card">
      <div
        className="explore-package-card__visual"
        style={{ backgroundImage: `url("${visual.svgDataUri}")` }}
        role="img"
        aria-label={`Ilustrasi suasana ${packageData.title}`}
      >
        <div className="explore-package-card__badges">
          <Badge tone="neutral">
            {packageData.verificationLevel === "PLUS"
              ? "Terverifikasi Plus"
              : "Terverifikasi Dasar"}
          </Badge>
          <span className="explore-package-card__rating-pill">
            {packageData.rating !== undefined && packageData.rating !== null
              ? `★ ${packageData.rating.toFixed(1)}`
              : "Belum ada rating"}
          </span>
        </div>
      </div>

      <div className="explore-package-card__body">
        <div className="explore-package-card__meta">
          <span>{packageData.destinationName}</span>
          <span>•</span>
          <span>{packageData.locationLabel}</span>
          <span>•</span>
          <span>{durationLabel}</span>
        </div>

        <h3 className="explore-package-card__title">{packageData.title}</h3>
        <p className="explore-package-card__summary">
          {packageData.shortSummary}
        </p>

        <div className="explore-package-card__footer">
          <span className="explore-package-card__price">
            <strong>{formattedPrice}</strong> / orang
          </span>
          <span className="explore-package-card__link">Lihat &rarr;</span>
        </div>
      </div>
    </Link>
  );
}
