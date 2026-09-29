import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { destinationRepository } from "../../data/destinationRepository";
import { Button } from "../../components/ui";
import { resolveAuthenticatedDestinationContext } from "./destinationContext";
import "./destination.css";

const HOURS_PREFIX = "Jam operasional: ";

export function DestinationSettingsScreen() {
  const context = resolveAuthenticatedDestinationContext();
  const [capacity, setCapacity] = useState(
    () => context?.destination.capacityPerSession ?? 1,
  );
  const [hours, setHours] = useState(
    () =>
      context?.destination.operationalNotes
        ?.find((note) => note.startsWith(HOURS_PREFIX))
        ?.slice(HOURS_PREFIX.length) ?? "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!context) {
    return (
      <div className="dest-container">
        <p role="alert">
          Pengaturan hanya tersedia untuk Mitra Destinasi aktif.
        </p>
      </div>
    );
  }

  const { destination, partner } = context;
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    const cleanHours = hours.trim();
    if (cleanHours.length > 120) {
      setError("Jam operasional maksimal 120 karakter.");
      return;
    }
    const operationalNotes = [
      ...(destination.operationalNotes ?? []).filter(
        (note) => !note.startsWith(HOURS_PREFIX),
      ),
      ...(cleanHours ? [`${HOURS_PREFIX}${cleanHours}`] : []),
    ];
    setSaving(true);
    const result = await destinationRepository.updateOperationalSettings(
      destination.destinationId,
      capacity,
      operationalNotes,
    );
    setSaving(false);
    if (!result.success) {
      setError(result.message ?? "Gagal menyimpan pengaturan.");
      return;
    }
    setMessage("Pengaturan operasional tersimpan.");
  };

  return (
    <div className="dest-container partner-settings">
      <header className="dest-page-header">
        <div>
          <span className="partner-settings__eyebrow">
            Ruang kelola destinasi
          </span>
          <h1 className="dest-page-title">Pengaturan kemitraan</h1>
          <p className="dest-page-subtitle">
            Perbarui informasi operasional tempatmu agar Travel Organizer
            memahami ruang yang tersedia.
          </p>
        </div>
      </header>

      <section
        className="partner-settings__section"
        aria-labelledby="destination-operation-title"
      >
        <div>
          <span className="partner-settings__index">01 / Operasional</span>
          <h2 id="destination-operation-title">Kapasitas & waktu kunjung</h2>
          <p>
            Kapasitas umum destinasi berbeda dari kuota setiap sesi yang
            ditentukan Travel Organizer.
          </p>
        </div>
        <form onSubmit={save} className="partner-settings__form">
          <label htmlFor="destination-capacity">Kapasitas umum per sesi</label>
          <div className="partner-settings__field-with-unit">
            <input
              id="destination-capacity"
              className="eo-form-input"
              type="number"
              min="1"
              step="1"
              required
              value={capacity}
              onChange={(event) => setCapacity(Number(event.target.value))}
            />
            <span>orang</span>
          </div>
          <small>
            Angka operasional kawasan, bukan jumlah kursi yang dapat dijual.
          </small>
          <label htmlFor="destination-hours">Jam operasional</label>
          <input
            id="destination-hours"
            className="eo-form-input"
            type="text"
            maxLength={120}
            value={hours}
            onChange={(event) => setHours(event.target.value)}
            placeholder="Contoh: Setiap hari, 07.00–16.00 WIB"
          />
          <small>
            Isi sesuai jadwal aktual lokasi. Kosongkan jika belum ditentukan.
          </small>
          {error && (
            <p className="partner-settings__error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="partner-settings__success" role="status">
              {message}
            </p>
          )}
          <Button type="submit" variant="primary" size="md" disabled={saving}>
            {saving ? "Menyimpan…" : "Simpan perubahan"}
          </Button>
        </form>
      </section>

      <section
        className="partner-settings__section"
        aria-labelledby="destination-profile-title"
      >
        <div>
          <span className="partner-settings__index">02 / Identitas</span>
          <h2 id="destination-profile-title">Pengelola & profil</h2>
          <p>
            Informasi utama tempat, galeri, deskripsi, dan tarif pemandu
            dikelola pada profil destinasi.
          </p>
          <Link
            to="/partner/destination/profile"
            className="partner-settings__link"
          >
            Buka profil destinasi ↗
          </Link>
        </div>
        <dl className="partner-settings__facts">
          <div>
            <dt>Entitas pengelola</dt>
            <dd>{partner.businessName ?? "Pengelola Kawasan"}</dd>
          </div>
          <div>
            <dt>Penanggung jawab</dt>
            <dd>{partner.name}</dd>
          </div>
          <div>
            <dt>Email operasional</dt>
            <dd>{partner.email}</dd>
          </div>
          <div>
            <dt>Destinasi</dt>
            <dd>{destination.name}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
