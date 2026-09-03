import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { Badge, Button, Checkbox, Skeleton } from "../../components/ui";
import { CheckoutSummaryCard } from "./CheckoutSummaryCard";
import { defaultCheckoutAdapter } from "./mockAdapter";
import { ParticipantQuantity } from "./ParticipantQuantity";
import type {
  CheckoutAdapter,
  CheckoutDraftState,
  CheckoutViewModel,
} from "./types";
import "./checkout.css";

export interface CheckoutScreenProps {
  adapter?: CheckoutAdapter;
}

export function CheckoutScreen({
  adapter = defaultCheckoutAdapter,
}: CheckoutScreenProps) {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const locationDraft = (
    location.state as { checkoutDraft?: CheckoutDraftState } | null
  )?.checkoutDraft;
  const isMatchingDraft =
    locationDraft && locationDraft.sessionId === sessionId;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewModel, setViewModel] = useState<CheckoutViewModel | null>(null);

  // Screen draft states initialized from matching location draft or defaults
  const [participantCount, setParticipantCount] = useState<number>(() =>
    isMatchingDraft ? locationDraft.participantCount : 1,
  );
  const [policyAcknowledged, setPolicyAcknowledged] = useState<boolean>(() =>
    isMatchingDraft ? locationDraft.policyAcknowledged : false,
  );
  const [idempotencyKey] = useState<string>(() =>
    isMatchingDraft
      ? locationDraft.idempotencyKey
      : `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  );
  const [submitErrorNotice, setSubmitErrorNotice] = useState<
    string | undefined
  >();

  const loadCheckout = async (sid: string, preserveNotice = false) => {
    setIsLoading(true);
    if (!preserveNotice) {
      setSubmitErrorNotice(undefined);
    }
    try {
      const res = await adapter.getCheckout(sid);
      setViewModel(res);
      setIsLoading(false);
    } catch (err: unknown) {
      setIsLoading(false);
      setViewModel({
        state: "ERROR",
        errorMessage:
          err instanceof Error ? err.message : "Checkout belum bisa dimuat.",
      });
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (!sessionId) {
      return;
    }

    adapter
      .getCheckout(sessionId)
      .then((res) => {
        if (!isMounted) return;
        setViewModel(res);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setIsLoading(false);
        setViewModel({
          state: "ERROR",
          errorMessage:
            err instanceof Error ? err.message : "Checkout belum bisa dimuat.",
        });
      });

    return () => {
      isMounted = false;
    };
  }, [sessionId, adapter]);

  const handleSubmit = async () => {
    if (
      !sessionId ||
      !viewModel ||
      !viewModel.traveler ||
      !policyAcknowledged ||
      isSubmitting
    ) {
      return;
    }

    const currentPrice = viewModel.session?.pricePerPerson;
    if (currentPrice === undefined) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await adapter.submitCheckout({
        travelerId: viewModel.traveler.id,
        sessionId,
        participantCount,
        expectedUnitPricePerPerson: currentPrice,
        cancellationPolicyAcknowledged: policyAcknowledged,
        idempotencyKey,
      });

      setIsSubmitting(false);

      if (res.status === "SUCCESS" && res.bookingId) {
        navigate(`/payment/${res.bookingId}`);
        return;
      }

      if (res.status === "CONTACT_VERIFICATION_REQUIRED") {
        const checkoutDraft: CheckoutDraftState = {
          sessionId,
          participantCount,
          policyAcknowledged,
          idempotencyKey,
        };
        navigate(`/checkout/${sessionId}/contact`, {
          state: { checkoutDraft },
        });
        return;
      }

      if (res.status === "ACTIVE_PENDING_PAYMENT") {
        const checkoutDraft: CheckoutDraftState = {
          sessionId,
          participantCount,
          policyAcknowledged,
          idempotencyKey,
        };
        navigate(`/checkout/${sessionId}/pending-payment`, {
          state: { checkoutDraft },
        });
        return;
      }

      if (res.status === "SESSION_UNAVAILABLE") {
        if (viewModel.package) {
          navigate(`/packages/${viewModel.package.id}/sessions`);
        } else {
          navigate("/explore");
        }
        return;
      }

      if (res.status === "PRICE_CHANGED") {
        setSubmitErrorNotice(
          res.message ??
            "Harga jadwal berubah. Tinjau total terbaru lalu coba lagi.",
        );
        // Refresh checkout data to show latest exact price snapshot
        loadCheckout(sessionId, true);
        return;
      }

      if (res.status === "INSUFFICIENT_CAPACITY") {
        setSubmitErrorNotice(
          res.message ??
            "Slot yang tersedia berubah. Sesuaikan jumlah peserta lalu coba lagi.",
        );
        // BLOCKER 2: CAPACITY RACE RESULT MUST UPDATE UI TRUTHFULLY
        // Refresh checkout while preserving notice & participant count
        loadCheckout(sessionId, true);
        return;
      }

      if (
        res.status === "SUBMIT_ERROR" ||
        res.status === "INVALID_DRAFT" ||
        res.status === "IDEMPOTENCY_CONFLICT"
      ) {
        setSubmitErrorNotice(
          res.message ?? "Checkout belum bisa diproses. Coba lagi.",
        );
        return;
      }
    } catch {
      setIsSubmitting(false);
      setSubmitErrorNotice("Checkout belum bisa diproses. Coba lagi.");
    }
  };

  if (isLoading) {
    return (
      <div className="checkout-container" aria-busy="true">
        <div className="checkout-topbar">
          <Skeleton width="8rem" height="2.25rem" />
        </div>
        <div className="checkout-header">
          <Skeleton width="10rem" height="2.25rem" />
          <Skeleton width="22rem" height="1.25rem" />
        </div>
        <div className="checkout-layout">
          <div className="checkout-main-col">
            <div className="checkout-surface">
              <Skeleton height="6rem" />
              <div
                style={{
                  height: "1px",
                  background: "var(--color-border-default)",
                }}
              />
              <Skeleton height="8rem" />
              <div
                style={{
                  height: "1px",
                  background: "var(--color-border-default)",
                }}
              />
              <Skeleton height="8rem" />
            </div>
          </div>
          <aside className="checkout-side-col">
            <div className="checkout-summary-pane">
              <Skeleton height="14rem" />
              <Skeleton height="8rem" />
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (!viewModel || viewModel.state === "ERROR") {
    return (
      <div className="checkout-container">
        <div
          className="checkout-state-box checkout-state-box--error"
          role="alert"
        >
          <div className="checkout-state-box__icon-wrap checkout-state-box__icon-wrap--error">
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
          <h2>Checkout belum bisa dimuat.</h2>
          <p>{viewModel?.errorMessage ?? "Silakan coba lagi beberapa saat."}</p>
          <Button
            variant="primary"
            size="md"
            onClick={() => sessionId && loadCheckout(sessionId)}
          >
            Coba lagi
          </Button>
        </div>
      </div>
    );
  }

  if (viewModel.state === "NOT_FOUND") {
    return (
      <div className="checkout-container">
        <div className="checkout-state-box">
          <div className="checkout-state-box__icon-wrap">
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
              <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>
          <h2>Jadwal checkout tidak ditemukan.</h2>
          <p>
            Experience atau jadwal ini mungkin sudah tidak tersedia atau
            tautannya tidak valid.
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

  // BLOCKER 4: DIRECT SESSION_UNAVAILABLE UI
  if (
    viewModel.state === "SESSION_UNAVAILABLE" ||
    (viewModel.session &&
      (viewModel.session.remainingSlots === undefined ||
        viewModel.session.remainingSlots <= 0 ||
        viewModel.session.status !== "OPEN"))
  ) {
    const pkgId = viewModel.package?.id;
    return (
      <div className="checkout-container">
        <div className="checkout-state-box">
          <div className="checkout-state-box__icon-wrap">
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
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <line x1="10" y1="14" x2="14" y2="18" />
              <line x1="14" y1="14" x2="10" y2="18" />
            </svg>
          </div>
          <h2>Jadwal ini baru saja tidak tersedia.</h2>
          <p>Pilih jadwal lain untuk melanjutkan pemesanan.</p>
          <Button
            variant="primary"
            size="md"
            onClick={() =>
              pkgId
                ? navigate(`/packages/${pkgId}/sessions`)
                : navigate("/explore")
            }
          >
            Pilih Jadwal Lain
          </Button>
        </div>
      </div>
    );
  }

  if (!viewModel.package || !viewModel.session) {
    return (
      <div className="checkout-container">
        <div className="checkout-state-box">
          <div className="checkout-state-box__icon-wrap">
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
              <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>
          <h2>Jadwal checkout tidak ditemukan.</h2>
          <p>
            Experience atau jadwal ini mungkin sudah tidak tersedia atau
            tautannya tidak valid.
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

  const {
    package: pkg,
    session,
    traveler,
    contactRequirement,
    cancellationPolicySummary,
  } = viewModel;

  const maxSelectableParticipants = session.remainingSlots ?? 99;
  const unitPrice = session.pricePerPerson; // EXACT SESSION PRICE ONLY
  const totalAmount = unitPrice ? unitPrice * participantCount : 0;
  const formattedTotalPrice = unitPrice
    ? `Rp${totalAmount.toLocaleString("id-ID")}`
    : "Rp-";

  // CTA disabled while participantCount > latest selectable max or price is missing
  const isSubmitDisabled =
    isSubmitting ||
    !policyAcknowledged ||
    unitPrice === undefined ||
    participantCount > maxSelectableParticipants ||
    viewModel.state === "PRICE_UNAVAILABLE";

  return (
    <div className="checkout-container">
      {/* 1. Header context & back link */}
      <div className="checkout-topbar">
        <Link
          to={`/packages/${pkg.id}/sessions`}
          className="checkout-back-btn"
          aria-label="Kembali ke Pilih Jadwal"
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
            className="checkout-back-icon"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Pilih Jadwal</span>
        </Link>
      </div>

      <header className="checkout-header">
        <h1 className="checkout-title">Checkout</h1>
        <p className="checkout-subtitle">
          Tinjau kembali rincian pemesananmu sebelum melanjutkan ke pembayaran.
        </p>
      </header>

      {/* Submit Error / Race Notice */}
      {submitErrorNotice && (
        <div className="checkout-alert checkout-alert--error" role="alert">
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
            className="checkout-alert__icon"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{submitErrorNotice}</p>
        </div>
      )}

      {/* Two-Column Layout on Desktop, Fluid Stack on Mobile */}
      <div className="checkout-layout">
        {/* Left / Main Column: Decision & Verification Controls */}
        <div className="checkout-main-col">
          {/* Mobile-only Summary presentation for early context confirmation */}
          <div className="checkout-mobile-summary-wrapper">
            <CheckoutSummaryCard packageData={pkg} sessionData={session} />
          </div>

          <div className="checkout-surface">
            {/* 2. Participant Quantity */}
            <section className="checkout-section" aria-label="Jumlah peserta">
              <h2 className="checkout-section__title">Jumlah Peserta</h2>
              <ParticipantQuantity
                value={participantCount}
                min={1}
                max={maxSelectableParticipants}
                onChange={setParticipantCount}
                disabled={isSubmitting}
              />
            </section>

            <div className="checkout-surface__divider" role="separator" />

            {/* 3. Traveler & Contact Summary */}
            <section
              className="checkout-section"
              aria-label="Informasi kontak pemesan"
            >
              <div className="checkout-section__header-row">
                <h2 className="checkout-section__title">Kontak Pemesan</h2>
                <span className="checkout-section__hint">
                  Identitas pemesanan
                </span>
              </div>
              <div className="checkout-contact-box">
                <div className="checkout-contact-row">
                  <span className="checkout-contact-label">Nama</span>
                  <span className="checkout-contact-val">
                    {contactRequirement?.name || traveler?.name || "-"}
                  </span>
                </div>
                <div className="checkout-contact-row">
                  <span className="checkout-contact-label">Email</span>
                  <span className="checkout-contact-val">
                    {contactRequirement?.email || traveler?.email || "-"}
                  </span>
                </div>
                <div className="checkout-contact-row">
                  <span className="checkout-contact-label">Nomor HP</span>
                  <div className="checkout-contact-val-group">
                    <span className="checkout-contact-val">
                      {contactRequirement?.phone || traveler?.phone || "-"}
                    </span>
                    <Badge
                      tone={
                        contactRequirement?.phoneVerified
                          ? "success"
                          : "warning"
                      }
                    >
                      {contactRequirement?.phoneVerified
                        ? "Terverifikasi"
                        : "Belum Verifikasi"}
                    </Badge>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Cancellation & Refund Policy Summary */}
            {cancellationPolicySummary && (
              <>
                <div className="checkout-surface__divider" role="separator" />
                <section
                  className="checkout-section"
                  aria-label="Kebijakan pembatalan dan refund"
                >
                  <h2 className="checkout-section__title">
                    Kebijakan Pembatalan & Refund
                  </h2>
                  <p className="checkout-policy-text">
                    {cancellationPolicySummary}
                  </p>
                  <div className="checkout-policy-wrapper">
                    <Checkbox
                      id="cancellation-policy-ack"
                      label="Saya sudah membaca ringkasan kebijakan pembatalan & refund."
                      checked={policyAcknowledged}
                      onChange={(e) => setPolicyAcknowledged(e.target.checked)}
                      disabled={isSubmitting}
                    />
                  </div>
                </section>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Experience, Session & Payment Breakdown Summary */}
        <aside className="checkout-side-col">
          <div className="checkout-summary-pane">
            {/* Desktop presentation of Summary Card */}
            <div className="checkout-desktop-summary-wrapper">
              <CheckoutSummaryCard packageData={pkg} sessionData={session} />
            </div>

            {/* Price Breakdown Card / Section */}
            <section
              className="checkout-price-card"
              aria-label="Rincian harga pembayaran"
            >
              <h2 className="checkout-price-card__title">Rincian Pembayaran</h2>
              <div className="checkout-price-list">
                <div className="checkout-price-row">
                  <span>Harga experience ({participantCount} peserta)</span>
                  <span>
                    {participantCount} ×{" "}
                    {unitPrice
                      ? `Rp${unitPrice.toLocaleString("id-ID")}`
                      : "Rp-"}
                  </span>
                </div>
                <div className="checkout-price-row checkout-price-row--total">
                  <div className="checkout-price-row__total-label-wrap">
                    <span className="checkout-price-row__total-title">
                      Total Pembayaran
                    </span>
                    <span className="checkout-price-row__total-subtitle">
                      Total untuk {participantCount} peserta
                    </span>
                  </div>
                  <span className="checkout-price-total-val">
                    {formattedTotalPrice}
                  </span>
                </div>
              </div>
            </section>

            {/* Slot Reservation Notice */}
            <div className="checkout-notice-box">
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
                className="checkout-notice-box__icon"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <p>Slot baru diamankan setelah kamu lanjut ke pembayaran.</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Sticky Action Bar for Mobile and Final Confirmation */}
      <div className="checkout-sticky-bar">
        <div className="checkout-sticky-bar__container">
          <div className="checkout-sticky-bar__summary">
            <span className="checkout-sticky-bar__label">Total Pembayaran</span>
            <span className="checkout-sticky-bar__total">
              {formattedTotalPrice}
            </span>
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            className="checkout-sticky-bar__cta"
            disabled={isSubmitDisabled}
            loading={isSubmitting}
            loadingLabel="Memproses..."
            onClick={handleSubmit}
          >
            Lanjut ke Pembayaran
          </Button>
        </div>
      </div>
    </div>
  );
}
