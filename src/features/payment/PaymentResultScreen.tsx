import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button, Skeleton } from "../../components/ui";
import { formatSessionDateTimeRange } from "../packageDetail/formatSessionDate";
import { defaultPaymentAdapter } from "./mockAdapter";
import type { PaymentAdapter, PaymentResultViewModel } from "./types";
import "./payment.css";

export interface PaymentResultScreenProps {
  adapter?: PaymentAdapter;
}

export function PaymentResultScreen({
  adapter = defaultPaymentAdapter,
}: PaymentResultScreenProps) {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<PaymentResultViewModel | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!bookingId) return;

    adapter
      .getPaymentResult(bookingId)
      .then((res) => {
        if (!isMounted) return;
        setIsLoading(false);
        setResult(res);
      })
      .catch(() => {
        if (!isMounted) return;
        setIsLoading(false);
        setResult({ status: "ERROR" });
      });

    return () => {
      isMounted = false;
    };
  }, [bookingId, adapter]);

  if (isLoading) {
    return (
      <div className="payment-container" aria-busy="true">
        <Skeleton width="12rem" height="2rem" />
        <div className="payment-card">
          <Skeleton height="10rem" />
        </div>
      </div>
    );
  }

  if (!result || result.status === "NOT_FOUND" || !result.booking) {
    return (
      <div className="payment-container">
        <div className="payment-state-box">
          <h2>Data transaksi tidak ditemukan.</h2>
          <p>Tautan ini mungkin tidak valid atau sudah tidak tersedia.</p>
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate("/home")}
          >
            Kembali ke Home
          </Button>
        </div>
      </div>
    );
  }

  const { booking, package: pkg, session } = result;
  const sessionDateLabel =
    session?.startAt && session?.endAt
      ? formatSessionDateTimeRange(session.startAt, session.endAt).dateLabel
      : undefined;

  if (result.status === "SUCCESS") {
    return (
      <div className="payment-container payment-result-container">
        <div className="payment-result-header">
          <div className="payment-success-visual" aria-hidden="true">
            <svg
              className="payment-success-check"
              width="44"
              height="44"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 25L19.5 34.5L38 14"
                stroke="var(--color-forest-700)"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="payment-success-badge">Pembayaran Berhasil</span>
          <h1 className="payment-result-title">Siap untuk jedamu!</h1>
          <p className="payment-result-subtitle">
            Pembayaranmu telah berhasil diverifikasi. Detail trip sudah
            tersedia.
          </p>
        </div>

        <section
          className="payment-summary-card"
          aria-label="Informasi pesanan terkonfirmasi"
        >
          <div className="payment-summary-card__header">
            <h2 className="payment-summary-card__title">
              {pkg?.title ?? booking.packageId}
            </h2>
            {pkg?.destinationName && (
              <p className="payment-summary-card__meta">
                {pkg.destinationName} • {pkg.locationLabel}
              </p>
            )}
          </div>

          <div className="payment-summary-card__facts">
            <div className="payment-summary-card__section-label">
              Informasi Pesanan
            </div>

            <div className="payment-fact-row">
              <span className="payment-fact-label">Nomor Pesanan</span>
              <strong className="payment-fact-value">
                {booking.bookingId}
              </strong>
            </div>

            {sessionDateLabel && (
              <div className="payment-fact-row">
                <span className="payment-fact-label">Waktu Keberangkatan</span>
                <strong className="payment-fact-value">
                  {sessionDateLabel}
                </strong>
              </div>
            )}

            <div className="payment-fact-row">
              <span className="payment-fact-label">Jumlah Peserta</span>
              <span className="payment-fact-value">
                {booking.participantCount} Orang
              </span>
            </div>

            <div className="payment-fact-row payment-fact-row--total">
              <div className="payment-fact-total-meta">
                <span className="payment-fact-total-label">Total Terbayar</span>
                <span className="payment-fact-total-hint">
                  Lunas via verifikasi instan
                </span>
              </div>
              <strong className="payment-fact-total-value">
                Rp{booking.totalAmount.toLocaleString("id-ID")}
              </strong>
            </div>
          </div>
        </section>

        <div className="payment-actions">
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => navigate(`/trips/${booking.bookingId}`)}
          >
            Lihat Trip
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => navigate("/home")}
          >
            Kembali ke Home
          </Button>
        </div>
      </div>
    );
  }

  if (result.status === "PENDING") {
    return (
      <div className="payment-container payment-result-container">
        <div className="payment-result-header">
          <div className="payment-status-badge">
            <span className="payment-status-dot" aria-hidden="true" />
            <span>Menunggu Pembayaran</span>
          </div>
          <h1 className="payment-result-title">Pembayaran Belum Selesai</h1>
          <p className="payment-result-subtitle">
            Transaksi ini masih menunggu pembayaran atau proses verifikasi.
          </p>
        </div>

        <div className="payment-actions">
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => navigate(`/payment/${booking.bookingId}`)}
          >
            Lanjutkan Pembayaran
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => navigate("/home")}
          >
            Kembali ke Home
          </Button>
        </div>
      </div>
    );
  }

  if (result.status === "ERROR") {
    return (
      <div className="payment-container payment-result-container">
        <div className="payment-result-header">
          <div className="payment-status-badge">
            <span
              className="payment-status-dot payment-status-dot--neutral"
              aria-hidden="true"
            />
            <span>Status Tidak Dikenal</span>
          </div>
          <h1 className="payment-result-title">Status Belum Diketahui</h1>
          <p className="payment-result-subtitle">
            Terjadi kendala saat memeriksa status transaksi. Silakan coba
            kembali.
          </p>
        </div>

        <div className="payment-actions">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => navigate("/home")}
          >
            Kembali ke Home
          </Button>
        </div>
      </div>
    );
  }

  if (result.status === "FAILED") {
    return (
      <div className="payment-container payment-result-container">
        <div className="payment-result-header">
          <div className="payment-fail-visual" aria-hidden="true">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 12L28 28M28 12L12 28"
                stroke="var(--color-danger-solid)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="payment-fail-badge">Pembayaran Belum Berhasil</span>
          <h1 className="payment-result-title">Pembayaran Gagal</h1>
          <p className="payment-result-subtitle">
            Slot pemesananmu masih tersimpan. Silakan coba kembali sebelum waktu
            habis.
          </p>
        </div>

        <div className="payment-actions">
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => navigate(`/payment/${booking.bookingId}`)}
          >
            Coba Lagi
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => navigate("/home")}
          >
            Kembali ke Home
          </Button>
        </div>
      </div>
    );
  }

  if (result.status === "EXPIRED") {
    const pkgId = pkg?.id;
    return (
      <div className="payment-container payment-result-container">
        <div className="payment-result-header">
          <div className="payment-status-badge">
            <span
              className="payment-status-dot payment-status-dot--neutral"
              aria-hidden="true"
            />
            <span>Kedaluwarsa</span>
          </div>
          <h1 className="payment-result-title">Waktu Pembayaran Habis</h1>
          <p className="payment-result-subtitle">
            Batas waktu pembayaran telah berakhir dan slot yang dipilih telah
            dilepas.
          </p>
        </div>

        <div className="payment-actions">
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() =>
              pkgId
                ? navigate(`/packages/${pkgId}/sessions`)
                : navigate("/explore")
            }
          >
            Pilih Jadwal Lagi
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => navigate("/explore")}
          >
            Kembali ke Explore
          </Button>
        </div>
      </div>
    );
  }

  // CANCELLED
  return (
    <div className="payment-container payment-result-container">
      <div className="payment-result-header">
        <div className="payment-status-badge">
          <span
            className="payment-status-dot payment-status-dot--neutral"
            aria-hidden="true"
          />
          <span>Dibatalkan</span>
        </div>
        <h1 className="payment-result-title">Pesanan Dibatalkan</h1>
        <p className="payment-result-subtitle">
          Pesanan ini telah dibatalkan dan slot telah dilepas untuk traveler
          lain.
        </p>
      </div>

      <div className="payment-actions">
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={() => navigate("/explore")}
        >
          Cari Trip Lain
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => navigate("/home")}
        >
          Kembali ke Home
        </Button>
      </div>
    </div>
  );
}
