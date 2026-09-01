import { useState } from "react";
import { Badge, Button } from "../../components/ui";
import { mockApplicationStore } from "../eo/mockApplicationStore";
import { mockDestinationStore } from "../eo/mockDestinationStore";
import { mockReviewStore } from "../reviews/mockReviewStore";
import { mockAdminAuditStore } from "./mockAdminAuditStore";
import { mockComplaintStore } from "./mockComplaintStore";
import type { TrustEntitySummary } from "./types";
import "./admin.css";

export function AdminTrustStatusScreen() {
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [filterType, setFilterType] = useState<"ALL" | "EO" | "DESTINATION">(
    "ALL",
  );

  // Collect EO entities from mockApplicationStore
  const eoApps = mockApplicationStore.getAll();
  const allDestinations = mockDestinationStore.getAll();
  const allComplaints = mockComplaintStore.getAll();

  const eoEntities: TrustEntitySummary[] = eoApps.map((app) => {
    const orgRef =
      app.identityId === "eo_jeda_alam" ? "org_lereng_batu" : app.identityId;
    const reviews = mockReviewStore.getReviewsForOrganizer(orgRef);
    const avgRating =
      reviews.length > 0
        ? (
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          ).toFixed(1)
        : undefined;
    const complaints = allComplaints.filter(
      (c) => c.targetRef === app.identityId,
    );

    return {
      entityId: app.identityId,
      entityType: "EO",
      name: app.businessName,
      locationOrBusiness: `${app.city}, ${app.province}`,
      verificationLevelOrGuideStatus:
        app.guideStatus === "CERTIFIED_GUIDE"
          ? "Certified Guide"
          : "Concept-Only",
      reviewAverage: avgRating,
      reviewCount: reviews.length,
      complaintCount: complaints.length,
      status:
        app.status === "APPROVED"
          ? "ACTIVE"
          : app.status === "PENDING_REVIEW"
            ? "PENDING_REVIEW"
            : "REJECTED",
    };
  });

  // Collect Destination entities from mockDestinationStore
  const destEntities: TrustEntitySummary[] = allDestinations.map((d) => {
    const reviews = mockReviewStore.getReviewsForDestination(d.name);
    const avgRating =
      reviews.length > 0
        ? (
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          ).toFixed(1)
        : undefined;
    const complaints = allComplaints.filter(
      (c) => c.targetRef === d.destinationId,
    );

    return {
      entityId: d.destinationId,
      entityType: "DESTINATION",
      name: d.name,
      locationOrBusiness: d.locationLabel,
      verificationLevelOrGuideStatus: `Verifikasi ${d.verificationLevel} ${d.guideReady ? "(Guide Ready ✓)" : ""}`,
      reviewAverage: avgRating,
      reviewCount: reviews.length,
      complaintCount: complaints.length,
      status: "ACTIVE",
    };
  });

  const allEntities = [...eoEntities, ...destEntities];
  const filtered =
    filterType === "ALL"
      ? allEntities
      : allEntities.filter((e) => e.entityType === filterType);

  const handleManualTrustInspect = (entity: TrustEntitySummary) => {
    const reason = window.prompt(
      `Masukkan catatan inspeksi tata kelola untuk ${entity.name}:`,
      "Inspeksi rutin kepatuhan standar mindful travel JedaIn.",
    );

    if (reason && reason.trim()) {
      mockAdminAuditStore.recordEvent({
        actorId: "admin_trust_demo",
        actorLabel: "Trust Operations Lead",
        actionType: "MANUAL_TRUST_ACTION",
        entityType: "TRUST_STATUS",
        entityId: entity.entityId,
        reason: reason.trim(),
        metadata: { entityName: entity.name, entityType: entity.entityType },
      });
      setRefreshVersion((v) => v + 1);
    }
  };

  return (
    <div className="admin-container" data-version={refreshVersion}>
      <header className="admin-page-header">
        <div>
          <Badge tone="info">Tata Kelola & Kepatuhan</Badge>
          <h1
            className="admin-page-title"
            style={{ marginTop: "var(--space-2)" }}
          >
            Trust & Status Pengawasan Mitra
          </h1>
          <p className="admin-page-subtitle">
            Inspeksi sinyal kepatuhan, rating pengalaman nyata, dan catatan
            aduan seluruh mitra EO dan destinasi.
          </p>
        </div>
      </header>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "var(--space-2)" }}>
        {(["ALL", "EO", "DESTINATION"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`eo-step-item ${filterType === t ? "eo-step-item--active" : ""}`}
            onClick={() => setFilterType(t)}
          >
            {t === "ALL"
              ? "Semua Mitra"
              : t === "EO"
                ? "Event Organizer"
                : "Destinasi"}
          </button>
        ))}
      </div>

      <section
        className="admin-section"
        aria-label="Tabel status pengawasan mitra"
      >
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nama Entitas Mitra</th>
                <th>Tipe Entitas</th>
                <th>Lokasi / Wilayah</th>
                <th>Status Verifikasi / Guide</th>
                <th>Rating Ulasan</th>
                <th>Aduan Masuk</th>
                <th>Status Kemitraan</th>
                <th>Aksi Pengawasan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={`${item.entityType}_${item.entityId}`}>
                  <td>
                    <strong>{item.name}</strong>
                    <div
                      style={{
                        fontSize: "var(--font-size-caption)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      ID: {item.entityId}
                    </div>
                  </td>
                  <td>
                    <Badge tone={item.entityType === "EO" ? "info" : "neutral"}>
                      {item.entityType}
                    </Badge>
                  </td>
                  <td>{item.locationOrBusiness}</td>
                  <td>{item.verificationLevelOrGuideStatus}</td>
                  <td>
                    {item.reviewAverage ? (
                      <span
                        style={{
                          color: "var(--color-sand-700)",
                          fontWeight: "bold",
                        }}
                      >
                        ★ {item.reviewAverage} ({item.reviewCount})
                      </span>
                    ) : (
                      <span
                        style={{
                          color: "var(--color-text-muted)",
                          fontSize: "var(--font-size-caption)",
                        }}
                      >
                        Belum ada ulasan
                      </span>
                    )}
                  </td>
                  <td>
                    <Badge
                      tone={item.complaintCount > 0 ? "warning" : "neutral"}
                    >
                      {item.complaintCount} Aduan
                    </Badge>
                  </td>
                  <td>
                    <Badge
                      tone={
                        item.status === "ACTIVE"
                          ? "success"
                          : item.status === "REJECTED"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {item.status}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleManualTrustInspect(item)}
                    >
                      Catat Inspeksi
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
