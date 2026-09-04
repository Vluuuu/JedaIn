import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeftIcon } from "../../components/shells/icons";
import { mockContactVerificationStore } from "../contactVerification/mockContactVerificationStore";
import { sessionStore } from "../onboarding/sessionStore";
import "./profile.css";

export function ProfilePhoneVerificationScreen() {
  const navigate = useNavigate();
  const user = sessionStore.get().user;

  const [phone, setPhone] = useState(user?.phone ?? "");
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [otpCode, setOtpCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="profile-container profile-subpage">
        <p>Sesi tidak ditemukan. Silakan login kembali.</p>
      </div>
    );
  }

  const isAlreadyVerified = mockContactVerificationStore.isPhoneVerified(
    user.id,
    user.phone,
  );

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMessage("Masukkan nomor HP yang valid (minimal 8 digit).");
      return;
    }
    setErrorMessage(null);
    setStep("OTP");
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (otpCode.trim() !== "111111") {
      setErrorMessage(
        "Kode OTP tidak valid. Untuk prototype, gunakan kode 111111.",
      );
      return;
    }

    // Mark phone verified in store
    mockContactVerificationStore.markPhoneVerified(user.id, phone.trim());
    // Update session store phone if needed
    sessionStore.updateUserContact(phone.trim());
    navigate("/profile", { replace: true });
  };

  return (
    <div className="profile-container profile-subpage">
      <header className="profile-subpage-header">
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="profile-back-button"
          aria-label="Kembali ke profil"
        >
          <ArrowLeftIcon width={18} height={18} />
          <span>Kembali ke Profil</span>
        </button>
        <h1 className="profile-subpage-title">Verifikasi Nomor HP</h1>
        <p className="profile-subpage-lead">
          Verifikasi nomor HP agar kontak perjalananmu siap saat melakukan
          pemesanan.
        </p>
      </header>

      {isAlreadyVerified ? (
        <div className="profile-success-box">
          <p>Nomor HP ({user.phone}) sudah terverifikasi.</p>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="profile-save-button"
            style={{ marginTop: "1rem" }}
          >
            Kembali ke Profil
          </button>
        </div>
      ) : (
        <div className="profile-verify-phone-card">
          {errorMessage && (
            <div className="profile-error-box" role="alert">
              <p>{errorMessage}</p>
            </div>
          )}

          {step === "PHONE" ? (
            <form onSubmit={handleSendOtp} className="profile-settings-form">
              <div className="profile-settings-field">
                <label
                  htmlFor="verify-phone-input"
                  className="profile-settings-label"
                >
                  Nomor HP
                </label>
                <input
                  id="verify-phone-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="profile-settings-input"
                  required
                />
              </div>

              <p className="profile-verification-note">
                Untuk prototype, verifikasi nomor menggunakan kode demo di
                langkah berikutnya.
              </p>

              <button type="submit" className="profile-save-button">
                Lanjut ke Verifikasi
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="profile-settings-form">
              <p className="profile-verification-note">
                Gunakan kode demo berikut untuk menyelesaikan verifikasi nomor{" "}
                {phone}.
              </p>
              <div className="profile-demo-code-pill">
                <span>
                  Untuk prototype, gunakan kode <strong>111111</strong>.
                </span>
              </div>

              <div className="profile-settings-field">
                <label
                  htmlFor="verify-otp-input"
                  className="profile-settings-label"
                >
                  Masukkan 6 Digit Kode OTP
                </label>
                <input
                  id="verify-otp-input"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="111111"
                  className="profile-settings-input"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "center",
                }}
              >
                <button type="submit" className="profile-save-button">
                  Verifikasi Nomor
                </button>
                <button
                  type="button"
                  onClick={() => setStep("PHONE")}
                  className="profile-back-link-subtle"
                >
                  Ubah Nomor
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
