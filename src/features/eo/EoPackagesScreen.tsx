import { useState } from "react";
import { useNavigate } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockDestinationStore } from "./mockDestinationStore";
import { mockEoPackageStore } from "./mockEoPackageStore";
import { getHumanStatusLabel, getStatusBadgeTone } from "./packageHelpers";
import { partnerSessionStore } from "./partnerSessionStore";
import type { EoPackageRecord, EoPackageStatus } from "./types";
import "./eo.css";

interface StatusConfig {
  key: "ALL" | EoPackageStatus;
  label: string;
}

const STATUS_TABS: StatusConfig[] = [
  { key: "ALL", label: "Semua" },
  { key: "DRAFT", label: "Draf" },
  { key: "PENDING_ADMIN_REVIEW", label: "Menunggu Review" },
  { key: "REJECTED", label: "Perlu Perbaikan" },
  { key: "APPROVED", label: "Disetujui" },
  { key: "LIVE", label: "Live" },
];

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

  const renderPackageActions = (pkg: EoPackageRecord) => {
    switch (pkg.status) {
      case "DRAFT":
        return (
          <div className="eo-pkg-actions">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() =>
                navigate(`/partner/eo/packages/new?draftId=${pkg.packageId}`)
              }
            >
              Lanjut Edit
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/partner/eo/packages/${pkg.packageId}`)}
            >
              Lihat Detail
            </Button>
          </div>
        );
      case "PENDING_ADMIN_REVIEW":
        return (
          <div className="eo-pkg-actions">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/partner/eo/packages/${pkg.packageId}`)}
            >
              Lihat Status
            </Button>
          </div>
        );
      case "REJECTED":
        return (
          <div className="eo-pkg-actions">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() =>
                navigate(`/partner/eo/packages/new?draftId=${pkg.packageId}`)
              }
            >
              Perbaiki Paket
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/partner/eo/packages/${pkg.packageId}`)}
            >
              Lihat Catatan
            </Button>
          </div>
        );
      case "APPROVED":
        return (
          <div className="eo-pkg-actions">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => navigate(`/partner/eo/packages/${pkg.packageId}`)}
            >
              Publish ke Marketplace
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                navigate(`/partner/eo/packages/${pkg.packageId}/sessions`)
              }
            >
              Atur Jadwal
            </Button>
          </div>
        );
      case "LIVE":
        return (
          <div className="eo-pkg-actions">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() =>
                navigate(`/partner/eo/packages/${pkg.packageId}/sessions`)
              }
            >
              Atur Jadwal
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/partner/eo/packages/${pkg.packageId}`)}
            >
              Lihat Paket
            </Button>
          </div>
        );
    }
  };

  const renderStatusContext = (pkg: EoPackageRecord) => {
    switch (pkg.status) {
      case "DRAFT":
        return (
          <div className="eo-pkg-card__status-context">
            <span className="eo-pkg-card__status-msg">
              Belum diajukan untuk review.
            </span>
            <span className="eo-pkg-card__status-date">
              Terakhir diperbarui{" "}
              {new Date(pkg.updatedAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        );
      case "PENDING_ADMIN_REVIEW":
        return (
          <div className="eo-pkg-card__status-context">
            <span className="eo-pkg-card__status-msg">
              Sedang ditinjau Admin JedaIn.
            </span>
            {pkg.submittedAt && (
              <span className="eo-pkg-card__status-date">
                Diajukan{" "}
                {new Date(pkg.submittedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        );
      case "REJECTED":
        return (
          <div className="eo-pkg-card__status-context">
            <span className="eo-pkg-card__status-msg eo-pkg-card__status-msg--warning">
              {pkg.rejectionReason
                ? `Catatan: ${pkg.rejectionReason}`
                : "Perlu penyesuaian sebelum diajukan kembali."}
            </span>
            {pkg.reviewedAt && (
              <span className="eo-pkg-card__status-date">
                Ditinjau{" "}
                {new Date(pkg.reviewedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        );
      case "APPROVED":
        return (
          <div className="eo-pkg-card__status-context">
            <span className="eo-pkg-card__status-msg">
              Siap dipublikasikan ke marketplace.
            </span>
            {pkg.reviewedAt && (
              <span className="eo-pkg-card__status-date">
                Disetujui{" "}
                {new Date(pkg.reviewedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        );
      case "LIVE": {
        const pkgSessions = mockEoPackageStore.getSessionsByPackage(
          pkg.packageId,
        );
        const openSessionsCount = pkgSessions.filter(
          (s) => s.status === "OPEN",
        ).length;
        return (
          <div className="eo-pkg-card__status-context">
            <span className="eo-pkg-card__status-msg">Tayang ke traveler.</span>
            <span className="eo-pkg-card__status-date">
              {openSessionsCount > 0
                ? `${openSessionsCount} jadwal keberangkatan mendatang`
                : "Belum ada jadwal buka"}
            </span>
          </div>
        );
      }
    }
  };

  return (
    <div className="eo-packages-container">
      {/* 1. Header */}
      <header className="eo-packages-header">
        <div className="eo-packages-header__main">
          <h1>Paket Experience</h1>
          <p className="eo-packages-header__subtitle">
            Kelola experience dari draf hingga tayang ke traveler.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => navigate("/partner/eo/packages/new")}
        >
          + Buat Paket Baru
        </Button>
      </header>

      {/* 2. Segmented Lifecycle Filter Navigation */}
      <nav
        className="eo-packages-filter"
        aria-label="Filter status paket experience"
      >
        <div className="eo-packages-filter__track">
          {STATUS_TABS.map((tab) => {
            const count =
              tab.key === "ALL"
                ? allPackages.length
                : allPackages.filter((p) => p.status === tab.key).length;
            const isActive = filterStatus === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                className={`eo-packages-filter__tab ${
                  isActive ? "eo-packages-filter__tab--active" : ""
                }`}
                onClick={() => setFilterStatus(tab.key)}
                aria-selected={isActive}
                role="tab"
              >
                <span>{tab.label}</span>
                <span className="eo-packages-filter__badge">{count}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 3. Package Collection */}
      <section
        className="eo-packages-collection"
        aria-label="Daftar paket experience"
      >
        {allPackages.length === 0 ? (
          /* Entirely empty account state */
          <div className="eo-packages-empty-state">
            <div className="eo-packages-empty-state__icon" aria-hidden="true">
              🌿
            </div>
            <h2>Kamu belum punya paket experience.</h2>
            <p>
              Mulai rancang paket pertamamu dari inspirasi kebutuhan traveler
              atau buat experience mandiri.
            </p>
            <div className="eo-packages-empty-state__actions">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => navigate("/partner/eo/packages/new")}
              >
                Buat Paket Pertama
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => navigate("/partner/eo/insights")}
              >
                Lihat Insight
              </Button>
            </div>
          </div>
        ) : filteredPackages.length === 0 ? (
          /* Filtered state empty */
          <div className="eo-packages-empty-filter">
            <p>Belum ada paket dengan status ini.</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setFilterStatus("ALL")}
            >
              Lihat Semua Paket
            </Button>
          </div>
        ) : (
          <div className="eo-packages-list">
            {filteredPackages.map((pkg) => {
              const destination = mockDestinationStore.getById(
                pkg.destinationId,
              );
              const destinationImg = destination?.imageUrl;

              return (
                <article
                  key={pkg.packageId}
                  className="eo-pkg-card"
                  aria-label={`Paket: ${pkg.title}`}
                >
                  {/* Visual Context: Source-backed destination image */}
                  <div className="eo-pkg-card__media">
                    {destinationImg ? (
                      <img
                        src={destinationImg}
                        alt={`Destinasi ${destination?.name ?? "paket"}`}
                        className="eo-pkg-card__img"
                      />
                    ) : (
                      <div className="eo-pkg-card__img-placeholder" />
                    )}
                  </div>

                  {/* Main Context: Identity, Destination, Duration */}
                  <div className="eo-pkg-card__body">
                    <div className="eo-pkg-card__header-row">
                      <div>
                        <h2 className="eo-pkg-card__title">
                          {pkg.title || "Draf Tanpa Judul"}
                        </h2>
                        <p className="eo-pkg-card__summary">
                          {pkg.valueProposition || pkg.shortSummary}
                        </p>
                      </div>

                      <div className="eo-pkg-card__status-col">
                        <Badge tone={getStatusBadgeTone(pkg.status)}>
                          {getHumanStatusLabel(pkg.status)}
                        </Badge>
                        {renderStatusContext(pkg)}
                      </div>
                    </div>

                    {/* Metadata & Commercial row */}
                    <div className="eo-pkg-card__footer-row">
                      <div className="eo-pkg-card__meta">
                        {destination && (
                          <span className="eo-pkg-card__meta-item">
                            <strong className="eo-pkg-card__dest-name">
                              {destination.name}
                            </strong>
                            <span className="eo-pkg-card__dest-loc">
                              {destination.locationLabel}
                            </span>
                          </span>
                        )}
                        <span className="eo-pkg-card__meta-item eo-pkg-card__duration">
                          {pkg.durationLabel}
                        </span>
                        <span className="eo-pkg-card__meta-item eo-pkg-card__price">
                          <strong>
                            Rp
                            {pkg.pricing.customerPrice.toLocaleString("id-ID")}
                          </strong>{" "}
                          / orang
                        </span>
                      </div>

                      {/* State-specific actions */}
                      {renderPackageActions(pkg)}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
