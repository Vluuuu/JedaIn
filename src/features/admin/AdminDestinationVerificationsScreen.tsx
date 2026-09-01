import { useState } from "react";
import { useNavigate } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockDestinationVerificationStore } from "./mockDestinationVerificationStore";
import type { DestinationVerificationStatus } from "./types";
import "./admin.css";

export function AdminDestinationVerificationsScreen() {
  const navigate = useNavigate();
  const allVerifications = mockDestinationVerificationStore.getAll();
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | DestinationVerificationStatus
  >("PENDING_REVIEW");

  const filtered =
    filterStatus === "ALL"
      ? allVerifications
      : allVerifications.filter((d) => d.status === filterStatus);

  return (
    <div className="admin-container">
      <header className="admin-page-header">
        <div>
          <Badge tone="info">Verifikasi Mitra Destinasi</Badge>
          <h1
            className="admin-page-title"
            style={{ marginTop: "var(--space-2)" }}
          >
            Antrean Verifikasi Destinasi Lokal
          </h1>
          <p className="admin-page-subtitle">
            Tinjau kesiapan lokasi alam, ketenangan lingkungan, fasilitas SOP,
            dan ketersediaan pemandu lokal (Guide Ready).
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
        {(["PENDING_REVIEW", "APPROVED", "REJECTED", "ALL"] as const).map(
          (st) => {
            const count =
              st === "ALL"
                ? allVerifications.length
                : allVerifications.filter((d) => d.status === st).length;
            const label =
              st === "PENDING_REVIEW"
                ? "Menunggu Review"
                : st === "APPROVED"
                  ? "Terverifikasi (BASIC)"
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
          },
        )}
      </div>

      {/* Verifications Table */}
      <section
        className="admin-section"
        aria-label="Tabel verifikasi destinasi"
      >
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "var(--space-8)",
              color: "var(--color-text-muted)",
            }}
          >
            <p>Tidak ada pengajuan verifikasi destinasi pada kategori ini.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nama Destinasi</th>
                  <th>Lokasi / Wilayah</th>
                  <th>Modal Dasar / Orang</th>
                  <th>Kesiapan Pemandu Lokal</th>
                  <th>Tanggal Pengajuan</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((dest) => (
                  <tr key={dest.applicationId}>
                    <td>
                      <strong>{dest.name}</strong>
                      <div
                        style={{
                          fontSize: "var(--font-size-caption)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        ID: {dest.destinationIdentityId}
                      </div>
                    </td>
                    <td>{dest.locationLabel}</td>
                    <td>Rp{dest.baseCostPerPerson.toLocaleString("id-ID")}</td>
                    <td>
                      <span
                        style={{
                          fontSize: "var(--font-size-caption)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {dest.guideReadinessEvidence}
                      </span>
                    </td>
                    <td>
                      {new Date(dest.submittedAt).toLocaleDateString("id-ID")}
                    </td>
                    <td>
                      <Badge
                        tone={
                          dest.status === "APPROVED"
                            ? "success"
                            : dest.status === "REJECTED"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {dest.status === "PENDING_REVIEW"
                          ? "Menunggu"
                          : dest.status}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        type="button"
                        variant={
                          dest.status === "PENDING_REVIEW"
                            ? "primary"
                            : "secondary"
                        }
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/admin/destination-verifications/${dest.applicationId}`,
                          )
                        }
                      >
                        {dest.status === "PENDING_REVIEW"
                          ? "Verifikasi Lokasi"
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
