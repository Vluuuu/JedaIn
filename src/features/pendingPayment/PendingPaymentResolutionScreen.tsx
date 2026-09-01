import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button, Skeleton } from "../../components/ui";
import { defaultPendingPaymentResolutionAdapter } from "./mockAdapter";
import { PendingPaymentSummary } from "./PendingPaymentSummary";
import type {
  PendingPaymentResolutionAdapter,
  PendingPaymentResolutionStep,
  PendingPaymentSummaryModel,
} from "./types";
import "./pendingPayment.css";

export interface PendingPaymentResolutionScreenProps {
  adapter?: PendingPaymentResolutionAdapter;
}

function calculateSecondsRemaining(expiresAtIso: string): number {
  const expiry = new Date(expiresAtIso).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((expiry - now) / 1000));
}

export function PendingPaymentResolutionScreen({
  adapter = defaultPendingPaymentResolutionAdapter,
}: PendingPaymentResolutionScreenProps) {
  const { sessionId: intendedSessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<PendingPaymentResolutionStep>("LOADING");
  const [summary, setSummary] = useState<
    PendingPaymentSummaryModel | undefined
  >();
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async (sid: string) => {
    setIsLoading(true);
    setErrorMessage(undefined);
    try {
      const res = await adapter.getPendingPaymentResolution(sid);
      setIsLoading(false);
      setStep(res.step);
      setSummary(res.summary);
      if (res.summary) {
        setSecondsRemaining(calculateSecondsRemaining(res.summary.expiresAt));
      }
      if (res.errorMessage) {
        setErrorMessage(res.errorMessage);
      }
    } catch (err: unknown) {
      setIsLoading(false);
      setStep("ERROR");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Pembayaran tertunda belum bisa dimuat. Coba lagi.",
      );
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (!intendedSessionId) return;

    adapter
      .getPendingPaymentResolution(intendedSessionId)
      .then((res) => {
        if (!isMounted) return;
        setIsLoading(false);
        setStep(res.step);
        setSummary(res.summary);
        if (res.summary) {
          setSecondsRemaining(calculateSecondsRemaining(res.summary.expiresAt));
        }
        if (res.errorMessage) {
          setErrorMessage(res.errorMessage);
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setIsLoading(false);
        setStep("ERROR");
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Pembayaran tertunda belum bisa dimuat. Coba lagi.",
        );
      });

    return () => {
      isMounted = false;
    };
  }, [intendedSessionId, adapter]);

  // Countdown timer effect
  useEffect(() => {
    if (!summary || step !== "ACTIVE") return;

    const interval = setInterval(() => {
      const remaining = calculateSecondsRemaining(summary.expiresAt);
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        // Revalidate through adapter rather than setting state directly from React
        if (summary.booking.bookingId) {
          adapter
            .revalidatePendingPayment(summary.booking.bookingId)
            .then((res) => {
              if (!res.stillActive) {
                setStep("EXPIRED");
              }
            })
            .catch(() => {
              setStep("EXPIRED");
            });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [summary, step, adapter]);

  const handleContinuePayment = async () => {
    if (!summary || isSubmitting) return;

    setIsSubmitting(true);
    setStep("CONTINUING");
    setErrorMessage(undefined);

    try {
      const res = await adapter.revalidatePendingPayment(
        summary.booking.bookingId,
      );

      setIsSubmitting(false);

      if (res.stillActive) {
        // Open EXISTING payment placeholder
        navigate(`/payment/${summary.booking.bookingId}`);
        return;
      }

      if (res.reason === "EXPIRED") {
        setStep("EXPIRED");
        return;
      }

      setStep("NO_ACTIVE_PENDING");
    } catch (err: unknown) {
      setIsSubmitting(false);
      setStep("ACTIVE");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Status pembayaran belum bisa diverifikasi. Coba lagi.",
      );
    }
  };

  const handleOpenCancelConfirm = () => {
    setErrorMessage(undefined);
    setStep("CANCEL_CONFIRM");
  };

  const handleDismissCancel = () => {
    setStep("ACTIVE");
  };

  const handleConfirmCancel = async () => {
    if (!summary || isSubmitting) return;

    setIsSubmitting(true);
    setStep("CANCELLING");
    setErrorMessage(undefined);

    try {
      const res = await adapter.cancelPendingBooking(summary.booking.bookingId);
      setIsSubmitting(false);

      if (res.success) {
        // Return to intended NEW Checkout route (DO NOT auto-create transaction)
        navigate(`/checkout/${intendedSessionId}`, { replace: true });
        return;
      }

      if (res.status === "EXPIRED") {
        setStep("EXPIRED");
        return;
      }

      setStep("ACTIVE");
      setErrorMessage(
        res.message ?? "Pesanan belum bisa dibatalkan. Coba lagi.",
      );
    } catch (err: unknown) {
      setIsSubmitting(false);
      setStep("ACTIVE");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Pesanan belum bisa dibatalkan. Coba lagi.",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="pending-payment-container" aria-busy="true">
        <Skeleton width="10rem" height="1.5rem" />
        <Skeleton width="60%" height="2rem" />
        <div className="pending-payment-card">
          <Skeleton height="10rem" />
        </div>
      </div>
    );
  }

  if (step === "ERROR") {
    return (
      <div className="pending-payment-container">
        <div className="pending-payment-state-box" role="alert">
          <h2>Pembayaran tertunda belum bisa dimuat.</h2>
          <p>{errorMessage ?? "Silakan coba lagi beberapa saat."}</p>
          <Button
            variant="primary"
            size="md"
            onClick={() => intendedSessionId && loadData(intendedSessionId)}
          >
            Coba lagi
          </Button>
        </div>
      </div>
    );
  }

  if (step === "EXPIRED") {
    return (
      <div className="pending-payment-container">
        <div className="pending-payment-state-box" role="status">
          <h2>Pembayaran sudah kedaluwarsa.</h2>
          <p>
            Waktu pembayaran telah habis dan slot yang dipesan telah dilepas.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(`/checkout/${intendedSessionId}`)}
          >
            Kembali ke Checkout
          </Button>
        </div>
      </div>
    );
  }

  if (step === "NO_ACTIVE_PENDING" || !summary) {
    return (
      <div className="pending-payment-container">
        <div className="pending-payment-state-box">
          <h2>Tidak ada pembayaran tertunda yang aktif.</h2>
          <p>Kamu dapat melanjutkan proses checkout untuk jadwal yang baru.</p>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(`/checkout/${intendedSessionId}`)}
          >
            Kembali ke Checkout
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pending-payment-container">
      {/* 1. Header context & back link */}
      <div className="pending-payment-topbar">
        <Link
          to={`/checkout/${intendedSessionId}`}
          className="pending-payment-back-btn"
          aria-label="Kembali ke Checkout"
        >
          &larr; Kembali ke Checkout
        </Link>
      </div>

      <header className="pending-payment-header">
        <h1 className="pending-payment-title">
          Kamu masih punya pembayaran yang belum selesai.
        </h1>
        <p className="pending-payment-subtitle">
          Selesaikan atau batalkan pembayaran ini sebelum membuat pesanan baru.
        </p>
      </header>

      {/* Error Banner */}
      {errorMessage && (
        <div
          className="pending-payment-alert pending-payment-alert--error"
          role="alert"
        >
          <p>{errorMessage}</p>
        </div>
      )}

      {/* 2. Existing Payment Summary Card */}
      <PendingPaymentSummary
        summary={summary}
        secondsRemaining={secondsRemaining}
      />

      {/* 3. Action Buttons */}
      <div className="pending-payment-actions">
        <Button
          type="button"
          variant="primary"
          size="lg"
          loading={isSubmitting && step === "CONTINUING"}
          loadingLabel="Memeriksa status..."
          disabled={isSubmitting}
          onClick={handleContinuePayment}
        >
          Lanjutkan Pembayaran
        </Button>

        <button
          type="button"
          className="pending-payment-cancel-trigger"
          disabled={isSubmitting}
          onClick={handleOpenCancelConfirm}
        >
          Batalkan Pesanan Lama
        </button>
      </div>

      {/* 4. Cancellation Confirmation Modal */}
      {(step === "CANCEL_CONFIRM" || step === "CANCELLING") && (
        <div
          className="pending-payment-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-modal-title"
        >
          <div className="pending-payment-modal">
            <h2
              id="cancel-modal-title"
              className="pending-payment-modal__title"
            >
              Batalkan Pesanan Lama?
            </h2>
            <p className="pending-payment-modal__desc">
              Slot yang sedang kamu pegang akan dilepas dan mungkin diambil
              traveler lain.
            </p>
            <div className="pending-payment-modal__actions">
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={isSubmitting}
                onClick={handleDismissCancel}
              >
                Kembali
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                loading={isSubmitting && step === "CANCELLING"}
                loadingLabel="Membatalkan..."
                disabled={isSubmitting}
                onClick={handleConfirmCancel}
              >
                Ya, Batalkan Pesanan Lama
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
