import { Badge } from "../../components/ui";
import { getDestinationVisual } from "../../lib/assets/packageImages";
import type { EoSessionStatus } from "../eo/types";
import { resolveAuthenticatedDestinationContext } from "./destinationContext";
import {
  destinationSessionStatusLabels,
  getDestinationOverviewData,
} from "./destinationOverviewData";
import "./destination.css";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Jakarta",
});

const reviewDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

const statusTones: Record<
  EoSessionStatus,
  "success" | "warning" | "neutral" | "danger"
> = {
  OPEN: "success",
  FULL: "warning",
  CLOSED: "neutral",
  CANCELLED: "danger",
};

const formatCurrency = (value: number) => `Rp${value.toLocaleString("id-ID")}`;

export function DestinationOverviewScreen() {
  const context = resolveAuthenticatedDestinationContext();
  if (!context) {
    return (
      <div className="dest-container dest-unavailable">
        <div className="admin-alert admin-alert--warning">
          <h2>Data Destinasi Tidak Tersedia</h2>
          <p>
            Data operasional destinasi tidak tersedia untuk akun ini atau belum
            disetujui.
          </p>
        </div>
      </div>
    );
  }

  const { destination, partner, application } = context;
  const data = getDestinationOverviewData(destination);
  const verificationLabel =
    destination.verificationLevel === "PLUS"
      ? "Terverifikasi Plus"
      : "Terverifikasi Dasar";
  const visual = getDestinationVisual(destination.name);

  return (
    <div className="dest-container dest-overview">
      <header className="dest-identity">
        <div className="dest-identity__content">
          <div className="dest-identity__heading">
            <h1 className="dest-page-title">{destination.name}</h1>
            <p className="dest-identity__location">
              {destination.locationLabel}
            </p>
          </div>

          <p className="dest-identity__manager">
            <span>Pengelola</span>
            <strong>
              {application.managementName ??
                partner.businessName ??
                "Pengelola kawasan"}
            </strong>
          </p>

          <div className="dest-identity__badges" aria-label="Status destinasi">
            <Badge tone="success" showSymbol={false}>
              {verificationLabel}
            </Badge>
            <Badge tone="neutral" showSymbol={false}>
              Pemandu lokal tersedia
            </Badge>
          </div>
        </div>

        <div className="dest-identity__media" aria-hidden="true">
          <img src={visual.svgDataUri} alt="" />
        </div>
      </header>

      <section
        className="dest-metric-band"
        aria-label="Ringkasan operasional destinasi"
      >
        <div className="dest-metric-item">
          <span className="dest-metric-label">Jadwal Mendatang</span>
          <strong className="dest-metric-value">
            {data.upcomingSessions.length}
          </strong>
          <span className="dest-metric-desc">Sesi di destinasi ini</span>
        </div>

        <div className="dest-metric-item">
          <span className="dest-metric-label">Peserta Terkonfirmasi</span>
          <strong className="dest-metric-value">
            {data.confirmedParticipants}
          </strong>
          <span className="dest-metric-desc">
            Dari pembayaran terkonfirmasi
          </span>
        </div>

        <div className="dest-metric-item">
          <span className="dest-metric-label">Kapasitas per Sesi</span>
          <strong className="dest-metric-value">
            {destination.capacityPerSession}
          </strong>
          <span className="dest-metric-desc">Orang per sesi</span>
        </div>

        <div className="dest-metric-item">
          <span className="dest-metric-label">Rating Destinasi</span>
          <strong
            className={`dest-metric-value${data.averageRating ? "" : " dest-metric-value--empty"}`}
          >
            {data.averageRating ? `${data.averageRating} / 5` : "Belum ada"}
          </strong>
          <span className="dest-metric-desc">
            {data.reviews.length > 0
              ? `${data.reviews.length} ulasan destinasi`
              : "Belum ada ulasan traveler"}
          </span>
        </div>
      </section>

      <div className="dest-readiness-layout">
        <section className="dest-readiness" aria-labelledby="dest-status-title">
          <div className="dest-section-heading">
            <div>
              <h2 id="dest-status-title">Status Destinasi</h2>
              <p>
                Kesiapan yang digunakan JedaIn untuk operasional pengalaman.
              </p>
            </div>
            <span className="dest-readiness__completeness">
              {data.profileCompletedItems}/{data.profileTotalItems} informasi
              lengkap
            </span>
          </div>

          <dl className="dest-readiness__facts">
            <div>
              <dt>Status Verifikasi</dt>
              <dd>{verificationLabel}</dd>
            </div>
            <div>
              <dt>Pemanduan Lokal</dt>
              <dd>Pemandu lokal tersedia</dd>
            </div>
            <div>
              <dt>Biaya Dasar</dt>
              <dd>{formatCurrency(destination.baseCostPerPerson)} / orang</dd>
            </div>
            <div>
              <dt>Kapasitas</dt>
              <dd>{destination.capacityPerSession} orang / sesi</dd>
            </div>
          </dl>
        </section>

        <aside className="dest-partners" aria-labelledby="dest-partners-title">
          <span className="dest-partners__label">Kolaborasi EO</span>
          <h2 id="dest-partners-title">Pengalaman yang hadir di sini</h2>
          {data.eoPartners.length > 0 ? (
            <>
              <strong className="dest-partners__count">
                {data.eoPartners.length} EO aktif
              </strong>
              <ul className="dest-partners__list">
                {data.eoPartners.map((eoName) => (
                  <li key={eoName}>{eoName}</li>
                ))}
              </ul>
              <p>
                EO merancang experience, destinasi menyiapkan ruang dan
                pemanduan, traveler hadir melalui sesi terjadwal.
              </p>
            </>
          ) : (
            <p className="dest-partners__empty">
              Belum ada EO dengan jadwal mendatang di destinasi ini.
            </p>
          )}
        </aside>
      </div>

      <section className="dest-sessions" aria-labelledby="dest-sessions-title">
        <div className="dest-section-heading dest-section-heading--sessions">
          <div>
            <h2 id="dest-sessions-title">Jadwal Keberangkatan Mendatang</h2>
            <p>
              Pantau experience dari EO yang akan berlangsung di destinasi ini.
            </p>
          </div>
          <span className="dest-section-heading__summary">
            Kapasitas operasional destinasi: {destination.capacityPerSession}
            orang
          </span>
        </div>

        {data.upcomingSessions.length === 0 ? (
          <div className="dest-empty-state">
            <strong>Belum ada jadwal keberangkatan mendatang.</strong>
            <p>
              Sesi akan muncul di sini saat EO menjadwalkan experience di
              destinasi ini.
            </p>
          </div>
        ) : (
          <div className="dest-session-list">
            {data.upcomingSessions.map(
              ({
                session,
                package: pkg,
                confirmedParticipants,
                operationalCapacity,
                usagePercent,
                exceedsDestinationCapacity,
              }) => (
                <article className="dest-session-row" key={session.sessionId}>
                  <time
                    className="dest-session-row__date"
                    dateTime={session.startAt}
                  >
                    <strong>
                      {dateFormatter.format(new Date(session.startAt))}
                    </strong>
                    <span>
                      {timeFormatter.format(new Date(session.startAt))} -{" "}
                      {timeFormatter.format(new Date(session.endAt))} WIB
                    </span>
                  </time>

                  <div className="dest-session-row__experience">
                    <h3>{pkg.title}</h3>
                    <p>
                      Diselenggarakan oleh <strong>{pkg.eoDisplayName}</strong>
                    </p>
                  </div>

                  <div className="dest-session-row__capacity">
                    <div className="dest-session-row__capacity-copy">
                      <span>
                        <strong>{confirmedParticipants}</strong> peserta
                        terkonfirmasi
                      </span>
                      <span>{operationalCapacity} kapasitas operasional</span>
                    </div>
                    <progress
                      max={operationalCapacity}
                      value={Math.min(
                        confirmedParticipants,
                        operationalCapacity,
                      )}
                      aria-label={`${confirmedParticipants} dari ${operationalCapacity} kapasitas operasional destinasi`}
                    />
                    <span className="dest-session-row__capacity-note">
                      {exceedsDestinationCapacity
                        ? `Alokasi EO ${session.capacity} orang melebihi kapasitas destinasi.`
                        : `${usagePercent}% kapasitas destinasi terisi`}
                    </span>
                  </div>

                  <div className="dest-session-row__status">
                    <Badge
                      tone={statusTones[session.status]}
                      showSymbol={false}
                    >
                      {destinationSessionStatusLabels[session.status]}
                    </Badge>
                    <span>Alokasi sesi {session.capacity} orang</span>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>

      <section className="dest-profile" aria-labelledby="dest-profile-title">
        <div className="dest-section-heading">
          <div>
            <h2 id="dest-profile-title">Profil Destinasi</h2>
            <p>Informasi yang dipahami dan digunakan oleh EO serta JedaIn.</p>
          </div>
          <span className="dest-section-heading__summary">
            {destination.city}, {destination.province}
          </span>
        </div>

        <div className="dest-profile__grid">
          <div className="dest-profile__about">
            <h3>Tentang Destinasi</h3>
            <p>{destination.description}</p>

            {destination.availableActivities?.length ? (
              <div className="dest-profile__group">
                <h3>Aktivitas Tersedia</h3>
                <ul className="dest-profile__tag-list">
                  {destination.availableActivities.map((activity) => (
                    <li key={activity}>{activity.replace(/&/g, "dan")}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {destination.localGuideSummary ? (
              <div className="dest-profile__guide">
                <h3>Pemanduan Lokal</h3>
                <p>{destination.localGuideSummary}</p>
              </div>
            ) : null}
          </div>

          <div className="dest-profile__operations">
            {destination.facilities?.length ? (
              <div className="dest-profile__group">
                <h3>Fasilitas</h3>
                <ul className="dest-profile__plain-list">
                  {destination.facilities.map((facility) => (
                    <li key={facility}>{facility}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {destination.operationalNotes?.length ? (
              <div className="dest-profile__group">
                <h3>Catatan Operasional</h3>
                <ul className="dest-profile__plain-list">
                  {destination.operationalNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <dl className="dest-profile__commercial">
              <div>
                <dt>Biaya dasar</dt>
                <dd>{formatCurrency(destination.baseCostPerPerson)} / orang</dd>
              </div>
              <div>
                <dt>Kapasitas destinasi</dt>
                <dd>{destination.capacityPerSession} orang / sesi</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="dest-reviews" aria-labelledby="dest-reviews-title">
        <div className="dest-section-heading">
          <div>
            <h2 id="dest-reviews-title">Ulasan Traveler</h2>
            <p>
              Penilaian khusus untuk kualitas destinasi, terpisah dari penilaian
              EO dan pemandu.
            </p>
          </div>
        </div>

        {data.reviews.length === 0 ? (
          <div className="dest-empty-state">
            <strong>Belum ada ulasan destinasi.</strong>
            <p>
              Ulasan akan muncul setelah traveler menyelesaikan trip dan menilai
              destinasi ini.
            </p>
          </div>
        ) : (
          <div className="dest-reviews__layout">
            <div className="dest-reviews__summary">
              <strong>{data.averageRating}</strong>
              <span>/ 5</span>
              <p>{data.reviews.length} ulasan destinasi</p>
            </div>
            <div className="dest-reviews__list">
              {data.latestReviews.map((review) => (
                <article className="dest-review-card" key={review.reviewId}>
                  <div className="dest-review-card__meta">
                    <strong aria-label={`${review.rating} dari 5 bintang`}>
                      {review.rating} / 5
                    </strong>
                    <time dateTime={review.createdAt}>
                      {reviewDateFormatter.format(new Date(review.createdAt))}
                    </time>
                  </div>
                  <p>
                    {review.comment ?? "Traveler tidak menambahkan komentar."}
                  </p>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
