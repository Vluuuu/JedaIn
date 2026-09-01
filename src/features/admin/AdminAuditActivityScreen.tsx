import { useState } from "react";
import { Badge } from "../../components/ui";
import { mockAdminAuditStore } from "./mockAdminAuditStore";
import "./admin.css";

export function AdminAuditActivityScreen() {
  const [filterAction, setFilterAction] = useState<string>("ALL");
  const allEvents = mockAdminAuditStore.getAll();

  const filtered =
    filterAction === "ALL"
      ? allEvents
      : allEvents.filter((e) => e.actionType === filterAction);

  return (
    <div className="admin-container">
      <header className="admin-page-header">
        <div>
          <Badge tone="info">Audit Log Tidak Dapat Diubah</Badge>
          <h1
            className="admin-page-title"
            style={{ marginTop: "var(--space-2)" }}
          >
            Log Aktivitas & Jejak Keputusan Admin
          </h1>
          <p className="admin-page-subtitle">
            Seluruh keputusan persetujuan mitra, verifikasi destinasi, kurasi
            paket, dan penanganan aduan tercatat otomatis secara transparan.
          </p>
        </div>
      </header>

      {/* Filter by Action Type */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-2)",
          overflowX: "auto",
          paddingBottom: "var(--space-2)",
        }}
      >
        {[
          "ALL",
          "APPROVE_EO",
          "REJECT_EO",
          "APPROVE_DESTINATION",
          "REJECT_DESTINATION",
          "APPROVE_PACKAGE",
          "REJECT_PACKAGE",
          "CLASSIFY_COMPLAINT",
          "MANUAL_TRUST_ACTION",
        ].map((actType) => {
          const label =
            actType === "ALL" ? "Semua Aksi" : actType.replace(/_/g, " ");

          return (
            <button
              key={actType}
              type="button"
              className={`eo-step-item ${filterAction === actType ? "eo-step-item--active" : ""}`}
              onClick={() => setFilterAction(actType)}
            >
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Audit Timeline / Table */}
      <section className="admin-section" aria-label="Tabel jejak audit">
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "var(--space-8)",
              color: "var(--color-text-muted)",
            }}
          >
            <p>Belum ada log audit untuk jenis aksi ini.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Waktu (WIB)</th>
                  <th>Aktor Administrator</th>
                  <th>Aksi Keputusan</th>
                  <th>Tipe & ID Entitas</th>
                  <th>Perubahan Status</th>
                  <th>Alasan / Justifikasi Audit</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ev) => (
                  <tr key={ev.auditId}>
                    <td>
                      <strong>
                        {new Date(ev.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </strong>
                      <div
                        style={{
                          fontSize: "var(--font-size-caption)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {new Date(ev.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        WIB
                      </div>
                    </td>
                    <td>
                      <strong>{ev.actorLabel}</strong>
                      <div
                        style={{
                          fontSize: "var(--font-size-caption)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        ID: {ev.actorId}
                      </div>
                    </td>
                    <td>
                      <Badge
                        tone={
                          ev.actionType.startsWith("APPROVE")
                            ? "success"
                            : ev.actionType.startsWith("REJECT")
                              ? "danger"
                              : "neutral"
                        }
                      >
                        {ev.actionType}
                      </Badge>
                    </td>
                    <td>
                      <strong>{ev.entityType}</strong>
                      <div
                        style={{
                          fontSize: "var(--font-size-caption)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {ev.entityId}
                      </div>
                    </td>
                    <td>
                      {ev.previousStatus && ev.nextStatus ? (
                        <span>
                          <Badge tone="neutral">{ev.previousStatus}</Badge>{" "}
                          &rarr; <Badge tone="success">{ev.nextStatus}</Badge>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "var(--font-size-body-sm)",
                          fontStyle: "italic",
                          color: "var(--color-text-primary)",
                        }}
                      >
                        "{ev.reason}"
                      </p>
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
