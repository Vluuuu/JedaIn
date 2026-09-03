import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button, Skeleton } from "../../components/ui";
import { formatSessionDateTimeRange } from "../packageDetail/formatSessionDate";
import { defaultPaymentAdapter } from "./mockAdapter";
import type { PaymentAdapter, PaymentState, PaymentViewModel } from "./types";
import "./payment.css";

export interface PaymentScreenProps {
  adapter?: PaymentAdapter;
}

function calculateSecondsRemaining(
  expiresAtIso: string,
  serverOffsetMs: number = 0,
): number {
  const expiry = new Date(expiresAtIso).getTime();
  const visualNow = Date.now() + serverOffsetMs;
  return Math.max(0, Math.ceil((expiry - visualNow) / 1000));
}

export function PaymentScreen({
  adapter = defaultPaymentAdapter,
}: PaymentScreenProps) {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<PaymentState>("LOADING");
  const [viewModel, setViewModel] = useState<PaymentViewModel | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [serverOffsetMs, setServerOffsetMs] = useState<number>(0);
  const [isPaying, setIsPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!bookingId) return;

    adapter
      .getPayment(bookingId)
      .then((res) => {
        if (!isMounted) return;
        setIsLoading(false);
        if (res.booking && res.booking.status === "PAID") {
          navigate(`/payment/${bookingId}/result`, { replace: true });
          return;
        }
        setState(res.state);
        setViewModel(res);
        if (res.expiresAt && res.serverNow) {
          const clientNow = Date.now();
          const serverNowMs = Date.parse(res.serverNow);
          const offset = serverNowMs - clientNow;
          setServerOffsetMs(offset);
          setSecondsRemaining(calculateSecondsRemaining(res.expiresAt, offset));
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setIsLoading(false);
        setState("ERROR");
      });

    return () => {
      isMounted = false;
    };
  }, [bookingId, adapter, navigate]);

  // Countdown timer effect
  useEffect(() => {
    if (!viewModel?.expiresAt || state !== "ACTIVE") return;

    const interval = setInterval(() => {
      const remaining = calculateSecondsRemaining(
        viewModel.expiresAt!,
        serverOffsetMs,
      );
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        // Revalidate upon timer completion
        if (bookingId) {
          adapter
            .getPayment(bookingId)
            .then((res) => {
              if (res.state === "EXPIRED") {
                setState("EXPIRED");
              } else if (res.state === "ACTIVE") {
                setState(res.state);
                setViewModel(res);
              }
            })
            .catch(() => {
              // Network/revalidation error: do NOT claim expired or slot released
              setErrorMessage(
                "Status pembayaran belum bisa diverifikasi. Coba lagi.",
              );
            });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [viewModel?.expiresAt, state, serverOffsetMs, bookingId, adapter]);

  const handlePayNow = async () => {
    if (!bookingId || isPaying) return;

    setIsPaying(true);
    setState("VERIFYING");
    setErrorMessage(undefined);

    try {
      const res = await adapter.executePayment(bookingId);
      setIsPaying(false);

      if (res.success) {
        navigate(`/payment/${bookingId}/result`);
        return;
      }

      if (res.status === "EXPIRED") {
        setState("EXPIRED");
        return;
      }

      // Navigate to failure result
      navigate(`/payment/${bookingId}/result`);
    } catch (err: unknown) {
      setIsPaying(false);
      setState("ACTIVE");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Pembayaran belum bisa diproses. Coba lagi.",
      );
    }
  };

  const handleConfirmCancel = async () => {
    if (!bookingId || isPaying) return;

    setIsPaying(true);
    try {
      await adapter.cancelPayment(bookingId);
      setIsPaying(false);
      navigate(`/payment/${bookingId}/result`);
    } catch {
      setIsPaying(false);
      setShowCancelModal(false);
      setErrorMessage("Pesanan belum bisa dibatalkan.");
    }
  };

  if (isLoading) {
    return (
      <div className="payment-container" aria-busy="true">
        <Skeleton width="10rem" height="1.5rem" />
        <Skeleton width="60%" height="2rem" />
        <div className="payment-card">
          <Skeleton height="12rem" />
        </div>
      </div>
    );
  }

  if (state === "NOT_FOUND" || state === "ERROR" || !viewModel?.booking) {
    return (
      <div className="payment-container">
        <div className="payment-state-box">
          <h2>Pembayaran tidak ditemukan.</h2>
          <p>
            Tagihan ini mungkin sudah diselesaikan, dibatalkan, atau tautan
            tidak valid.
          </p>
          <Button
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

  if (state === "EXPIRED") {
    const pkgId = viewModel.package?.id;
    return (
      <div className="payment-container">
        <div className="payment-state-box" role="status">
          <h2>Waktu pembayaran telah habis.</h2>
          <p>Slot yang kamu pegang telah dilepas untuk traveler lain.</p>
          <Button
            variant="primary"
            size="md"
            onClick={() =>
              pkgId
                ? navigate(`/packages/${pkgId}/sessions`)
                : navigate("/explore")
            }
          >
            Pilih Jadwal Lagi
          </Button>
        </div>
      </div>
    );
  }

  const { booking, package: pkg, session } = viewModel;
  const sessionDateLabel =
    session?.startAt && session?.endAt
      ? formatSessionDateTimeRange(session.startAt, session.endAt).dateLabel
      : undefined;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const paddedSec = seconds < 10 ? `0${seconds}` : `${seconds}`;
  const displayTimer = `${minutes}:${paddedSec}`;

  return (
    <div className="payment-container">
      <header className="payment-header">
        <div className="payment-status-badge">
          <span className="payment-status-dot" aria-hidden="true" />
          <span>Menunggu Pembayaran</span>
        </div>
        <h1 className="payment-title">Konfirmasi Pembayaran</h1>
        <p className="payment-subtitle">
          Selesaikan pembayaran sebelum batas waktu berakhir.
        </p>
      </header>

      {/* Countdown Card */}
      <div className="payment-timer-card">
        <span className="payment-timer-label">Sisa Waktu Pembayaran</span>
        <strong className="payment-timer-value" aria-live="off">
          {displayTimer}
        </strong>
      </div>

      {errorMessage && (
        <div className="payment-alert payment-alert--error" role="alert">
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Booking Summary Section */}
      <section className="payment-summary-card" aria-label="Informasi pesanan">
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
            <strong className="payment-fact-value">{booking.bookingId}</strong>
          </div>

          {sessionDateLabel && (
            <div className="payment-fact-row">
              <span className="payment-fact-label">Jadwal Keberangkatan</span>
              <strong className="payment-fact-value">{sessionDateLabel}</strong>
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
              <span className="payment-fact-total-label">Total Pembayaran</span>
              <span className="payment-fact-total-hint">
                Termasuk biaya reservasi & pajak
              </span>
            </div>
            <strong className="payment-fact-total-value">
              Rp{booking.totalAmount.toLocaleString("id-ID")}
            </strong>
          </div>
        </div>
      </section>

      {/* Prototype Notice */}
      <div className="payment-method-box">
        <span className="payment-method-title">Metode Pembayaran</span>
        <p className="payment-method-desc">
          Simulasi Pembayaran Instan (Prototype Sandbox)
        </p>
      </div>

      {/* Action Buttons */}
      <div className="payment-actions">
        <Button
          type="button"
          variant="primary"
          size="lg"
          loading={isPaying || state === "VERIFYING"}
          loadingLabel="Memproses Pembayaran..."
          disabled={isPaying}
          onClick={handlePayNow}
          className="payment-pay-btn"
        >
          Bayar Sekarang
        </Button>

        <button
          type="button"
          className="payment-cancel-btn"
          disabled={isPaying}
          onClick={() => setShowCancelModal(true)}
        >
          Batalkan Pesanan
        </button>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div
          className="payment-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-title"
        >
          <div className="payment-modal">
            <h2 id="cancel-title" className="payment-modal__title">
              Batalkan Pesanan?
            </h2>
            <p className="payment-modal__desc">
              Slot yang kamu pegang akan segera dilepas untuk traveler lain.
            </p>
            <div className="payment-modal__actions">
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={isPaying}
                onClick={() => setShowCancelModal(false)}
              >
                Kembali
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                loading={isPaying}
                disabled={isPaying}
                onClick={handleConfirmCancel}
              >
                Ya, Batalkan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
