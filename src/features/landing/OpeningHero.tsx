import { useState } from "react";
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
