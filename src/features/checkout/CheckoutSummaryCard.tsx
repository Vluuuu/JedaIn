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

  const unitPrice = sessionData.pricePerPerson;
  const formattedUnitPrice = unitPrice
    ? `Rp${unitPrice.toLocaleString("id-ID")} / orang`
    : "Rp-";

  return (
    <section
      className="checkout-summary-card"
      aria-label="Ringkasan jadwal dan experience"
    >
      <div className="checkout-summary-card__header">
        <span className="checkout-summary-card__meta">
          {packageData.destinationName} • {packageData.locationLabel}
        </span>
        <h2 className="checkout-summary-card__title">{packageData.title}</h2>
      </div>

      <div className="checkout-summary-card__details">
        <div className="checkout-summary-card__row">
          <span className="checkout-summary-card__label">
            Waktu Keberangkatan
          </span>
          <strong className="checkout-summary-card__value">{dateLabel}</strong>
        </div>
        <div className="checkout-summary-card__row">
          <span className="checkout-summary-card__label">Harga Sesi</span>
          <span className="checkout-summary-card__value">
            {formattedUnitPrice}
          </span>
        </div>
      </div>
    </section>
  );
}
