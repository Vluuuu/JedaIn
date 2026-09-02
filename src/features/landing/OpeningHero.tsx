import { Link } from "react-router";
import { LOGIN_ATMOSPHERE_VISUAL } from "../../lib/assets/packageImages";
import "./openingHero.css";

// ponytail: This neutral prototype visual is the ceiling until JedaIn owns a 2000px+ portrait-safe highland photograph with cleared usage rights.
const heroVisual = LOGIN_ATMOSPHERE_VISUAL;

export function OpeningHero() {
  return (
    <section className="opening-hero" aria-labelledby="opening-hero-title">
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

      <div className="opening-hero__content">
        <p className="opening-hero__eyebrow">Jeda yang lebih personal</p>
        <h1 id="opening-hero-title">
          <span>Temukan jeda</span>
          <span>yang benar-benar</span>
          <span>kamu butuhkan.</span>
        </h1>
        <p className="opening-hero__support">
          Temukan experience lokal yang dikurasi berdasarkan apa yang sedang
          kamu butuhkan.
        </p>
        <Link className="opening-hero__secondary" to="/explore">
          Jelajahi Experience
        </Link>
      </div>

      <Link
        className="journey-cta"
        to="/login"
        aria-label="Mulai temukan jeda personal"
      >
        <span className="journey-cta__label" aria-hidden="true">
          Temukan Jeda
        </span>
        <span className="journey-cta__control" aria-hidden="true">
          <span>Mulai</span>
          <span className="journey-cta__arrow">↓</span>
        </span>
      </Link>
    </section>
  );
}
