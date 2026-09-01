import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Badge, Button, Checkbox, Skeleton } from "../../components/ui";
import { CheckoutSummaryCard } from "./CheckoutSummaryCard";
import { defaultCheckoutAdapter } from "./mockAdapter";
import { ParticipantQuantity } from "./ParticipantQuantity";
import type { CheckoutAdapter, CheckoutViewModel } from "./types";
import "./checkout.css";

export interface CheckoutScreenProps {
  adapter?: CheckoutAdapter;
}

export function CheckoutScreen({
  adapter = defaultCheckoutAdapter,
}: CheckoutScreenProps) {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewModel, setViewModel] = useState<CheckoutViewModel | null>(null);

  // Screen draft states
  const [participantCount, setParticipantCount] = useState<number>(1);
  const [policyAcknowledged, setPolicyAcknowledged] = useState<boolean>(false);
  const [idempotencyKey] = useState<string>(
    () => `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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
        navigate(`/checkout/${sessionId}/contact`);
        return;
      }

      if (res.status === "ACTIVE_PENDING_PAYMENT") {
        navigate(`/checkout/${sessionId}/pending-payment`);
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
        <Skeleton width="12rem" height="1.5rem" />
        <Skeleton width="60%" height="2rem" />
        <div className="checkout-summary-card">
          <Skeleton height="6rem" />
        </div>
        <div className="checkout-section">
          <Skeleton height="4rem" />
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
          &larr; Pilih Jadwal
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
          <p>{submitErrorNotice}</p>
        </div>
      )}

      {/* 2. Package & Session Summary Card */}
      <CheckoutSummaryCard packageData={pkg} sessionData={session} />

      {/* 3. Participant Quantity */}
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

      {/* 4. Traveler & Contact Summary */}
      <section
        className="checkout-section"
        aria-label="Informasi kontak pemesan"
      >
        <h2 className="checkout-section__title">Kontak Pemesan</h2>
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
            <span className="checkout-contact-val">
              {contactRequirement?.phone || traveler?.phone || "-"}
            </span>
            <Badge
              tone={contactRequirement?.phoneVerified ? "success" : "warning"}
            >
              {contactRequirement?.phoneVerified
                ? "Terverifikasi"
                : "Belum Verifikasi"}
            </Badge>
          </div>
        </div>
      </section>

      {/* 5. Price Breakdown */}
      <section
        className="checkout-section"
        aria-label="Rincian harga pembayaran"
      >
        <h2 className="checkout-section__title">Rincian Pembayaran</h2>
        <div className="checkout-price-list">
          <div className="checkout-price-row">
            <span>Harga experience ({participantCount} peserta)</span>
            <span>
              {participantCount} ×{" "}
              {unitPrice ? `Rp${unitPrice.toLocaleString("id-ID")}` : "Rp-"}
            </span>
          </div>
          <div className="checkout-price-row checkout-price-row--total">
            <span>Total Pembayaran</span>
            <span className="checkout-price-total-val">
              {formattedTotalPrice}
            </span>
          </div>
        </div>
      </section>

      {/* 6. Cancellation & Refund Policy Summary */}
      {cancellationPolicySummary && (
        <section
          className="checkout-section"
          aria-label="Kebijakan pembatalan dan refund"
        >
          <h2 className="checkout-section__title">
            Kebijakan Pembatalan & Refund
          </h2>
          <div className="checkout-notice-box">
            <p>{cancellationPolicySummary}</p>
          </div>
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
      )}

      {/* 7. Slot reservation notice */}
      <div className="checkout-notice-box">
        <p>Slot baru diamankan setelah kamu lanjut ke pembayaran.</p>
      </div>

      {/* 8. Sticky Action Bar */}
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
