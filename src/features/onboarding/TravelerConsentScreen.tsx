import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Badge, Button, Checkbox, Dialog } from "../../components/ui";
import {
  ArrowLeftIcon,
  CompassTargetIcon,
  DemandInsightIcon,
  SparklesProductIcon,
} from "./icons";
import { defaultOnboardingAdapter } from "./mockAdapter";
import type { OnboardingAdapter } from "./types";
import "./consent.css";

export interface TravelerConsentScreenProps {
  adapter?: OnboardingAdapter;
  onSuccess?: () => void;
  onBack?: () => void;
}

export function TravelerConsentScreen({
  adapter = defaultOnboardingAdapter,
  onSuccess,
  onBack,
}: TravelerConsentScreenProps) {
  const navigate = useNavigate();

  const [hasAgreed, setHasAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!hasAgreed || isSubmitting) return;

    setErrorMessage(undefined);
    setIsSubmitting(true);

    try {
      await adapter.submitConsent();
      setIsSubmitting(false);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/onboarding/quiz");
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan persetujuan data. Silakan coba lagi.",
      );
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="consent-container">
      <div className="consent-card">
        <div className="consent-topbar">
          <button
            type="button"
            className="consent-back-button"
            onClick={handleBack}
            aria-label="Kembali"
          >
            <ArrowLeftIcon />
            <span>Kembali</span>
          </button>
          <Badge tone="info">Langkah 1 dari 2</Badge>
        </div>

        <header className="consent-header">
          <h1>Persetujuan Penggunaan Data Preferensi</h1>
          <p>
            Sebelum kami membantu merancang jeda terbaikmu, pahami bagaimana
            jawaban dan preferensimu akan digunakan oleh JedaIn.
          </p>
        </header>

        {errorMessage && (
          <div className="consent-error-banner" role="alert">
            <p>{errorMessage}</p>
          </div>
        )}

        <div className="consent-purposes">
          <div className="consent-purpose-row">
            <div className="consent-purpose-row__icon">
              <CompassTargetIcon />
            </div>
            <div className="consent-purpose-row__content">
              <strong>Rekomendasi Personal</strong>
              <p>
                Mencocokkan gaya jeda, durasi, budget, dan minat aktivitasmu
                dengan paket wellness yang paling relevan.
              </p>
            </div>
          </div>

          <div className="consent-purpose-row">
            <div className="consent-purpose-row__icon">
              <DemandInsightIcon />
            </div>
            <div className="consent-purpose-row__content">
              <strong>Wawasan Kebutuhan Agregat</strong>
              <p>
                Membantu mitra pengelola destinasi dan organizer memahami tren
                kebutuhan jeda secara anonim dan agregat.
              </p>
            </div>
          </div>

          <div className="consent-purpose-row">
            <div className="consent-purpose-row__icon">
              <SparklesProductIcon />
            </div>
            <div className="consent-purpose-row__content">
              <strong>Penyempurnaan Layanan</strong>
              <p>
                Meningkatkan akurasi kurasi destinasi serta menghadirkan variasi
                jeda yang semakin tepat sasaran.
              </p>
            </div>
          </div>
        </div>

        <form className="consent-form" onSubmit={handleSubmit} noValidate>
          <div className="consent-checkbox-wrapper">
            <Checkbox
              id="traveler-consent-checkbox"
              label="Saya menyetujui data preferensi saya digunakan untuk rekomendasi personal, wawasan permintaan agregat, dan penyempurnaan layanan JedaIn."
              checked={hasAgreed}
              onChange={(e) => {
                setHasAgreed(e.target.checked);
                if (errorMessage) setErrorMessage(undefined);
              }}
              disabled={isSubmitting}
            />
            <div className="consent-privacy-action">
              <button
                type="button"
                className="consent-privacy-link"
                onClick={() => setShowPrivacyDialog(true)}
              >
                Pelajari rincian penggunaan data &rarr;
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!hasAgreed || isSubmitting}
            loading={isSubmitting}
            loadingLabel="Menyimpan persetujuan..."
            className="consent-submit-button"
          >
            Setuju & Lanjut
          </Button>
        </form>
      </div>

      <Dialog
        open={showPrivacyDialog}
        title="Penggunaan Data Preferensi"
        description="Ringkasan tujuan pemrosesan data preferensi traveler."
        onClose={() => setShowPrivacyDialog(false)}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowPrivacyDialog(false)}
          >
            Mengerti
          </Button>
        }
      >
        <p className="consent-dialog-text">
          Data preferensi yang Anda isi saat onboarding digunakan khusus untuk:
        </p>
        <ul className="consent-dialog-list">
          <li>
            <strong>Rekomendasi personal:</strong> menyajikan paket trip yang
            sesuai dengan preferensi budget, waktu, dan aktivitas jeda Anda.
          </li>
          <li>
            <strong>Wawasan permintaan agregat:</strong> diolah secara kolektif
            tanpa mengidentifikasi profil individu guna membantu perancangan
            rute oleh mitra.
          </li>
          <li>
            <strong>Penyempurnaan produk:</strong> mengoptimalkan pengalaman
            aplikasi JedaIn.
          </li>
        </ul>
        <p className="consent-dialog-text">
          Dokumen kebijakan privasi lengkap akan difinalkan sebelum rilis
          operasional penuh.
        </p>
      </Dialog>
    </div>
  );
}
