import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button, Skeleton } from "../../components/ui";
import { sessionStore } from "../onboarding/sessionStore";
import { defaultContactVerificationAdapter } from "./mockAdapter";
import { OtpVerificationForm } from "./OtpVerificationForm";
import { PhoneEntryForm } from "./PhoneEntryForm";
import type {
  ContactVerificationAdapter,
  ContactVerificationStep,
  OtpVerificationSession,
} from "./types";
import "./contactVerification.css";

export interface ContactVerificationScreenProps {
  adapter?: ContactVerificationAdapter;
}

export function ContactVerificationScreen({
  adapter = defaultContactVerificationAdapter,
}: ContactVerificationScreenProps) {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<ContactVerificationStep>("LOADING");
  const [phone, setPhone] = useState<string>("");
  const [activeSession, setActiveSession] = useState<
    OtpVerificationSession | undefined
  >();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    let isMounted = true;
    if (!sessionId) return;

    adapter
      .getVerificationContext(sessionId)
      .then((ctx) => {
        if (!isMounted) return;
        setIsLoading(false);

        if (!ctx.sessionValid) {
          setStep("NOT_FOUND");
          return;
        }

        // Check if already verified
        if (ctx.isAlreadyVerified) {
          navigate(`/checkout/${sessionId}`, { replace: true });
          return;
        }

        const initialPhone = ctx.currentPhone ?? "";
        setPhone(initialPhone);
        setStep("PHONE_ENTRY");
      })
      .catch(() => {
        if (!isMounted) return;
        setIsLoading(false);
        setStep("NOT_FOUND");
      });

    return () => {
      isMounted = false;
    };
  }, [sessionId, adapter, navigate]);

  const handleRequestOtp = async (inputPhone: string) => {
    const user = sessionStore.get().user;
    if (!user) return;

    setIsSubmitting(true);
    setStep("REQUESTING_OTP");
    setErrorMessage(undefined);

    try {
      const sess = await adapter.requestOtp({
        travelerId: user.id,
        phone: inputPhone,
      });

      setIsSubmitting(false);
      setPhone(inputPhone);
      setActiveSession(sess);
      setStep("OTP_SENT");
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Kode OTP belum bisa dikirim. Coba lagi.",
      );
      setStep("REQUEST_ERROR");
    }
  };

  const handleVerifyOtp = async (code: string) => {
    const user = sessionStore.get().user;
    if (!user || !activeSession) return;

    setIsSubmitting(true);
    setStep("VERIFYING_OTP");
    setErrorMessage(undefined);

    try {
      const res = await adapter.verifyOtp({
        travelerId: user.id,
        phone: activeSession.phone,
        verificationId: activeSession.verificationId,
        code,
      });

      setIsSubmitting(false);

      if (res.success) {
        // Update current sessionStore.user.phone preserving all other identity & onboarding state
        sessionStore.updateUserContact(activeSession.phone);

        // Return to SAME Checkout context
        navigate(`/checkout/${sessionId}`, { replace: true });
        return;
      }

      setErrorMessage(
        res.message ?? "Kode OTP tidak valid atau sudah kedaluwarsa.",
      );
      setStep("VERIFY_ERROR");
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Verifikasi belum bisa diproses. Coba lagi.",
      );
      setStep("VERIFY_ERROR");
    }
  };

  const handleChangePhone = () => {
    const user = sessionStore.get().user;
    if (user) {
      adapter.invalidateOtpSession(user.id);
    }
    setActiveSession(undefined);
    setErrorMessage(undefined);
    setStep("PHONE_ENTRY");
  };

  if (isLoading) {
    return (
      <div className="contact-verification-container" aria-busy="true">
        <Skeleton width="10rem" height="1.5rem" />
        <Skeleton width="60%" height="2rem" />
        <div className="contact-verification-form">
          <Skeleton height="8rem" />
        </div>
      </div>
    );
  }

  if (step === "NOT_FOUND") {
    return (
      <div className="contact-verification-container">
        <div className="contact-verification-state-box">
          <h2>Checkout tidak ditemukan.</h2>
          <p>Sesi checkout ini tidak valid atau sudah tidak tersedia.</p>
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

  return (
    <div className="contact-verification-container">
      {/* 1. Header & Back to Checkout */}
      <div className="contact-verification-topbar">
        <Link
          to={`/checkout/${sessionId}`}
          className="contact-verification-back-btn"
          aria-label="Kembali ke Checkout"
        >
          &larr; Kembali ke Checkout
        </Link>
      </div>

      <header className="contact-verification-header">
        <h1 className="contact-verification-title">Verifikasi Nomor HP</h1>
        <p className="contact-verification-subtitle">
          Verifikasi nomor teleponmu untuk kebutuhan komunikasi trip.
        </p>
      </header>

      {/* Error Notice */}
      {errorMessage && (
        <div
          className="contact-verification-alert contact-verification-alert--error"
          role="alert"
        >
          <p>{errorMessage}</p>
        </div>
      )}

      {/* 2. Form States */}
      {step === "PHONE_ENTRY" ||
      step === "REQUESTING_OTP" ||
      step === "REQUEST_ERROR" ? (
        <PhoneEntryForm
          initialPhone={phone}
          onRequestOtp={handleRequestOtp}
          isSubmitting={isSubmitting || step === "REQUESTING_OTP"}
          isDisabled={isSubmitting || step === "REQUESTING_OTP"}
          error={step === "REQUEST_ERROR" ? errorMessage : undefined}
        />
      ) : activeSession ? (
        <OtpVerificationForm
          key={activeSession.verificationId}
          session={activeSession}
          onVerifyOtp={handleVerifyOtp}
          onResendOtp={() => handleRequestOtp(activeSession.phone)}
          onChangePhone={handleChangePhone}
          isSubmitting={isSubmitting || step === "VERIFYING_OTP"}
          isDisabled={isSubmitting || step === "VERIFYING_OTP"}
          error={step === "VERIFY_ERROR" ? errorMessage : undefined}
        />
      ) : null}
    </div>
  );
}
