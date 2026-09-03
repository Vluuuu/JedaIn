import { getPackageVisual } from "../../lib/assets/packageImages";
import { formatSessionDateTimeRange } from "../packageDetail/formatSessionDate";
import type { PackageSessionPreview } from "../packageDetail/types";
import type { PackageRecommendationSource } from "../recommendation/types";

export interface CheckoutSummaryCardProps {
  packageData: PackageRecommendationSource;
  sessionData: PackageSessionPreview;
}

export function CheckoutSummaryCard({
  packageData,
  sessionData,
}: CheckoutSummaryCardProps) {
  const { dateLabel } = formatSessionDateTimeRange(
    sessionData.startAt,
    sessionData.endAt,
  );

  const visual = getPackageVisual(packageData.id, packageData.destinationName);

  const unitPrice = sessionData.pricePerPerson;
  const formattedUnitPrice = unitPrice
    ? `Rp${unitPrice.toLocaleString("id-ID")} / orang`
    : "Rp-";

  return (
    <section
      className="checkout-summary-card"
      aria-label="Ringkasan jadwal dan experience"
    >
      <div className="checkout-summary-card__body">
        <div
          className="checkout-summary-card__thumb"
          style={{ backgroundImage: `url("${visual.svgDataUri}")` }}
          role="img"
          aria-label={`Ilustrasi ${packageData.title}`}
        />

        <div className="checkout-summary-card__header">
          <span className="checkout-summary-card__meta">
            {packageData.destinationName} • {packageData.locationLabel}
          </span>
          <h2 className="checkout-summary-card__title">{packageData.title}</h2>
        </div>
      </div>

      <div className="checkout-summary-card__facts">
        <div className="checkout-summary-card__fact-row">
          <span
            className="checkout-summary-card__fact-icon-slot"
            aria-hidden="true"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          <div className="checkout-summary-card__fact-content">
            <span className="checkout-summary-card__fact-label">
              Waktu Keberangkatan
            </span>
            <strong className="checkout-summary-card__fact-value">
              {dateLabel}
            </strong>
          </div>
        </div>

        <div className="checkout-summary-card__fact-row">
          <span
            className="checkout-summary-card__fact-icon-slot"
            aria-hidden="true"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </span>
          <div className="checkout-summary-card__fact-content">
            <span className="checkout-summary-card__fact-label">
              Harga Sesi
            </span>
            <strong className="checkout-summary-card__fact-value checkout-summary-card__fact-value--price">
              {formattedUnitPrice}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}
