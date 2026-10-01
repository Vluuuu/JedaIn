import { useState, useSyncExternalStore } from "react";
import { Button } from "../../components/ui";
import { partnerRegistrationRepository } from "../../data/partnerRegistrationRepository";
import { partnerAccountCredentialsStore } from "./partnerAccountCredentialsStore";
import { partnerSessionStore } from "./partnerSessionStore";

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
        dashboard mitra. Email login @jedain.biz.id dan kata sandi dibuat oleh
        JedaIn setelah persetujuan.
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

export function DemoAccountEmailNotice({
  email,
  accountEmail,
}: {
  email?: string;
  accountEmail?: string;
}) {
  const current = useSyncExternalStore(
    partnerAccountCredentialsStore.subscribe,
    partnerAccountCredentialsStore.get,
  );
  const credentials =
    current?.partnerId === partnerSessionStore.get()?.id ? current : undefined;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  if (!email) return null;
  return (
    <div className="eo-section" aria-label="Akun mitra dari JedaIn">
      <h2>Akun mitra dari JedaIn</h2>
      {(credentials?.email || accountEmail) && (
        <dl>
          <dt>Email login</dt>
          <dd>
            <code>{credentials?.email ?? accountEmail}</code>
          </dd>
          {credentials && (
            <>
              <dt>Kata sandi</dt>
              <dd>
                <output aria-label="Kata sandi akun dari JedaIn">
                  <code>{credentials.password}</code>
                </output>
              </dd>
            </>
          )}
        </dl>
      )}
      <p className="eo-form-helper">
        Gunakan email login dan kata sandi dari JedaIn untuk masuk ke akun
        mitra. Simpan kata sandi yang ditampilkan saat penerbitan akun.
      </p>
      {!credentials && (
        <>
          <p className="eo-form-helper">
            Kata sandi tidak ditampilkan kembali setelah memuat ulang halaman.
            Terbitkan ulang jika belum disimpan.
          </p>
          {error && <p role="alert">{error}</p>}
          <Button
            type="button"
            variant="secondary"
            loading={busy}
            loadingLabel="Menerbitkan akun..."
            onClick={async () => {
              setBusy(true);
              setError(undefined);
              try {
                await partnerRegistrationRepository.approveDemo(true);
              } catch (cause) {
                setError(
                  cause instanceof Error
                    ? cause.message
                    : "Akun belum dapat diterbitkan. Coba lagi.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {accountEmail
              ? "Terbitkan ulang kata sandi (Demo)"
              : "Terbitkan akun JedaIn (Demo)"}
          </Button>
        </>
      )}
      <p>
        Pengiriman informasi akun ke email kontak <strong>{email}</strong>{" "}
        disimulasikan pada demo. Tidak ada email sungguhan yang dikirim.
      </p>
    </div>
  );
}
