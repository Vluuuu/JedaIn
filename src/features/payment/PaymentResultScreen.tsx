import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Badge, Button, Skeleton } from "../../components/ui";
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

  const { booking, package: pkg } = result;

  if (result.status === "SUCCESS") {
    return (
      <div className="payment-container payment-result-container">
        <div className="payment-result-header">
          <div className="payment-result-icon payment-result-icon--success">
            ✓
          </div>
          <Badge tone="success">Pembayaran Berhasil</Badge>
          <h1 className="payment-result-title">Siap untuk jedamu!</h1>
          <p className="payment-result-subtitle">
            Pembayaranmu telah berhasil diverifikasi. Detail trip sudah
            tersedia.
          </p>
        </div>

        <div className="payment-card">
          <h2 className="payment-card__title">
            {pkg?.title ?? booking.packageId}
          </h2>
          {pkg?.destinationName && (
            <p className="payment-card__meta">
              {pkg.destinationName} • {pkg.locationLabel}
            </p>
          )}

          <div className="payment-card__rows">
            <div className="payment-card__row">
              <span>Nomor Pesanan</span>
              <strong>{booking.bookingId}</strong>
            </div>
            <div className="payment-card__row">
              <span>Total Terbayar</span>
              <strong className="payment-card__total">
                Rp{booking.totalAmount.toLocaleString("id-ID")}
              </strong>
            </div>
          </div>
        </div>

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

  if (result.status === "FAILED") {
    return (
      <div className="payment-container payment-result-container">
        <div className="payment-result-header">
          <div className="payment-result-icon payment-result-icon--danger">
            ✕
          </div>
          <Badge tone="danger">Pembayaran Belum Berhasil</Badge>
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
          <Badge tone="neutral">Kedaluwarsa</Badge>
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
        <Badge tone="neutral">Dibatalkan</Badge>
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
