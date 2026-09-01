import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Badge, Button } from "../../components/ui";
import { mockApplicationStore } from "./mockApplicationStore";
import { partnerSessionStore } from "./partnerSessionStore";
import type { EoGuideStatus } from "./types";
import "./eo.css";

export function EoApplicationScreen() {
  const navigate = useNavigate();
  const existingPartner = partnerSessionStore.get();
  const existingApp = existingPartner
    ? mockApplicationStore.getBySellerId(existingPartner.id)
    : undefined;

  const [businessName, setBusinessName] = useState(
    existingApp?.businessName ?? existingPartner?.businessName ?? "",
  );
  const [contactPerson, setContactPerson] = useState(
    existingApp?.contactPerson ?? existingPartner?.name ?? "",
  );
  const [email, setEmail] = useState(
    existingApp?.email ?? existingPartner?.email ?? "organizer@wellness.id",
  );
  const [phone, setPhone] = useState(existingApp?.phone ?? "081234567890");
  const [city, setCity] = useState(existingApp?.city ?? "Batu / Malang");
  const [province] = useState(existingApp?.province ?? "Jawa Timur");
  const [experienceDescription, setExperienceDescription] = useState(
    existingApp?.experienceDescription ??
      "Berpengalaman menyelenggarakan open trip dan mindful walking tour di kawasan alam Jawa Timur.",
  );
  const [portfolioLink, setPortfolioLink] = useState(
    existingApp?.portfolioLink ?? "https://instagram.com/organizer_wellness",
  );
  const [yearsOfOperation, setYearsOfOperation] = useState<number>(
    existingApp?.yearsOfOperation ?? 2,
  );
  const [guideStatus, setGuideStatus] = useState<EoGuideStatus>(
    existingApp?.guideStatus ??
      existingPartner?.guideStatus ??
      "CERTIFIED_GUIDE",
  );
  const [certificateFileName, setCertificateFileName] = useState(
    existingApp?.guideCertificateDoc?.name ??
      "Sertifikat_Pemandu_BNSP_2026.pdf",
  );
  const [insuranceFileName, setInsuranceFileName] = useState(
    existingApp?.insuranceDoc?.name ?? "Polis_Asuransi_Perjalanan.pdf",
  );
  const [agreedToSop, setAgreedToSop] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(undefined);

    if (!agreedToSop) {
      setErrorMessage(
        "Wajib menyetujui standar operasional dan SOP kurasi JedaIn.",
      );
      return;
    }

    setIsSubmitting(true);
    const identityId = existingPartner?.id || `eo_${Date.now()}`;

    const res = mockApplicationStore.submitApplication({
      identityId,
      businessName,
      contactPerson,
      phone,
      email,
      province,
      city,
      experienceDescription,
      portfolioLink,
      yearsOfOperation,
      guideStatus,
      guideCertificateFileName:
        guideStatus === "CERTIFIED_GUIDE" ? certificateFileName : undefined,
      insuranceFileName,
      agreedToSop,
    });

    setIsSubmitting(false);

    if (res.success && res.application) {
      partnerSessionStore.setPartner({
        id: res.application.identityId,
        email: res.application.email,
        name: res.application.contactPerson,
        role: "EO",
        businessName: res.application.businessName,
        guideStatus: res.application.guideStatus,
      });
      navigate("/partner/application");
    } else {
      setErrorMessage(
        res.message ??
          "Pengajuan belum bisa diproses. Periksa kembali formulir.",
      );
    }
  };

  return (
    <div
      className="eo-container"
      style={{ padding: "var(--space-8) var(--space-4)", maxWidth: "760px" }}
    >
      <header className="eo-page-header">
        <div>
          <Badge tone="info">Formulir Kemitraan EO</Badge>
          <h1 className="eo-page-title" style={{ marginTop: "var(--space-2)" }}>
            Pengajuan Mitra Event Organizer (EO)
          </h1>
          <p className="eo-page-subtitle">
            Daftarkan entitas atau komunitasmu untuk mulai merancang wellness
            travel experience terkurasi.
          </p>
        </div>
      </header>

      {errorMessage && (
        <div className="eo-alert eo-alert--error" role="alert">
          <strong>Perhatian:</strong>
          <p>{errorMessage}</p>
        </div>
      )}

      <form className="eo-section" onSubmit={handleSubmit} noValidate>
        {/* 1. Basic Business Information */}
        <fieldset
          style={{
            border: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          <legend
            style={{
              fontSize: "var(--font-size-heading-sm)",
              fontWeight: "bold",
              marginBottom: "var(--space-3)",
              color: "var(--color-text-primary)",
            }}
          >
            1. Informasi Penyelenggara & Bisnis
          </legend>

          <div className="eo-form-group">
            <label htmlFor="eo-business-name" className="eo-form-label">
              Nama Usaha / Komunitas EO *
            </label>
            <input
              id="eo-business-name"
              type="text"
              required
              className="eo-form-input"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Contoh: Jeda Alam Nusantara"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-4)",
            }}
          >
            <div className="eo-form-group">
              <label htmlFor="eo-contact-person" className="eo-form-label">
                Nama Penanggung Jawab *
              </label>
              <input
                id="eo-contact-person"
                type="text"
                required
                className="eo-form-input"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </div>

            <div className="eo-form-group">
              <label htmlFor="eo-phone" className="eo-form-label">
                Nomor WhatsApp Aktif *
              </label>
              <input
                id="eo-phone"
                type="tel"
                required
                className="eo-form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-4)",
            }}
          >
            <div className="eo-form-group">
              <label htmlFor="eo-email" className="eo-form-label">
                Email Operasional *
              </label>
              <input
                id="eo-email"
                type="email"
                required
                className="eo-form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="eo-form-group">
              <label htmlFor="eo-city" className="eo-form-label">
                Kota / Wilayah Basis *
              </label>
              <input
                id="eo-city"
                type="text"
                required
                className="eo-form-input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Malang / Batu / Surabaya"
              />
            </div>
          </div>
        </fieldset>

        {/* 2. Guide & Operational Experience */}
        <fieldset
          style={{
            border: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
            borderTop: "1px solid var(--color-border-default)",
            paddingTop: "var(--space-5)",
          }}
        >
          <legend
            style={{
              fontSize: "var(--font-size-heading-sm)",
              fontWeight: "bold",
              marginBottom: "var(--space-3)",
              color: "var(--color-text-primary)",
            }}
          >
            2. Kompetensi Pemandu & Pengalaman
          </legend>

          <div className="eo-form-group">
            <label htmlFor="eo-guide-status" className="eo-form-label">
              Kategori Kesiapan Pemandu (Guide Status) *
            </label>
            <select
              id="eo-guide-status"
              className="eo-form-select"
              value={guideStatus}
              onChange={(e) => setGuideStatus(e.target.value as EoGuideStatus)}
            >
              <option value="CERTIFIED_GUIDE">
                Certified Guide (Memiliki sertifikasi kepemanduan / lisensi
                resmi)
              </option>
              <option value="CONCEPT_ONLY">
                Concept-Only (Perancang konsep — wajib memilih destinasi dengan
                Guide Ready)
              </option>
            </select>
            <span className="eo-form-helper">
              {guideStatus === "CERTIFIED_GUIDE"
                ? "Dapat merancang paket di seluruh destinasi terverifikasi BASIC maupun PLUS."
                : "Hanya dapat memilih destinasi yang memiliki pemandu lokal terlatih di lokasi (Guide Ready)."}
            </span>
          </div>

          <div className="eo-form-group">
            <label htmlFor="eo-desc" className="eo-form-label">
              Deskripsi Pengalaman & Filosofi Perjalanan *
            </label>
            <textarea
              id="eo-desc"
              rows={3}
              required
              className="eo-form-textarea"
              value={experienceDescription}
              onChange={(e) => setExperienceDescription(e.target.value)}
              placeholder="Jelaskan spesialisasi paket yang biasa dirancang (misal: mindful trekking, retreat hening, seni desa)..."
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-4)",
            }}
          >
            <div className="eo-form-group">
              <label htmlFor="eo-portfolio" className="eo-form-label">
                Tautan Portofolio / Media Sosial (Opsional)
              </label>
              <input
                id="eo-portfolio"
                type="url"
                className="eo-form-input"
                value={portfolioLink}
                onChange={(e) => setPortfolioLink(e.target.value)}
                placeholder="https://instagram.com/organizer"
              />
            </div>

            <div className="eo-form-group">
              <label htmlFor="eo-years" className="eo-form-label">
                Lama Beroperasi (Tahun)
              </label>
              <input
                id="eo-years"
                type="number"
                min={0}
                max={50}
                className="eo-form-input"
                value={yearsOfOperation}
                onChange={(e) =>
                  setYearsOfOperation(Number(e.target.value) || 0)
                }
              />
            </div>
          </div>
        </fieldset>

        {/* 3. Document Readiness (Prototype Metadata) */}
        <fieldset
          style={{
            border: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
            borderTop: "1px solid var(--color-border-default)",
            paddingTop: "var(--space-5)",
          }}
        >
          <legend
            style={{
              fontSize: "var(--font-size-heading-sm)",
              fontWeight: "bold",
              marginBottom: "var(--space-3)",
              color: "var(--color-text-primary)",
            }}
          >
            3. Dokumen & Kesiapan SOP
          </legend>

          {guideStatus === "CERTIFIED_GUIDE" && (
            <div className="eo-form-group">
              <label htmlFor="eo-cert-doc" className="eo-form-label">
                Sertifikat Kepemanduan (BNSP / Lisensi Daerah)
              </label>
              <input
                id="eo-cert-doc"
                type="text"
                className="eo-form-input"
                value={certificateFileName}
                onChange={(e) => setCertificateFileName(e.target.value)}
                placeholder="Nama berkas sertifikat..."
              />
              <span className="eo-form-helper">
                Prototype metadata simulasi dokumen kelayakan pemandu.
              </span>
            </div>
          )}

          <div className="eo-form-group">
            <label htmlFor="eo-insurance-doc" className="eo-form-label">
              Kesiapan Asuransi Perjalanan / SOP Keselamatan
            </label>
            <input
              id="eo-insurance-doc"
              type="text"
              className="eo-form-input"
              value={insuranceFileName}
              onChange={(e) => setInsuranceFileName(e.target.value)}
              placeholder="Nama berkas polis / SOP..."
            />
          </div>

          <div style={{ marginTop: "var(--space-2)" }}>
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--space-3)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                id="eo-sop-agree"
                checked={agreedToSop}
                onChange={(e) => setAgreedToSop(e.target.checked)}
                style={{
                  marginTop: "0.25rem",
                  width: "1.125rem",
                  height: "1.125rem",
                }}
              />
              <span
                style={{
                  fontSize: "var(--font-size-body-sm)",
                  color: "var(--color-text-primary)",
                }}
              >
                Saya menyatakan tunduk pada standar kurasi mindful travel
                JedaIn, menjamin transparansi harga, dan memprioritaskan
                keselamatan serta kelestarian alam lokasi destinasi.
              </span>
            </label>
          </div>
        </fieldset>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "var(--space-4)",
          }}
        >
          <Link
            to="/partner"
            style={{
              color: "var(--color-text-secondary)",
              fontSize: "var(--font-size-body-sm)",
            }}
          >
            &larr; Kembali ke Portal Partner
          </Link>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            loadingLabel="Mengirim Pengajuan..."
          >
            Kirim Pengajuan Kemitraan
          </Button>
        </div>
      </form>
    </div>
  );
}
