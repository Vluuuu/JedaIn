import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockEoPackageStore } from "./mockEoPackageStore";
import { partnerSessionStore } from "./partnerSessionStore";
import type { EoPackageStatus } from "./types";
import "./eo.css";

export function EoPackagesScreen() {
  const navigate = useNavigate();
  const partner = partnerSessionStore.get();
  const eoId = partner?.id ?? "eo_jeda_alam";

  const [filterStatus, setFilterStatus] = useState<"ALL" | EoPackageStatus>(
    "ALL",
  );
  const allPackages = mockEoPackageStore.getPackagesByEo(eoId);

  const filteredPackages =
    filterStatus === "ALL"
      ? allPackages
      : allPackages.filter((p) => p.status === filterStatus);

  return (
    <div className="eo-container">
      <header className="eo-page-header">
        <div>
          <Badge tone="info">Katalog Kurasi EO</Badge>
          <h1 className="eo-page-title" style={{ marginTop: "var(--space-2)" }}>
            Daftar Paket Experience
          </h1>
          <p className="eo-page-subtitle">
            Kelola draf rancangan, pantau status review kurasi Admin, dan buka
            jadwal sesi untuk paket yang disetujui.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={() => navigate("/partner/eo/packages/new")}
        >
          + Buat Paket Baru
        </Button>
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
            "ALL",
            "DRAFT",
            "PENDING_ADMIN_REVIEW",
            "APPROVED",
            "LIVE",
            "REJECTED",
          ] as const
        ).map((st) => {
          const count =
            st === "ALL"
              ? allPackages.length
              : allPackages.filter((p) => p.status === st).length;
          const label =
            st === "ALL"
              ? "Semua"
              : st === "PENDING_ADMIN_REVIEW"
                ? "Menunggu Review"
                : st;
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

      {/* Packages Table / Grid */}
      <section className="eo-section" aria-label="Daftar paket">
        {filteredPackages.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "var(--space-8)",
              color: "var(--color-text-muted)",
            }}
          >
            <p>Belum ada paket pada kategori ini.</p>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => navigate("/partner/eo/packages/new")}
            >
              Mulai Buat Paket Pertama
            </Button>
          </div>
        ) : (
          <div className="eo-table-wrapper">
            <table className="eo-table">
              <thead>
                <tr>
                  <th>Judul Paket</th>
                  <th>Durasi</th>
                  <th>Harga / Orang</th>
                  <th>Status Kurasi</th>
                  <th>Tanggal Dibuat</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredPackages.map((pkg) => (
                  <tr key={pkg.packageId}>
                    <td>
                      <strong>{pkg.title || "Draf Tanpa Judul"}</strong>
                      <div
                        style={{
                          fontSize: "var(--font-size-caption)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {pkg.valueProposition || pkg.shortSummary}
                      </div>
                    </td>
                    <td>{pkg.durationLabel}</td>
                    <td>
                      Rp{pkg.pricing.customerPrice.toLocaleString("id-ID")}
                    </td>
                    <td>
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
                          ? "Menunggu Review"
                          : pkg.status}
                      </Badge>
                    </td>
                    <td>
                      {new Date(pkg.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "var(--space-2)" }}>
                        {pkg.status === "DRAFT" && (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/partner/eo/packages/new?draftId=${pkg.packageId}`,
                              )
                            }
                          >
                            Lanjut Edit
                          </Button>
                        )}

                        {pkg.status === "REJECTED" && (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/partner/eo/packages/new?draftId=${pkg.packageId}`,
                              )
                            }
                          >
                            Perbaiki
                          </Button>
                        )}

                        {(pkg.status === "LIVE" ||
                          pkg.status === "APPROVED") && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/partner/eo/packages/${pkg.packageId}/sessions`,
                              )
                            }
                          >
                            Atur Jadwal Sesi
                          </Button>
                        )}

                        <Link
                          to={`/partner/eo/packages/${pkg.packageId}`}
                          style={{
                            fontSize: "var(--font-size-label-sm)",
                            padding: "0.4rem 0.6rem",
                            color: "var(--color-text-secondary)",
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          Detail
                        </Link>
                      </div>
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
