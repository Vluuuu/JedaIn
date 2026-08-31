import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Badge, Button } from "../../components/ui";
import type { PendingPaymentSummary } from "./types";

export interface PendingPaymentBannerProps {
  summary: PendingPaymentSummary;
}

function formatRemainingTime(expiresAtIso: string): string {
  const expiry = new Date(expiresAtIso).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, expiry - now);

  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    return `${hours}j ${remMinutes}m`;
  }

  const paddedSec = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${minutes}:${paddedSec}`;
}

export function PendingPaymentBanner({ summary }: PendingPaymentBannerProps) {
  const navigate = useNavigate();
  const [displayCountdown, setDisplayCountdown] = useState(() =>
    formatRemainingTime(summary.expiresAt),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayCountdown(formatRemainingTime(summary.expiresAt));
    }, 1000);

    return () => clearInterval(timer);
  }, [summary.expiresAt]);

  const formattedAmount =
    summary.amount !== undefined
      ? `Rp${summary.amount.toLocaleString("id-ID")}`
      : undefined;

  return (
    <section
      className="home-payment-banner"
      aria-labelledby="payment-banner-title"
    >
      <div className="home-payment-banner__content">
        <div className="home-payment-banner__header">
          <Badge tone="warning">Menunggu Pembayaran</Badge>
          <span
            className="home-payment-banner__timer"
            aria-label="Waktu tersisa pembayaran"
          >
            Sisa waktu: <strong>{displayCountdown}</strong>
          </span>
        </div>
        <h2 id="payment-banner-title" className="home-payment-banner__title">
          {summary.packageName}
          {summary.sessionLabel && ` • ${summary.sessionLabel}`}
        </h2>
        {formattedAmount && (
          <p className="home-payment-banner__amount">
            Total: {formattedAmount}
          </p>
        )}
      </div>
      <Button
        type="button"
        variant="primary"
        size="md"
        className="home-payment-banner__cta"
        onClick={() => navigate(`/payment/${summary.bookingId}`)}
      >
        Lanjutkan Pembayaran
      </Button>
    </section>
  );
}
