import { Badge } from "../../components/ui";
import { formatSessionDateTimeRange } from "../packageDetail/formatSessionDate";
import type { PendingPaymentSummaryModel } from "./types";

export interface PendingPaymentSummaryProps {
  summary: PendingPaymentSummaryModel;
  secondsRemaining: number;
}

export function PendingPaymentSummary({
  summary,
  secondsRemaining,
}: PendingPaymentSummaryProps) {
  const { booking, package: pkg, session } = summary;

  const sessionDateLabel =
    session?.startAt && session?.endAt
      ? formatSessionDateTimeRange(session.startAt, session.endAt).dateLabel
      : undefined;

  const expiryDate = new Date(summary.expiresAt);
  const formattedExpiryTime = expiryDate.toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  });

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const paddedSec = seconds < 10 ? `0${seconds}` : `${seconds}`;
  const displayTimer = `${minutes}:${paddedSec}`;

  return (
    <section
      className="pending-payment-card"
      aria-label="Ringkasan pembayaran tertunda"
    >
      <div className="pending-payment-card__header">
        <Badge tone="warning">Menunggu Pembayaran</Badge>
        <span
          className="pending-payment-card__timer"
          aria-label="Waktu tersisa pembayaran"
        >
          Sisa waktu: <strong>{displayTimer}</strong>
        </span>
      </div>

      <div className="pending-payment-card__body">
        <h2 className="pending-payment-card__pkg-title">
          {pkg?.title ?? booking.packageId}
        </h2>
        {pkg?.destinationName && (
          <p className="pending-payment-card__pkg-meta">
            {pkg.destinationName} • {pkg.locationLabel}
          </p>
        )}

        <div className="pending-payment-card__rows">
          {sessionDateLabel && (
            <div className="pending-payment-card__row">
              <span>Jadwal Keberangkatan</span>
              <strong>{sessionDateLabel}</strong>
            </div>
          )}

          <div className="pending-payment-card__row">
            <span>Batas Pembayaran</span>
            <span>{formattedExpiryTime} WIB</span>
          </div>

          <div className="pending-payment-card__row pending-payment-card__row--total">
            <span>Total Pembayaran</span>
            <strong className="pending-payment-card__amount">
              Rp{booking.totalAmount.toLocaleString("id-ID")}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}
