import type { LocalGuideIdentity } from "../eo/partnerRegistrationTypes";
import "./guideIdentitySummary.css";

export function GuideIdentitySummary({
  guide,
}: {
  guide?: LocalGuideIdentity;
}) {
  if (!guide) return null;
  return (
    <section
      className="guide-identity"
      aria-label="Identitas pemandu penanggung jawab"
    >
      <h2 className="guide-identity__title">
        Identitas pemandu penanggung jawab
      </h2>
      <div
        className={`guide-identity__content${guide.photoPreview ? " guide-identity__content--with-photo" : ""}`}
      >
        {guide.photoPreview && (
          <img
            className="guide-identity__photo"
            src={guide.photoPreview}
            alt={`Foto pemandu ${guide.fullName}`}
            width="96"
            height="96"
          />
        )}
        <dl className="guide-identity__facts">
          <div className="guide-identity__fact">
            <dt>Nama lengkap</dt>
            <dd>{guide.fullName}</dd>
          </div>
          <div className="guide-identity__fact">
            <dt>HP / WhatsApp</dt>
            <dd
              className={
                !guide.phone?.trim() ? "guide-identity__empty" : undefined
              }
            >
              {guide.phone?.trim() || "Tidak diisi"}
            </dd>
          </div>
          <div className="guide-identity__fact">
            <dt>Domisili / desa asal</dt>
            <dd>{guide.domicile}</dd>
          </div>
          <div className="guide-identity__fact guide-identity__fact--wide">
            <dt>Pengalaman menjadi pemandu</dt>
            <dd>{guide.experience}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
