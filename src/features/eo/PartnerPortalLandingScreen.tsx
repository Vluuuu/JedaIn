import { useState } from "react";
import { useNavigate } from "react-router";
import JedaInLogo from "../../JedaIn_logo_vector.svg";
import ExploreMascot from "../../assets/mascot/explore.png";
import PlanMascot from "../../assets/mascot/plan.png";
import { generateUniqueDestinationPartnerId } from "../destination/destinationContext";
import { partnerSessionStore } from "./partnerSessionStore";
import { PartnerLoginScreen } from "./PartnerLoginScreen";
import "./partnerPortal.css";

type PartnerRole = "EO" | "DESTINATION";

export function PartnerPortalLandingScreen() {
  const navigate = useNavigate();
  const [loginRole, setLoginRole] = useState<PartnerRole | null>(null);

  const register = (role: PartnerRole) => {
    if (role === "EO") {
      navigate("/partner/apply/eo");
      return;
    }
    if (partnerSessionStore.get()?.role !== "DESTINATION") {
      partnerSessionStore.setPartner({
        id: generateUniqueDestinationPartnerId("mitra.destinasi@jedain.id"),
        email: "mitra.destinasi@jedain.id",
        name: "Mitra Destinasi Baru",
        role: "DESTINATION",
        businessName: "Pengelola Kawasan Destinasi",
      });
    }
    navigate("/partner/apply/destination");
  };

  return (
    <div className="partner-entry">
      <div className="partner-entry__masthead">
        <img src={JedaInLogo} alt="JedaIn" className="partner-entry__logo" />
        <span>Ruang kerja mitra</span>
      </div>
      <main className="partner-entry__layout">
        <div className="partner-entry__intro">
          <span className="partner-entry__eyebrow">Bertemu di titik jeda</span>
          <h1>Perjalanan yang berarti, dirancang bersama.</h1>
          <p>
            Bawa keahlianmu sebagai Travel Organizer atau pesona tempatmu
            sebagai Mitra Destinasi. JedaIn membantu keduanya bertemu dalam
            pengalaman yang lebih tenang dan terarah.
          </p>
          <div className="partner-entry__scene" aria-hidden="true">
            <span className="partner-entry__sun" />
            <span className="partner-entry__hill partner-entry__hill--back" />
            <span className="partner-entry__hill partner-entry__hill--front" />
            <img src={ExploreMascot} alt="" />
          </div>
        </div>
        <div className="partner-entry__choice">
          {loginRole ? (
            <PartnerLoginScreen
              role={loginRole}
              onBack={() => setLoginRole(null)}
              onRegister={() => register(loginRole)}
            />
          ) : (
            <>
              <div className="partner-entry__choice-heading">
                <span className="partner-entry__eyebrow">Pilih peranmu</span>
                <h2>Mari tumbuh bersama JedaIn</h2>
                <p>
                  Dua peran, satu tujuan: memberi ruang untuk berhenti sejenak.
                </p>
              </div>
              <div className="partner-entry__roles">
                <article className="partner-entry__role">
                  <span className="partner-entry__role-number">
                    01 / Perancang pengalaman
                  </span>
                  <h3>Travel Organizer</h3>
                  <p>
                    Rancang perjalanan mindful, atur paket dan jadwal, lalu
                    temukan destinasi yang tepat untuk traveler.
                  </p>
                  <div className="partner-entry__actions">
                    <button
                      type="button"
                      className="partner-entry__primary"
                      onClick={() => setLoginRole("EO")}
                    >
                      Masuk sebagai TO
                    </button>
                  </div>
                </article>
                <article className="partner-entry__role">
                  <span className="partner-entry__role-number">
                    02 / Penjaga tempat
                  </span>
                  <h3>Mitra Destinasi</h3>
                  <p>
                    Kenalkan ruang alam dan aktivitas lokalmu kepada Travel
                    Organizer yang ingin menghadirkan pengalaman bermakna.
                  </p>
                  <div className="partner-entry__actions">
                    <button
                      type="button"
                      className="partner-entry__primary"
                      onClick={() => setLoginRole("DESTINATION")}
                    >
                      Masuk sebagai Mitra Destinasi
                    </button>
                  </div>
                </article>
              </div>
              <img
                src={PlanMascot}
                alt=""
                aria-hidden="true"
                className="partner-entry__corner-mascot"
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
