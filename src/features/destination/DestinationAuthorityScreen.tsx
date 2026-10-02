import { Link } from "react-router";
import "../eo/partnerPortal.css";

export function DestinationAuthorityScreen() {
  return (
    <section
      className="partner-entry__login"
      aria-labelledby="destination-authority-title"
    >
      <h1 id="destination-authority-title">
        Destinasi dikurasi oleh tim JedaIn
      </h1>
      <p>
        Tim JedaIn memverifikasi dan menambahkan destinasi sebelum tersedia bagi
        Travel Organizer. Mitra Destinasi yang sudah terdaftar dapat masuk untuk
        melihat profil, jadwal, dan kapasitas.
      </p>
      <Link to="/partner">Masuk ke ruang kerja mitra</Link>
    </section>
  );
}
