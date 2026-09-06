import { Link } from "react-router";
import { Badge } from "../../components/ui";
import { getPackageVisual } from "../../lib/assets/packageImages";
import { QUIZ_DURATION_OPTIONS } from "../quiz/config";
import type { PackageRecommendationSource } from "../recommendation/types";

export interface PackageCardProps {
  packageData: PackageRecommendationSource;
}

export function PackageCard({ packageData }: PackageCardProps) {
  const durationLabel =
    QUIZ_DURATION_OPTIONS.find((d) => d.value === packageData.durationType)
      ?.label ?? packageData.durationType;

  const visual = getPackageVisual(packageData.id, packageData.destinationName);
  const formattedPrice = `Rp${packageData.pricePerPerson.toLocaleString("id-ID")}`;

  return (
    <Link to={`/packages/${packageData.id}`} className="home-package-card">
      <div className="home-package-card__visual">
        <img
          src={visual.svgDataUri}
          alt={`Ilustrasi suasana ${packageData.title}`}
          width={800}
          height={500}
          loading="lazy"
        />
        <div className="home-package-card__visual-scrim" aria-hidden="true" />
        <div className="home-package-card__badges">
          <Badge tone="neutral">
            {packageData.verificationLevel === "PLUS"
              ? "Terverifikasi Plus"
              : "Terverifikasi Dasar"}
          </Badge>
        </div>
      </div>
      <div className="home-package-card__body">
        <div className="home-package-card__meta">
          <span>{packageData.locationLabel}</span>
          <span className="home-package-card__dot">•</span>
          <span>{durationLabel}</span>
        </div>
        <h3 className="home-package-card__title">{packageData.title}</h3>
        <p className="home-package-card__summary">{packageData.shortSummary}</p>
        <div className="home-package-card__footer">
          <div className="home-package-card__price">
            <strong>{formattedPrice}</strong>
            <span className="home-package-card__unit"> / org</span>
          </div>
          <span className="home-package-card__link">Detail &rarr;</span>
        </div>
      </div>
    </Link>
  );
}
