import { useState } from "react";
import { useNavigate } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockApplicationStore } from "../eo/mockApplicationStore";
import type { EoApplicationStatus } from "../eo/types";
import "./admin.css";

export function AdminEoApprovalsScreen() {
  const navigate = useNavigate();
  const allApplications = mockApplicationStore.getAll();
  const [filterStatus, setFilterStatus] = useState<"ALL" | EoApplicationStatus>(
    "PENDING_REVIEW",
  );

  const filteredApps =
    filterStatus === "ALL"
      ? allApplications
      : allApplications.filter((a) => a.status === filterStatus);

  return (
    <div className="admin-container">
      <header className="admin-page-header">
        <div>
          <Badge tone="info">Antrean Persetujuan</Badge>
          <h1
            className="admin-page-title"
            style={{ marginTop: "var(--space-2)" }}
          >
            Antrean Aplikasi Mitra Event Organizer (EO)
          </h1>
          <p className="admin-page-subtitle">
            Verifikasi kompetensi pemandu, portofolio pengalaman, dan kepatuhan
            SOP calon mitra penyelenggara.
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
                ? allApplications.length
                : allApplications.filter((a) => a.status === st).length;
            const label =
              st === "PENDING_REVIEW"
                ? "Menunggu Review"
                : st === "APPROVED"
                  ? "Disetujui"
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

      {/* Applications Table */}
      <section className="admin-section" aria-label="Tabel aplikasi EO">
        {filteredApps.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "var(--space-8)",
              color: "var(--color-text-muted)",
            }}
          >
            <p>Tidak ada pengajuan mitra EO pada status ini.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nama Usaha / Komunitas</th>
                  <th>Penanggung Jawab</th>
                  <th>Kota Basis</th>
                  <th>Kategori Pemandu</th>
                  <th>Tanggal Pengajuan</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app) => (
                  <tr key={app.applicationId}>
                    <td>
                      <strong>{app.businessName}</strong>
                      <div
                        style={{
                          fontSize: "var(--font-size-caption)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        ID: {app.identityId}
                      </div>
                    </td>
                    <td>
                      {app.contactPerson}
                      <div
                        style={{
                          fontSize: "var(--font-size-caption)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {app.phone}
                      </div>
                    </td>
                    <td>
                      {app.city}, {app.province}
                    </td>
                    <td>
                      <Badge
                        tone={
                          app.guideStatus === "CERTIFIED_GUIDE"
                            ? "success"
                            : "neutral"
                        }
                      >
                        {app.guideStatus === "CERTIFIED_GUIDE"
                          ? "Certified Guide"
                          : "Concept-Only"}
                      </Badge>
                    </td>
                    <td>
                      {app.submittedAt
                        ? new Date(app.submittedAt).toLocaleDateString("id-ID")
                        : "—"}
                    </td>
                    <td>
                      <Badge
                        tone={
                          app.status === "APPROVED"
                            ? "success"
                            : app.status === "REJECTED"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {app.status === "PENDING_REVIEW"
                          ? "Menunggu"
                          : app.status}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        type="button"
                        variant={
                          app.status === "PENDING_REVIEW"
                            ? "primary"
                            : "secondary"
                        }
                        size="sm"
                        onClick={() =>
                          navigate(`/admin/eo-approvals/${app.applicationId}`)
                        }
                      >
                        {app.status === "PENDING_REVIEW"
                          ? "Tinjau Aplikasi"
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
