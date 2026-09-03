import { useState } from "react";
import { Link } from "react-router";
import JedaInLogo from "../../JedaIn_logo_vector.svg";
import { LOGIN_ATMOSPHERE_VISUAL } from "../../lib/assets/packageImages";
import { SwipeJourneyControl } from "./SwipeJourneyControl";
import "./openingHero.css";

// ponytail: This neutral highland atmosphere SVG is the current ceiling until JedaIn owns a 2000px+ portrait-safe photograph with cleared usage rights.
const heroVisual = LOGIN_ATMOSPHERE_VISUAL;

export function OpeningHero() {
  const [exiting, setExiting] = useState(false);

  return (
    <section
      className={`opening-hero ${exiting ? "opening-hero--exiting" : ""}`}
      aria-labelledby="opening-hero-title"
    >
      <img
        className="opening-hero__image"
        src={heroVisual.svgDataUri}
        width="1000"
        height="800"
        alt=""
        aria-hidden="true"
        loading="eager"
        fetchPriority="high"
      />
      <div className="opening-hero__scrim" aria-hidden="true" />
      <div className="opening-hero__grain" aria-hidden="true" />

      <header className="opening-hero__topbar">
        <Link to="/" className="opening-hero__brand" aria-label="JedaIn">
          <img
            src={JedaInLogo}
            alt="JedaIn"
            className="opening-hero__logo"
            width="1407"
            height="768"
            loading="eager"
          />
        </Link>
        <Link
          to="/login"
          className="opening-hero__login-action"
          aria-label="Masuk ke akun Anda"
        >
          <span>Masuk</span>
        </Link>
      </header>

      <div className="opening-hero__content">
        <h1 id="opening-hero-title">
          <span>Temukan jeda</span>
          <span>yang benar-benar</span>
          <span>kamu butuhkan.</span>
        </h1>
      </div>

      <div className="opening-hero__control-wrap">
        <SwipeJourneyControl
          onComplete={() => setExiting(true)}
          targetRoute="/login"
        />
      </div>
    </section>
  );
}
