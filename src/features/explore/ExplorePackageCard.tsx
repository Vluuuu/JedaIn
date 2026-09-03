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
        <div className="explore-package-card__visual-scrim" />
        <div className="explore-package-card__badges">
          <Badge tone="neutral">
            {packageData.verificationLevel === "PLUS"
              ? "Terverifikasi Plus"
              : "Terverifikasi Dasar"}
          </Badge>
          <span className="explore-package-card__rating-pill">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="explore-package-card__rating-star"
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
      </div>

      <div className="explore-package-card__body">
        <div className="explore-package-card__meta">
          <span>{packageData.destinationName}</span>
          <span className="explore-package-card__dot">•</span>
          <span>{packageData.locationLabel}</span>
          <span className="explore-package-card__dot">•</span>
          <span>{durationLabel}</span>
        </div>

        <h3 className="explore-package-card__title">{packageData.title}</h3>
        <p className="explore-package-card__summary">
          {packageData.shortSummary}
        </p>

        <div className="explore-package-card__footer">
          <div className="explore-package-card__price">
            <strong>{formattedPrice}</strong>
            <span className="explore-package-card__unit"> / orang</span>
          </div>
          <span className="explore-package-card__link">
            Lihat Detail &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
