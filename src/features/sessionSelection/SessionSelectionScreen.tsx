import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button, Skeleton } from "../../components/ui";
import { getPackageVisual } from "../../lib/assets/packageImages";
import { defaultSessionSelectionAdapter } from "./mockAdapter";
import { SessionCard } from "./SessionCard";
import type {
  SessionSelectionAdapter,
  SessionSelectionViewModel,
} from "./types";
import "./sessionSelection.css";

export interface SessionSelectionScreenProps {
  adapter?: SessionSelectionAdapter;
}

export function SessionSelectionScreen({
  adapter = defaultSessionSelectionAdapter,
}: SessionSelectionScreenProps) {
  const { packageId } = useParams<{ packageId: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [viewModel, setViewModel] = useState<SessionSelectionViewModel | null>(
    null,
  );
  const [selectedSessionId, setSelectedSessionId] = useState<
    string | undefined
  >();
  const [validationNotice, setValidationNotice] = useState<
    { type: "warning" | "error"; message: string } | undefined
  >();

  const loadData = async (id: string) => {
    setIsLoading(true);
    setValidationNotice(undefined);
    try {
      const res = await adapter.getPackageSessions(id);
      setViewModel(res);
      setIsLoading(false);
    } catch (err: unknown) {
      setIsLoading(false);
      setViewModel({
        state: "ERROR",
        sessions: [],
        hasSelectableSession: false,
        errorMessage:
          err instanceof Error ? err.message : "Jadwal belum bisa dimuat.",
      });
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (!packageId) {
      return;
    }

    adapter
      .getPackageSessions(packageId)
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
          sessions: [],
          hasSelectableSession: false,
          errorMessage:
            err instanceof Error ? err.message : "Jadwal belum bisa dimuat.",
        });
      });

    return () => {
      isMounted = false;
    };
  }, [packageId, adapter]);

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    if (validationNotice) {
      setValidationNotice(undefined);
    }
  };

  const handleContinueCheckout = async () => {
    if (!packageId || !selectedSessionId || isRevalidating) return;

    setIsRevalidating(true);
    setValidationNotice(undefined);

    try {
      const validation = await adapter.validateSessionSelection(
        packageId,
        selectedSessionId,
      );

      if (validation.valid) {
        setIsRevalidating(false);
        navigate(`/checkout/${selectedSessionId}`);
        return;
      }

      // Revalidation failed
      setIsRevalidating(false);

      if (
        validation.reason === "REQUEST_ERROR" ||
        validation.reason === "CAPACITY_UNKNOWN"
      ) {
        // Request or capacity error: keep selected session and allow retry
        setValidationNotice({
          type: "error",
          message:
            validation.message ?? "Jadwal belum bisa diverifikasi. Coba lagi.",
        });
      } else {
        // Session became unavailable: clear selection, refresh schedule
        setSelectedSessionId(undefined);
        setValidationNotice({
          type: "warning",
          message:
            validation.message ??
            "Jadwal ini baru saja tidak tersedia. Pilih jadwal lain.",
        });
        // Reload latest sessions in background
        const res = await adapter.getPackageSessions(packageId);
        setViewModel(res);
      }
    } catch {
      setIsRevalidating(false);
      setValidationNotice({
        type: "error",
        message: "Jadwal belum bisa diverifikasi. Coba lagi.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="session-selection-container" aria-busy="true">
        <div className="session-selection-topbar">
          <Skeleton width="10rem" height="2rem" />
        </div>
        <div className="session-selection-header">
          <Skeleton width="14rem" height="2.25rem" />
          <Skeleton width="22rem" height="1.25rem" />
        </div>
        <div className="session-selection-layout">
          <div className="session-selection-main-col">
            <div className="session-selection-list">
              <Skeleton height="5.5rem" />
              <Skeleton height="5.5rem" />
            </div>
          </div>
          <aside className="session-selection-side-col">
            <div className="session-selection-pkg-summary">
              <Skeleton width="4.75rem" height="4.75rem" />
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <Skeleton width="40%" height="1rem" />
                <Skeleton width="70%" height="1.5rem" />
                <Skeleton width="30%" height="1rem" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (!viewModel || viewModel.state === "ERROR") {
    return (
      <div className="session-selection-container">
        <div
          className="session-selection-state-box session-selection-state-box--error"
          role="alert"
        >
          <h2>Jadwal belum bisa dimuat.</h2>
          <p>
            {viewModel?.errorMessage ??
              "Silakan coba lagi beberapa saat tanpa kehilangan halaman."}
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => packageId && loadData(packageId)}
          >
            Coba lagi
          </Button>
        </div>
      </div>
    );
  }

  if (
    viewModel.state === "NOT_FOUND" ||
    !viewModel.package ||
    viewModel.package.status !== "LIVE"
  ) {
    return (
      <div className="session-selection-container">
        <div className="session-selection-state-box">
          <h2>Experience tidak ditemukan.</h2>
          <p>
            Experience ini mungkin sudah tidak tersedia atau tautannya tidak
            valid.
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

  const { package: pkg, sessions, hasSelectableSession } = viewModel;
  const visual = getPackageVisual(pkg.id, pkg.destinationName);

  const selectedSession = sessions.find(
    (s) => s.sessionId === selectedSessionId,
  );

  return (
    <div className="session-selection-container">
      {/* 1. Topbar & Header Context */}
      <div className="session-selection-topbar">
        <Link
          to={`/packages/${pkg.id}`}
          className="session-selection-back-btn"
          aria-label="Kembali ke Detail Experience"
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
            className="session-selection-back-icon"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Detail Experience</span>
        </Link>
      </div>

      <header className="session-selection-header">
        <h1 className="session-selection-title">Pilih Jadwal</h1>
        <p className="session-selection-subtitle">
          Tentukan waktu keberangkatan yang paling sesuai untuk jedamu.
        </p>
      </header>

      {/* Main Two-Column Layout on Desktop, Fluid Stack on Mobile */}
      <div className="session-selection-layout">
        {/* Left Column: Schedule Selection */}
        <div className="session-selection-main-col">
          {/* Revalidation Alert / Notice */}
          {validationNotice && (
            <div
              className={`session-selection-alert ${
                validationNotice.type === "error"
                  ? "session-selection-alert--error"
                  : "session-selection-alert--warning"
              }`}
              role="alert"
            >
              <p>{validationNotice.message}</p>
            </div>
          )}

          {/* Schedule Selection Radio Group */}
          {sessions.length > 0 ? (
            <fieldset className="session-selection-fieldset">
              <legend className="session-selection-legend">
                Jadwal Keberangkatan
              </legend>
              <div className="session-selection-list">
                {sessions.map((session) => (
                  <SessionCard
                    key={session.sessionId}
                    session={session}
                    isSelected={selectedSessionId === session.sessionId}
                    onSelect={handleSelectSession}
                    disabled={isRevalidating}
                  />
                ))}
              </div>
            </fieldset>
          ) : (
            <div className="session-selection-no-session-card">
              <p>Belum ada jadwal yang bisa dipilih saat ini.</p>
            </div>
          )}

          {!hasSelectableSession && sessions.length > 0 && (
            <div className="session-selection-no-session-card">
              <p>Belum ada jadwal yang bisa dipilih saat ini.</p>
            </div>
          )}

          {/* Concurrency Notice */}
          <div className="session-selection-notice-box">
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
              className="session-selection-notice-icon"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p>
              Memilih jadwal belum mengamankan slot. Ketersediaan akan
              dipastikan saat kamu melanjutkan ke checkout.
            </p>
          </div>
        </div>

        {/* Right Column: Compact Package Summary & Side Context */}
        <aside className="session-selection-side-col">
          <section
            className="session-selection-pkg-summary"
            aria-label="Ringkasan paket"
          >
            <div
              className="session-selection-pkg-thumb"
              style={{ backgroundImage: `url("${visual.svgDataUri}")` }}
              role="img"
              aria-label={`Ilustrasi ${pkg.title}`}
            />
            <div className="session-selection-pkg-info">
              <span className="session-selection-pkg-meta">
                {pkg.destinationName} • {pkg.locationLabel}
              </span>
              <h2 className="session-selection-pkg-title">{pkg.title}</h2>
              <span className="session-selection-pkg-price">
                Mulai dari Rp{pkg.pricePerPerson.toLocaleString("id-ID")} /
                orang
              </span>
            </div>
          </section>
        </aside>
      </div>

      {/* Sticky Progression Action Bar */}
      <div className="session-selection-sticky-bar">
        <div className="session-selection-sticky-bar__container">
          <div className="session-selection-sticky-bar__summary-wrap">
            <span className="session-selection-sticky-bar__label">
              Jadwal Pilihan
            </span>
            <span className="session-selection-sticky-bar__status-text">
              {selectedSession
                ? selectedSession.pricePerPerson !== undefined
                  ? `Rp${selectedSession.pricePerPerson.toLocaleString("id-ID")} / orang`
                  : "Jadwal terpilih"
                : "Belum ada jadwal dipilih"}
            </span>
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            className="session-selection-sticky-bar__cta"
            disabled={!selectedSessionId || isRevalidating}
            loading={isRevalidating}
            loadingLabel="Memverifikasi..."
            onClick={handleContinueCheckout}
          >
            Lanjut Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
