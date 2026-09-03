import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Button, Dialog } from "../../components/ui";
import { LOGIN_ATMOSPHERE_VISUAL } from "../../lib/assets/packageImages";
import {
  ArrowLeftIcon,
  CompassTargetIcon,
  DemandInsightIcon,
  SparklesProductIcon,
} from "./icons";
import { defaultOnboardingAdapter } from "./mockAdapter";
import type { OnboardingAdapter } from "./types";
import "./consent.css";

export interface TravelerConsentScreenProps {
  adapter?: OnboardingAdapter;
  onSuccess?: () => void;
  onBack?: () => void;
}

export function TravelerConsentScreen({
  adapter = defaultOnboardingAdapter,
  onSuccess,
  onBack,
}: TravelerConsentScreenProps) {
  const navigate = useNavigate();

  const [hasAgreed, setHasAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!hasAgreed || isSubmitting) return;

    setErrorMessage(undefined);
    setIsSubmitting(true);

    try {
      await adapter.submitConsent();
      setIsSubmitting(false);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/onboarding/quiz");
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan persetujuan data. Silakan coba lagi.",
      );
    }
  };

  return (
    <div className="consent-screen">
      {/* Full-Screen Immersive Nature Backdrop */}
      <div className="consent-screen__backdrop" aria-hidden="true">
        <img
          src={LOGIN_ATMOSPHERE_VISUAL.svgDataUri}
          alt=""
          className="consent-screen__backdrop-image"
          loading="eager"
          width="1000"
          height="800"
        />
        <div className="consent-screen__backdrop-scrim" />
        <div className="consent-screen__backdrop-grain" />
      </div>

      {/* Floating Viewport Container */}
      <div className="consent-screen__container">
        {onBack && (
          <header className="consent-screen__topbar">
            <button
              type="button"
              className="consent-back-action"
              onClick={onBack}
              aria-label="Kembali"
            >
              <ArrowLeftIcon />
              <span>Kembali</span>
            </button>
          </header>
        )}

        {/* Centered Floating Dark Forest Glass Card */}
        <main className="consent-card" aria-label="Persetujuan Data JedaIn">
          {/* Small JedaIn leaf mark */}
          <div className="consent-card__brand">
            <svg
              width="36"
              height="36"
              viewBox="250 220 270 330"
              className="consent-card__mark"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="consentMarkGrad"
                  x1="0%"
                  y1="30%"
                  x2="100%"
                  y2="70%"
                >
                  <stop offset="0%" stopColor="#A7C98B" />
                  <stop offset="50%" stopColor="#86AF84" />
                  <stop offset="100%" stopColor="#4A8F8F" />
                </linearGradient>
              </defs>
              <path
                d="M 428 259 L 424 261 L 413 263 L 390 273 L 388 275 L 384 276 L 369 284 L 367 284 L 348 295 L 336 304 L 331 306 L 313 320 L 297 335 L 287 347 L 275 365 L 273 371 L 267 381 L 263 392 L 260 413 L 259 414 L 259 423 L 258 424 L 259 425 L 258 429 L 259 430 L 259 443 L 262 454 L 263 466 L 268 487 L 270 506 L 271 507 L 269 527 L 264 539 L 264 542 L 266 544 L 265 545 L 262 544 L 261 546 L 277 543 L 293 538 L 301 534 L 304 534 L 333 519 L 350 506 L 362 494 L 371 482 L 381 462 L 381 459 L 384 453 L 388 437 L 389 400 L 388 399 L 388 388 L 387 387 L 387 376 L 386 375 L 386 352 L 387 351 L 388 330 L 391 321 L 391 317 L 403 290 L 413 276 Z M 371 303 L 372 304 L 371 308 L 366 317 L 361 331 L 360 342 L 358 349 L 358 358 L 357 359 L 357 368 L 358 370 L 357 375 L 358 376 L 359 409 L 360 411 L 359 412 L 359 428 L 355 449 L 349 465 L 338 485 L 326 500 L 315 511 L 303 520 L 302 517 L 314 505 L 324 490 L 329 480 L 336 458 L 336 453 L 338 446 L 338 437 L 339 436 L 338 434 L 339 432 L 338 395 L 337 394 L 337 362 L 338 361 L 338 349 L 337 347 L 333 349 L 326 356 L 317 370 L 313 374 L 304 393 L 297 416 L 297 423 L 295 431 L 295 456 L 294 457 L 292 456 L 290 446 L 290 438 L 289 437 L 289 410 L 290 409 L 290 402 L 292 393 L 302 368 L 309 357 L 322 341 L 335 328 L 352 314 L 364 306 Z"
                fill="url(#consentMarkGrad)"
              />
              <path
                d="M 516 224 L 512 224 L 505 228 L 488 234 L 483 238 L 477 240 L 458 253 L 447 262 L 434 276 L 420 298 L 414 314 L 410 335 L 409 355 L 411 365 L 411 391 L 412 392 L 411 410 L 412 412 L 411 413 L 410 432 L 406 452 L 420 444 L 439 428 L 454 411 L 464 395 L 470 382 L 477 361 L 478 350 L 480 343 L 481 315 L 482 314 L 484 315 L 484 320 L 486 325 L 486 333 L 487 334 L 486 336 L 487 338 L 487 362 L 486 363 L 485 374 L 480 387 L 480 390 L 471 409 L 455 431 L 436 450 L 431 453 L 425 459 L 410 469 L 393 478 L 383 491 L 368 506 L 385 501 L 391 497 L 393 497 L 407 489 L 417 485 L 446 467 L 452 461 L 466 451 L 481 436 L 494 419 L 502 406 L 502 404 L 509 391 L 513 379 L 516 364 L 516 356 L 517 355 L 516 325 L 515 324 L 514 312 L 510 301 L 507 286 L 506 271 L 505 270 L 506 245 L 509 236 Z"
                fill="url(#consentMarkGrad)"
              />
            </svg>
          </div>

          <header className="consent-card__header">
            <h1 className="consent-card__title">
              Kenali jeda yang cocok untukmu
            </h1>
            <p className="consent-card__subtitle">
              Sebelum mulai, pahami bagaimana preferensimu membantu JedaIn
              menyiapkan pengalaman yang lebih relevan.
            </p>
          </header>

          {errorMessage && (
            <div className="consent-error-banner" role="alert">
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Three Purpose Rows */}
          <div className="consent-purposes">
            <div className="consent-purpose-row">
              <div className="consent-purpose-row__icon" aria-hidden="true">
                <CompassTargetIcon />
              </div>
              <div className="consent-purpose-row__content">
                <strong>Rekomendasi Personal</strong>
                <p>
                  Membantu JedaIn menampilkan pengalaman yang lebih relevan
                  untukmu.
                </p>
              </div>
            </div>

            <div className="consent-purpose-row">
              <div className="consent-purpose-row__icon" aria-hidden="true">
                <DemandInsightIcon />
              </div>
              <div className="consent-purpose-row__content">
                <strong>Wawasan Kebutuhan</strong>
                <p>
                  Membantu membentuk gambaran kebutuhan traveler secara agregat.
                </p>
              </div>
            </div>

            <div className="consent-purpose-row">
              <div className="consent-purpose-row__icon" aria-hidden="true">
                <SparklesProductIcon />
              </div>
              <div className="consent-purpose-row__content">
                <strong>Pengembangan JedaIn</strong>
                <p>Membantu meningkatkan pengalaman produk JedaIn.</p>
              </div>
            </div>
          </div>

          {/* Form with Checkbox & CTA */}
          <form className="consent-form" onSubmit={handleSubmit} noValidate>
            <div className="consent-checkbox-card">
              <label
                className="consent-checkbox-label"
                htmlFor="traveler-consent-checkbox"
              >
                <input
                  id="traveler-consent-checkbox"
                  type="checkbox"
                  className="consent-checkbox"
                  checked={hasAgreed}
                  onChange={(e) => {
                    setHasAgreed(e.target.checked);
                    if (errorMessage) setErrorMessage(undefined);
                  }}
                  disabled={isSubmitting}
                />
                <span className="consent-checkbox-text">
                  Saya memahami dan menyetujui penggunaan data preferensi untuk
                  tujuan di atas.
                </span>
              </label>

              <div className="consent-privacy-action">
                <button
                  type="button"
                  className="consent-privacy-link"
                  onClick={() => setShowPrivacyDialog(true)}
                >
                  Pelajari rincian penggunaan data &rarr;
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="consent-primary-btn"
              disabled={!hasAgreed || isSubmitting}
            >
              <span>
                {isSubmitting ? "MENYIMPAN PERSETUJUAN..." : "SETUJU & LANJUT"}
              </span>
            </button>
          </form>
        </main>
      </div>

      {/* Privacy Detail Dialog */}
      <Dialog
        open={showPrivacyDialog}
        title="Penggunaan Data Preferensi"
        description="Ringkasan tujuan pemrosesan data preferensi traveler."
        onClose={() => setShowPrivacyDialog(false)}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowPrivacyDialog(false)}
          >
            Mengerti
          </Button>
        }
      >
        <p className="consent-dialog-text">
          Preferensi yang kamu isi saat onboarding membantu JedaIn untuk:
        </p>
        <ul className="consent-dialog-list">
          <li>
            <strong>Rekomendasi personal:</strong> menyajikan paket trip yang
            sesuai dengan preferensi kamu.
          </li>
          <li>
            <strong>Wawasan kebutuhan agregat:</strong> gambaran kebutuhan
            traveler secara agregat.
          </li>
          <li>
            <strong>Penyempurnaan layanan:</strong> meningkatkan pengalaman
            produk JedaIn.
          </li>
        </ul>
        <p className="consent-dialog-text">
          Dokumen kebijakan privasi lengkap akan difinalkan sebelum rilis
          operasional penuh.
        </p>
      </Dialog>
    </div>
  );
}
