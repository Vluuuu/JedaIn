import { useState } from "react";
import { Button } from "../../components/ui";
import { partnerRegistrationRepository } from "../../data/partnerRegistrationRepository";

export function PartnerDemoApproval({
  onApproved,
}: {
  onApproved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  return (
    <div className="eo-section">
      <strong>Persetujuan untuk demo</strong>
      <p className="eo-form-helper">
        Simulasikan persetujuan Admin pada pengajuan ini untuk melanjutkan ke
        dashboard mitra.
      </p>
      {error && <p role="alert">{error}</p>}
      <Button
        type="button"
        variant="secondary"
        loading={busy}
        loadingLabel="Memproses persetujuan..."
        onClick={async () => {
          setBusy(true);
          setError(undefined);
          try {
            await partnerRegistrationRepository.approveDemo();
            onApproved();
          } catch (cause) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Persetujuan belum tersimpan. Coba lagi.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        Sudah di-ACC (Demo)
      </Button>
    </div>
  );
}

export function DemoAccountEmailNotice({ email }: { email?: string }) {
  if (!email) return null;
  return (
    <div className="eo-alert eo-alert--success" role="status">
      <strong>Simulasi email akun</strong>
      <p>
        Informasi akun sudah dikirim ke <strong>{email}</strong> dalam simulasi
        demo. Tidak ada email sungguhan yang dikirim. Gunakan email ini dan kata
        sandi saat pendaftaran untuk masuk kembali.
      </p>
    </div>
  );
}
