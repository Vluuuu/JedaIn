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
        <dt>HP / WhatsApp</dt>
        <dd>{guide.phone?.trim() || "Tidak diisi"}</dd>
        <dt>Domisili / desa asal</dt>
        <dd>{guide.domicile}</dd>
        <dt>Pengalaman menjadi pemandu</dt>
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
