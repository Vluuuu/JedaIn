import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { Button, Skeleton } from "../../components/ui";
import type { CheckoutDraftState } from "../checkout/types";
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

function calculateSecondsRemaining(
  expiresAtIso: string,
  serverOffsetMs: number = 0,
): number {
  const expiry = new Date(expiresAtIso).getTime();
  const visualNow = Date.now() + serverOffsetMs;
  return Math.max(0, Math.ceil((expiry - visualNow) / 1000));
}

export function PendingPaymentResolutionScreen({
  adapter = defaultPendingPaymentResolutionAdapter,
}: PendingPaymentResolutionScreenProps) {
  const { sessionId: intendedSessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const checkoutDraft = (
    location.state as { checkoutDraft?: CheckoutDraftState } | null
  )?.checkoutDraft;
  const isMatchingDraft =
    checkoutDraft && checkoutDraft.sessionId === intendedSessionId;

  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<PendingPaymentResolutionStep>("LOADING");
  const [summary, setSummary] = useState<
    PendingPaymentSummaryModel | undefined
  >();
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverOffsetMs, setServerOffsetMs] = useState<number>(0);

  // Focus management refs for Cancel Confirmation Dialog (Requirement 5)
  const cancelTriggerRef = useRef<HTMLButtonElement | null>(null);
  const dismissBtnRef = useRef<HTMLButtonElement | null>(null);

  const handleDismissCancel = () => {
    setStep("ACTIVE");
    // Restore focus to cancel trigger button (Requirement 5)
    setTimeout(() => {
      cancelTriggerRef.current?.focus();
    }, 0);
  };

  const loadData = async (sid: string) => {
    setIsLoading(true);
    setErrorMessage(undefined);
    try {
      const res = await adapter.getPendingPaymentResolution(sid);
      setIsLoading(false);
      setStep(res.step);
      setSummary(res.summary);
      if (res.summary) {
        const clientNow = Date.now();
        const serverNowMs = Date.parse(res.summary.serverNow);
        const offset = serverNowMs - clientNow;
        setServerOffsetMs(offset);
        setSecondsRemaining(
          calculateSecondsRemaining(res.summary.expiresAt, offset),
        );
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
          const clientNow = Date.now();
          const serverNowMs = Date.parse(res.summary.serverNow);
          const offset = serverNowMs - clientNow;
          setServerOffsetMs(offset);
          setSecondsRemaining(
            calculateSecondsRemaining(res.summary.expiresAt, offset),
          );
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

  // Countdown timer effect using serverOffsetMs (Requirement 1 & 2)
  useEffect(() => {
    if (!summary || (step !== "ACTIVE" && step !== "ACTION_ERROR")) return;

    const interval = setInterval(() => {
      const remaining = calculateSecondsRemaining(
        summary.expiresAt,
        serverOffsetMs,
      );
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        // Authoritative revalidation when visual countdown reaches zero
        if (summary.booking.bookingId) {
          adapter
            .revalidatePendingPayment(summary.booking.bookingId)
            .then((res) => {
              if (!res.stillActive) {
                if (res.reason === "EXPIRED") {
                  setStep("EXPIRED");
                } else {
                  setStep("NO_ACTIVE_PENDING");
                }
              }
            })
            .catch(() => {
              // Request error must NOT invent EXPIRED; remain in ACTION_ERROR (Requirement 1)
              setStep("ACTION_ERROR");
              setErrorMessage(
                "Status pembayaran belum bisa diverifikasi. Coba lagi.",
              );
            });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [summary, step, serverOffsetMs, adapter]);

  // Focus management effect for modal (Requirement 5)
  useEffect(() => {
    if (step === "CANCEL_CONFIRM") {
      // Focus safe "Kembali" action upon dialog open
      dismissBtnRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          handleDismissCancel();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [step]);

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
      setStep("ACTION_ERROR");
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
        navigate(`/checkout/${intendedSessionId}`, {
          replace: true,
          state: isMatchingDraft ? { checkoutDraft } : undefined,
        });
        return;
      }

      if (res.status === "EXPIRED") {
        setStep("EXPIRED");
        return;
      }

      setStep("ACTION_ERROR");
      setErrorMessage(
        res.message ?? "Pesanan belum bisa dibatalkan. Coba lagi.",
      );
    } catch (err: unknown) {
      setIsSubmitting(false);
      setStep("ACTION_ERROR");
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
        <div className="pending-payment-topbar">
          <Skeleton width="8rem" height="2.25rem" />
        </div>
        <div className="pending-payment-header">
          <Skeleton width="18rem" height="2rem" />
          <Skeleton width="22rem" height="1.25rem" />
        </div>
        <div className="pending-payment-surface">
          <Skeleton height="3rem" />
          <Skeleton height="6rem" />
          <Skeleton height="8rem" />
        </div>
      </div>
    );
  }

  if (step === "ERROR") {
    return (
      <div className="pending-payment-container">
        <div className="pending-payment-state-box" role="alert">
          <div className="pending-payment-state-box__icon-wrap pending-payment-state-box__icon-wrap--error">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
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
          <div className="pending-payment-state-box__icon-wrap">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h2>Pembayaran sudah kedaluwarsa.</h2>
          <p>
            Waktu pembayaran telah habis dan slot yang dipesan telah dilepas.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() =>
              navigate(`/checkout/${intendedSessionId}`, {
                state: isMatchingDraft ? { checkoutDraft } : undefined,
              })
            }
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
          <div className="pending-payment-state-box__icon-wrap">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2>Tidak ada pembayaran tertunda yang aktif.</h2>
          <p>Kamu dapat melanjutkan proses checkout untuk jadwal yang baru.</p>
          <Button
            variant="primary"
            size="md"
            onClick={() =>
              navigate(`/checkout/${intendedSessionId}`, {
                state: isMatchingDraft ? { checkoutDraft } : undefined,
              })
            }
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
          state={isMatchingDraft ? { checkoutDraft } : undefined}
          className="pending-payment-back-btn"
          aria-label="Kembali ke Checkout"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="pending-payment-back-icon"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Kembali ke Checkout</span>
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

      {/* Recoverable Error Banner */}
      {errorMessage && (
        <div
          className="pending-payment-alert pending-payment-alert--error"
          role="alert"
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
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{errorMessage}</p>
        </div>
      )}

      {/* 2. Existing Payment Summary Surface */}
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
          ref={cancelTriggerRef}
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
              <button
                ref={dismissBtnRef}
                type="button"
                className="ui-button ui-button--secondary ui-button--md"
                disabled={isSubmitting}
                onClick={handleDismissCancel}
              >
                Kembali
              </button>
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
