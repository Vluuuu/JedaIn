import { Link, useNavigate, useParams } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockDestinationStore } from "./mockDestinationStore";
import { mockEoPackageStore } from "./mockEoPackageStore";
import { mockInsightStore } from "./mockInsightStore";
import "./eo.css";

export function EoPackageDetailScreen() {
  const { packageId } = useParams<{ packageId: string }>();
  const navigate = useNavigate();
  const pkg = packageId
    ? mockEoPackageStore.getPackageById(packageId)
    : undefined;

  if (!pkg) {
    return (
      <div className="eo-container">
        <div
          className="eo-section"
          style={{ textAlign: "center", padding: "var(--space-8)" }}
        >
          <h2>Paket Tidak Ditemukan</h2>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Rancangan paket ini tidak tersedia atau tautan tidak valid.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => navigate("/partner/eo/packages")}
          >
            Kembali ke Daftar Paket
          </Button>
        </div>
      </div>
    );
  }

  const destination = mockDestinationStore.getById(pkg.destinationId);
  const insight = pkg.insightId
    ? mockInsightStore.getInsightById(pkg.insightId)
    : undefined;

  return (
    <div className="eo-container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link
          to="/partner/eo/packages"
          style={{
            color: "var(--color-text-secondary)",
            fontSize: "var(--font-size-body-sm)",
          }}
        >
          &larr; Kembali ke Daftar Paket
        </Link>

        {(pkg.status === "APPROVED" || pkg.status === "LIVE") && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() =>
              navigate(`/partner/eo/packages/${pkg.packageId}/sessions`)
            }
          >
            Atur Jadwal Sesi &rarr;
          </Button>
        )}

        {pkg.status === "DRAFT" && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() =>
              navigate(`/partner/eo/packages/new?draftId=${pkg.packageId}`)
            }
          >
            Lanjut Edit Draf &rarr;
          </Button>
        )}

        {pkg.status === "REJECTED" && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() =>
              navigate(`/partner/eo/packages/new?draftId=${pkg.packageId}`)
            }
          >
            Perbaiki & Ajukan Ulang &rarr;
          </Button>
        )}
      </div>

      <header className="eo-page-header">
        <div>
          <div
            style={{
              display: "flex",
              gap: "var(--space-2)",
              alignItems: "center",
            }}
          >
            <Badge
              tone={
                pkg.status === "LIVE" || pkg.status === "APPROVED"
                  ? "success"
                  : pkg.status === "REJECTED"
                    ? "danger"
                    : pkg.status === "PENDING_ADMIN_REVIEW"
                      ? "warning"
                      : "neutral"
              }
            >
              {pkg.status === "PENDING_ADMIN_REVIEW"
                ? "Menunggu Review Admin"
                : pkg.status}
            </Badge>
            <Badge tone="neutral">{pkg.durationLabel}</Badge>
            {destination && <Badge tone="info">{destination.name}</Badge>}
          </div>

          <h1 className="eo-page-title" style={{ marginTop: "var(--space-2)" }}>
            {pkg.title}
          </h1>
          <p className="eo-page-subtitle">
            {pkg.valueProposition || pkg.shortSummary}
          </p>
        </div>
      </header>

      {/* Submission Status Explanation Box */}
      {pkg.status === "PENDING_ADMIN_REVIEW" && (
        <section
          className="eo-alert eo-alert--warning"
          aria-label="Status peninjauan kurator"
        >
          <strong>Sedang Ditinjau Tim Kurator Admin JedaIn</strong>
          <p style={{ margin: "var(--space-1) 0 0" }}>
            Paket ini telah lolos validasi otomatis dan diajukan pada{" "}
            {pkg.submittedAt
              ? new Date(pkg.submittedAt).toLocaleDateString("id-ID")
              : "hari ini"}
            . Setelah disetujui Admin, status akan menjadi APPROVED dan kamu
            dapat membuka jadwal sesi penjualan.
          </p>
        </section>
      )}

      {pkg.status === "REJECTED" && (
        <section
          className="eo-alert eo-alert--error"
          aria-label="Alasan penolakan kurator"
        >
          <strong>Catatan Perbaikan dari Kurator Admin:</strong>
          <p style={{ margin: "var(--space-1) 0 0" }}>
            {pkg.rejectionReason ??
              "Mohon perjelas rincian durasi waktu pada setiap sesi aktivitas itinerary."}
          </p>
        </section>
      )}

      {/* Content Breakdown */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "var(--space-6)",
        }}
      >
        {/* Left column: Itinerary & Description */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-5)",
          }}
        >
          <section className="eo-section">
            <h2 className="eo-section-title">Alur Itinerary Pengalaman</h2>
            <div className="eo-itinerary-list">
              {pkg.itinerary.map((item) => (
                <div key={item.order} className="eo-itinerary-item">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <strong>
                      #{item.order} {item.title}
                    </strong>
                    {item.durationLabel && (
                      <Badge tone="neutral">{item.durationLabel}</Badge>
                    )}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "var(--font-size-body-sm)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Included / Excluded items */}
          <section className="eo-section">
            <h2 className="eo-section-title">Ketentuan & Fasilitas</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-4)",
                fontSize: "var(--font-size-body-sm)",
              }}
            >
              <div>
                <strong
                  style={{
                    display: "block",
                    marginBottom: "var(--space-1)",
                    color: "var(--color-success-text)",
                  }}
                >
                  Sudah Termasuk:
                </strong>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "1.25rem",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {pkg.includedItems.map((inc, i) => (
                    <li key={i}>{inc}</li>
                  ))}
                </ul>
              </div>

              <div>
                <strong
                  style={{
                    display: "block",
                    marginBottom: "var(--space-1)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Belum Termasuk:
                </strong>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "1.25rem",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {pkg.excludedItems.map((exc, i) => (
                    <li key={i}>{exc}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Right column: Pricing & Context Cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          <div className="eo-pricing-summary">
            <h3 style={{ fontSize: "var(--font-size-heading-sm)", margin: 0 }}>
              Rincian Harga
            </h3>
            <div className="eo-pricing-row">
              <span>Modal Destinasi:</span>
              <strong>
                Rp{pkg.pricing.destinationBaseCost.toLocaleString("id-ID")}
              </strong>
            </div>
            <div className="eo-pricing-row">
              <span>Margin EO:</span>
              <strong>Rp{pkg.pricing.eoMargin.toLocaleString("id-ID")}</strong>
            </div>
            <div className="eo-pricing-row eo-pricing-row--total">
              <span>Harga Jual:</span>
              <span>
                Rp{pkg.pricing.customerPrice.toLocaleString("id-ID")} / orang
              </span>
            </div>
          </div>

          {destination && (
            <div className="eo-section" style={{ padding: "var(--space-4)" }}>
              <strong
                style={{
                  fontSize: "var(--font-size-body-sm)",
                  color: "var(--color-text-primary)",
                }}
              >
                Lokasi Destinasi:
              </strong>
              <div style={{ marginTop: "var(--space-2)" }}>
                <h4 style={{ margin: 0, fontSize: "var(--font-size-body-md)" }}>
                  {destination.name}
                </h4>
                <p
                  style={{
                    margin: "0.25rem 0",
                    fontSize: "var(--font-size-caption)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {destination.locationLabel}
                </p>
                <Badge tone={destination.guideReady ? "success" : "neutral"}>
                  {destination.guideReady ? "Guide Ready ✓" : "Non-Guide Ready"}
                </Badge>
              </div>
            </div>
          )}

          {insight && (
            <div className="eo-section" style={{ padding: "var(--space-4)" }}>
              <strong
                style={{
                  fontSize: "var(--font-size-body-sm)",
                  color: "var(--color-text-primary)",
                }}
              >
                Konteks Demand Insight:
              </strong>
              <p
                style={{
                  margin: "var(--space-1) 0 0",
                  fontSize: "var(--font-size-body-sm)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {insight.title}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
