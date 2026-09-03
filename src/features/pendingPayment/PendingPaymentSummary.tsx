import { getPackageVisual } from "../../lib/assets/packageImages";
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

  // Source-backed experience visual thumbnail
  const visual = pkg
    ? getPackageVisual(pkg.id, pkg.destinationName)
    : undefined;
  const visualSrc = visual?.svgDataUri ?? pkg?.visualAsset;

  return (
    <section
      className="pending-payment-surface"
      aria-label="Ringkasan pembayaran tertunda"
    >
      {/* 1. Status & Calm Urgency Row */}
      <div className="pending-payment-surface__status-bar">
        <div className="pending-payment-status">
          <span className="pending-payment-status__dot" aria-hidden="true" />
          <span className="pending-payment-status__text">
            Menunggu Pembayaran
          </span>
        </div>

        <div className="pending-payment-countdown">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="pending-payment-countdown__icon"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span
            className="pending-payment-countdown__timer"
            aria-label="Waktu tersisa pembayaran"
          >
            Sisa waktu: <strong>{displayTimer}</strong>
          </span>
        </div>
      </div>

      {/* 2. Travel Experience Identity */}
      <div className="pending-payment-surface__experience">
        {visualSrc && (
          <div className="pending-payment-surface__thumb-wrap">
            <img
              src={visualSrc}
              alt=""
              className="pending-payment-surface__thumb-img"
              loading="lazy"
            />
          </div>
        )}
        <div className="pending-payment-surface__experience-text">
          <h2 className="pending-payment-surface__pkg-title">
            {pkg?.title ?? booking.packageId}
          </h2>
          {pkg?.destinationName && (
            <p className="pending-payment-surface__pkg-meta">
              <span>{pkg.destinationName}</span>
              <span
                className="pending-payment-surface__meta-dot"
                aria-hidden="true"
              >
                •
              </span>
              <span>{pkg.locationLabel}</span>
            </p>
          )}
        </div>
      </div>

      {/* 3. Transaction Facts */}
      <div className="pending-payment-surface__facts">
        {sessionDateLabel && (
          <div className="pending-payment-fact-row">
            <span className="pending-payment-fact-row__label">
              Jadwal Keberangkatan
            </span>
            <strong className="pending-payment-fact-row__value">
              {sessionDateLabel}
            </strong>
          </div>
        )}

        <div className="pending-payment-fact-row">
          <span className="pending-payment-fact-row__label">
            Batas Pembayaran
          </span>
          <span className="pending-payment-fact-row__value">
            {formattedExpiryTime} WIB
          </span>
        </div>

        <div className="pending-payment-fact-row pending-payment-fact-row--total">
          <span className="pending-payment-fact-row__label pending-payment-fact-row__label--total">
            Total Pembayaran
          </span>
          <strong className="pending-payment-fact-row__amount">
            Rp{booking.totalAmount.toLocaleString("id-ID")}
          </strong>
        </div>
      </div>
    </section>
  );
}
