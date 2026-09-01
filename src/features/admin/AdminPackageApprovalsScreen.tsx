import { useState } from "react";
import { useNavigate } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockEoPackageStore } from "../eo/mockEoPackageStore";
import type { EoPackageStatus } from "../eo/types";
import "./admin.css";

export function AdminPackageApprovalsScreen() {
  const navigate = useNavigate();
  const allPackages = mockEoPackageStore.getAllPackages();
  const [filterStatus, setFilterStatus] = useState<"ALL" | EoPackageStatus>(
    "PENDING_ADMIN_REVIEW",
  );

  const filtered =
    filterStatus === "ALL"
      ? allPackages
      : allPackages.filter((p) => p.status === filterStatus);

  return (
    <div className="admin-container">
      <header className="admin-page-header">
        <div>
          <Badge tone="info">Kurasi Pengalaman Wellness</Badge>
          <h1
            className="admin-page-title"
            style={{ marginTop: "var(--space-2)" }}
          >
            Antrean Persetujuan Paket Experience
          </h1>
          <p className="admin-page-subtitle">
            Tinjau keselarasan mindful itinerary, transparansi harga, kepatuhan
            destinasi terverifikasi, dan catatan keselamatan.
          </p>
        </div>
      </header>

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-2)",
          overflowX: "auto",
          paddingBottom: "var(--space-2)",
        }}
      >
        {(
          [
            "PENDING_ADMIN_REVIEW",
            "APPROVED",
            "LIVE",
            "REJECTED",
            "ALL",
          ] as const
        ).map((st) => {
          const count =
            st === "ALL"
              ? allPackages.length
              : allPackages.filter((p) => p.status === st).length;
          const label =
            st === "PENDING_ADMIN_REVIEW"
              ? "Menunggu Review"
              : st === "APPROVED"
                ? "Disetujui"
                : st === "LIVE"
                  ? "Live"
                  : st === "REJECTED"
                    ? "Ditolak"
                    : "Semua";

          return (
            <button
              key={st}
              type="button"
              className={`eo-step-item ${filterStatus === st ? "eo-step-item--active" : ""}`}
              onClick={() => setFilterStatus(st)}
            >
              <span>{label}</span>
              <span className="eo-step-badge">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Package Approvals Table */}
      <section className="admin-section" aria-label="Tabel kurasi paket">
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "var(--space-8)",
              color: "var(--color-text-muted)",
            }}
          >
            <p>Tidak ada paket experience pada status ini.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Judul Paket</th>
                  <th>Penyelenggara (EO)</th>
                  <th>Destinasi</th>
                  <th>Harga / Orang</th>
                  <th>Validasi Otomatis</th>
                  <th>Tanggal Diajukan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((pkg) => (
                  <tr key={pkg.packageId}>
                    <td>
                      <strong>{pkg.title}</strong>
                      <div
                        style={{
                          fontSize: "var(--font-size-caption)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {pkg.durationLabel}
                      </div>
                    </td>
                    <td>{pkg.eoDisplayName}</td>
                    <td>{pkg.destinationId}</td>
                    <td>
                      Rp{pkg.pricing.customerPrice.toLocaleString("id-ID")}
                    </td>
                    <td>
                      <Badge
                        tone={
                          pkg.validationResult?.valid !== false
                            ? "success"
                            : "danger"
                        }
                      >
                        {pkg.validationResult?.valid !== false
                          ? "Lolos Validasi ✓"
                          : "Ada Kendala"}
                      </Badge>
                    </td>
                    <td>
                      {pkg.submittedAt
                        ? new Date(pkg.submittedAt).toLocaleDateString("id-ID")
                        : "—"}
                    </td>
                    <td>
                      <Button
                        type="button"
                        variant={
                          pkg.status === "PENDING_ADMIN_REVIEW"
                            ? "primary"
                            : "secondary"
                        }
                        size="sm"
                        onClick={() =>
                          navigate(`/admin/package-approvals/${pkg.packageId}`)
                        }
                      >
                        {pkg.status === "PENDING_ADMIN_REVIEW"
                          ? "Review Paket"
                          : "Lihat Detail"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
