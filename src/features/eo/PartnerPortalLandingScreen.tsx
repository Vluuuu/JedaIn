import { useState } from "react";
import { useNavigate } from "react-router";
import JedaInLogo from "../../JedaIn_logo_vector.svg";
import ExploreMascot from "../../assets/mascot/explore.png";
import { PartnerLoginScreen } from "./PartnerLoginScreen";
import "./partnerPortal.css";

export function PartnerPortalLandingScreen({
  destinationLogin = false,
}: {
  destinationLogin?: boolean;
}) {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(destinationLogin);
  return (
    <div className="partner-entry">
      <div className="partner-entry__masthead">
        <img src={JedaInLogo} alt="JedaIn" className="partner-entry__logo" />
        <span>
          {destinationLogin ? "Ruang kerja destinasi" : "Travel Organizer"}
        </span>
      </div>
      <main className="partner-entry__layout">
        <div className="partner-entry__intro">
          <span className="partner-entry__eyebrow">JedaIn</span>
          <h1>
            {destinationLogin
              ? "Kelola destinasi bersama JedaIn."
              : "Rancang perjalanan bersama JedaIn."}
          </h1>
          <p>
            {destinationLogin
              ? "Masuk dengan akun destinasi yang telah ditambahkan dan diverifikasi oleh Admin JedaIn."
              : "Kelola paket perjalanan, pilih destinasi terverifikasi, dan atur jadwal peserta dalam satu ruang kerja."}
          </p>
          <div className="partner-entry__scene" aria-hidden="true">
            <span className="partner-entry__sun" />
            <span className="partner-entry__hill partner-entry__hill--back" />
            <span className="partner-entry__hill partner-entry__hill--front" />
            <img src={ExploreMascot} alt="" />
          </div>
        </div>
        <div className="partner-entry__choice">
          {showLogin ? (
            <PartnerLoginScreen
              role={destinationLogin ? "DESTINATION" : "EO"}
              onBack={destinationLogin ? undefined : () => setShowLogin(false)}
              onRegister={
                destinationLogin
                  ? undefined
                  : () => navigate("/partner/apply/eo")
              }
            />
          ) : (
            <>
              <div className="partner-entry__choice-heading">
                <span className="partner-entry__eyebrow">
                  Ruang kerja penyelenggara
                </span>
                <h2>Travel Organizer</h2>
                <p>Masuk untuk mengelola paket dan jadwal perjalananmu.</p>
              </div>
              <div className="partner-entry__roles">
                <article className="partner-entry__role">
                  <h3>Kelola perjalanan</h3>
                  <p>
                    Buat paket, pilih titik keberangkatan, atur harga per orang,
                    dan buka jadwal sesi.
                  </p>
                  <div className="partner-entry__actions">
                    <button
                      type="button"
                      className="partner-entry__primary"
                      onClick={() => setShowLogin(true)}
                    >
                      Masuk sebagai TO
                    </button>
                    <button
                      type="button"
                      className="partner-entry__secondary"
                      onClick={() => navigate("/partner/apply/eo")}
                    >
                      Daftar sebagai TO
                    </button>
                  </div>
                </article>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
