import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { Button, Skeleton } from "../../components/ui";
import { defaultReviewAdapter } from "./mockAdapter";
import type {
  ReviewAdapter,
  ReviewTargetType,
  TripReviewViewModel,
} from "./types";
import "./review.css";

export interface TripReviewScreenProps {
  adapter?: ReviewAdapter;
}

export function TripReviewScreen({
  adapter = defaultReviewAdapter,
}: TripReviewScreenProps) {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const targetParam = searchParams.get("target");
  const targetType: ReviewTargetType =
    targetParam === "eo" ? "EO_GUIDE" : "DESTINATION";

  const [isLoading, setIsLoading] = useState(true);
  const [context, setContext] = useState<TripReviewViewModel | null>(null);
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    let isMounted = true;
    if (!bookingId) return;

    adapter
      .getReviewContext(bookingId, targetType)
      .then((res) => {
        if (!isMounted) return;
        setIsLoading(false);
        setContext(res);
        if (res?.existingReview) {
          setRating(res.existingReview.rating);
          setComment(res.existingReview.comment ?? "");
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [bookingId, targetType, adapter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || isSubmitting) return;

    if (
      rating === undefined ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      setErrorMessage("Silakan pilih rating bintang terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(undefined);

    try {
      const res = await adapter.submitReview({
        bookingId,
        targetType,
        rating,
        comment,
      });

      setIsSubmitting(false);

      if (res.success) {
        // Return to Completed Trip Screen
        navigate(`/trips/${bookingId}`, { replace: true });
        return;
      }

      setErrorMessage(
        res.message ?? "Penilaian belum bisa dikirim. Coba lagi.",
      );
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Penilaian belum bisa dikirim. Coba lagi.",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="review-container" aria-busy="true">
        <Skeleton width="10rem" height="1.5rem" />
        <div style={{ marginTop: "1.5rem" }}>
          <Skeleton height="16rem" />
        </div>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="review-container">
        <div className="payment-state-box">
          <h2>Ulasan tidak tersedia.</h2>
          <p>
            Hanya perjalanan yang sudah selesai yang dapat diberikan penilaian.
          </p>
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate("/trips")}
          >
            Kembali ke My Trips
          </Button>
        </div>
      </div>
    );
  }

  const isDestination = targetType === "DESTINATION";
  const ctaLabel = isDestination
    ? "Kirim Penilaian Destinasi"
    : "Kirim Penilaian EO";

  return (
    <div className="review-container">
      {/* 1. Back link */}
      <div className="review-topbar">
        <Link to={`/trips/${bookingId}`} className="review-back-btn">
          &larr; Kembali ke Detail Trip
        </Link>
      </div>

      <header className="review-header">
        <h1 className="review-title">
          {isDestination ? "Nilai Destinasi" : "Nilai EO / Guide"}
        </h1>
        <p className="review-subtitle">
          Berikan evaluasi objektif untuk <strong>{context.targetName}</strong>{" "}
          ({context.packageName}).
        </p>
      </header>

      {errorMessage && (
        <div className="payment-alert payment-alert--error" role="alert">
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Review Form */}
      <form className="review-card" onSubmit={handleSubmit} noValidate>
        {/* Rating Stars Input */}
        <div className="review-rating-group">
          <label className="review-label" id="rating-label">
            Beri Bintang (1 - 5)
          </label>
          <div
            className="review-stars-row"
            role="radiogroup"
            aria-labelledby="rating-label"
          >
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                role="radio"
                aria-checked={rating === val}
                aria-label={`${val} bintang`}
                className={`review-star-btn ${rating !== undefined && rating >= val ? "review-star-btn--filled" : ""}`}
                onClick={() => setRating(val)}
                disabled={context.alreadyReviewed}
              >
                ★
              </button>
            ))}
          </div>
          <span className="review-rating-hint">
            {rating !== undefined
              ? `${rating} dari 5 bintang`
              : "Belum ada bintang dipilih"}
          </span>
        </div>

        {/* Comment Textarea */}
        <div className="review-field">
          <label htmlFor="review-comment" className="review-label">
            Catatan Pengalaman (Opsional)
          </label>
          <textarea
            id="review-comment"
            name="comment"
            rows={4}
            className="review-textarea"
            placeholder={
              isDestination
                ? "Ceritakan suasana, kebersihan, atau keindahan alam di tempat ini..."
                : "Ceritakan pelayanan, kejelasan arahan, dan keramahan pemandu..."
            }
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={context.alreadyReviewed || isSubmitting}
          />
        </div>

        {/* Submit Action */}
        <div className="review-actions">
          {context.alreadyReviewed ? (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => navigate(`/trips/${bookingId}`)}
            >
              Sudah Dinilai (Kembali)
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              loadingLabel="Mengirim Penilaian..."
              disabled={isSubmitting}
            >
              {ctaLabel}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
