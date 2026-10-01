import type { LocalGuideIdentity } from "../eo/partnerRegistrationTypes";

export function GuideIdentitySummary({
  guide,
}: {
  guide?: LocalGuideIdentity;
}) {
  if (!guide) return null;
  return (
    <section
      className="eo-section"
      aria-label="Identitas pemandu penanggung jawab"
    >
      <h2>Identitas pemandu penanggung jawab</h2>
      <dl>
        <dt>Nama lengkap</dt>
        <dd>{guide.fullName}</dd>
        <dt>WhatsApp</dt>
        <dd>{guide.phone}</dd>
        <dt>Domisili</dt>
        <dd>{guide.domicile}</dd>
        <dt>Pengalaman / sertifikasi</dt>
        <dd>{guide.experience}</dd>
      </dl>
      {guide.photoPreview && (
        <img
          src={guide.photoPreview}
          alt={`Foto pemandu ${guide.fullName}`}
          width="128"
          height="128"
          style={{ objectFit: "cover", borderRadius: "var(--radius-md)" }}
        />
      )}
    </section>
  );
}
