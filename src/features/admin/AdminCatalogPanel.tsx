import { useEffect, useState } from "react";
import { Button, InlineStatus } from "../../components/ui";
import { RupiahInput } from "../../components/ui/RupiahInput";
import {
  adminCatalogRepository,
  type AdminCatalog,
  type VerifiedDestinationInput,
} from "./adminCatalogRepository";

const emptyInput: VerifiedDestinationInput = {
  name: "",
  province: "",
  city: "",
  description: "",
  capacityPerSession: 1,
  baseCostPerPerson: 0,
  localGuideFeePerPerson: 0,
  localGuideSummary: "",
  verified: false,
  imageUrl: "",
  availableActivities: [],
  facilities: [],
  baseCostIncludes: [],
  baseCostExcludes: [],
};

export function AdminCatalogPanel() {
  const [catalog, setCatalog] = useState<AdminCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [input, setInput] = useState(emptyInput);
  useEffect(() => {
    let active = true;
    void adminCatalogRepository
      .getCatalog()
      .then((data) => {
        if (active) setCatalog(data);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Katalog gagal dimuat.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision]);
  function update<K extends keyof VerifiedDestinationInput>(
    key: K,
    value: VerifiedDestinationInput[K],
  ) {
    setInput((current) => ({ ...current, [key]: value }));
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const destination =
        await adminCatalogRepository.createVerifiedDestination(input);
      setCatalog((current) =>
        current
          ? { ...current, destinations: [...current.destinations, destination] }
          : current,
      );
      setSuccess(
        `${destination.name} tersimpan sebagai destinasi terverifikasi.`,
      );
      setInput(emptyInput);
      setShowForm(false);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Destinasi gagal disimpan.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="admin-catalog">
      {error && (
        <div role="alert" className="admin-alert admin-alert--error">
          <p>{error}</p>
          {!saving && !showForm && (
            <Button
              variant="secondary"
              onClick={() => {
                setLoading(true);
                setError(null);
                setRevision((value) => value + 1);
              }}
            >
              Coba lagi
            </Button>
          )}
        </div>
      )}
      {success && <p role="status">{success}</p>}
      {loading ? (
        <p role="status">Memuat TO dan destinasi…</p>
      ) : (
        catalog && (
          <>
            <section className="admin-section" aria-labelledby="admin-to-title">
              <h2 id="admin-to-title">Travel Organizer</h2>
              <p className="admin-page-subtitle">
                Paket Live dan sesi yang masih berjalan dari setiap TO.
              </p>
              {catalog.organizers.length === 0 ? (
                <p>Belum ada Travel Organizer.</p>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Travel Organizer</th>
                        <th>Paket Live</th>
                        <th>Sesi aktif</th>
                        <th>Operasional</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catalog.organizers.map((to) => (
                        <tr key={to.id}>
                          <td>{to.name}</td>
                          <td>{to.livePackages}</td>
                          <td>{to.activeSessions}</td>
                          <td>
                            <InlineStatus
                              tone={to.activeSessions ? "success" : "neutral"}
                            >
                              {to.activeSessions
                                ? "Beroperasi"
                                : "Belum ada sesi aktif"}
                            </InlineStatus>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
            <section
              className="admin-section"
              aria-labelledby="admin-dest-title"
            >
              <div className="admin-page-header">
                <div>
                  <h2 id="admin-dest-title">Destinasi</h2>
                  <p className="admin-page-subtitle">
                    Admin menambahkan destinasi setelah verifikasi dan kesiapan
                    pemandu dikonfirmasi.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setShowForm((value) => !value);
                    setSuccess(null);
                  }}
                  disabled={saving}
                >
                  {showForm ? "Tutup form" : "Tambah destinasi"}
                </Button>
              </div>
              {showForm && (
                <form onSubmit={save} className="admin-destination-form">
                  <div className="admin-form-grid">
                    {(
                      [
                        ["name", "Nama destinasi"],
                        ["province", "Provinsi"],
                        ["city", "Kota / kabupaten"],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key}>
                        {label}
                        <input
                          className="eo-form-input"
                          required
                          value={input[key]}
                          onChange={(event) => update(key, event.target.value)}
                        />
                      </label>
                    ))}
                    <label>
                      Kapasitas per sesi
                      <input
                        className="eo-form-input"
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={input.capacityPerSession}
                        onChange={(event) =>
                          update(
                            "capacityPerSession",
                            Number(event.target.value),
                          )
                        }
                      />
                    </label>
                    <label>
                      Biaya dasar per orang (Rp)
                      <RupiahInput
                        className="eo-form-input"
                        value={input.baseCostPerPerson}
                        onChange={(value) => update("baseCostPerPerson", value)}
                      />
                    </label>
                    <label>
                      Biaya pemandu per orang (Rp)
                      <RupiahInput
                        className="eo-form-input"
                        value={input.localGuideFeePerPerson}
                        onChange={(value) =>
                          update("localGuideFeePerPerson", value)
                        }
                      />
                    </label>
                  </div>
                  <label>
                    Deskripsi destinasi
                    <textarea
                      className="eo-form-input"
                      required
                      value={input.description}
                      onChange={(event) =>
                        update("description", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Informasi pemandu lokal
                    <textarea
                      className="eo-form-input"
                      required
                      value={input.localGuideSummary}
                      onChange={(event) =>
                        update("localGuideSummary", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    URL foto destinasi (opsional)
                    <input
                      className="eo-form-input"
                      type="url"
                      placeholder="https://…"
                      value={input.imageUrl}
                      onChange={(event) =>
                        update("imageUrl", event.target.value)
                      }
                    />
                    <small>
                      Gunakan foto dari sumber destinasi. Tanpa foto, katalog
                      menampilkan placeholder.
                    </small>
                  </label>
                  <div className="admin-form-grid">
                    {(
                      [
                        ["availableActivities", "Aktivitas"],
                        ["facilities", "Fasilitas"],
                        ["baseCostIncludes", "Cakupan biaya dasar"],
                        ["baseCostExcludes", "Di luar biaya dasar"],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key}>
                        {label} (satu per baris)
                        <textarea
                          className="eo-form-input"
                          value={input[key].join("\n")}
                          onChange={(event) =>
                            update(key, event.target.value.split("\n"))
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <label className="admin-verification-confirmation">
                    <input
                      type="checkbox"
                      required
                      checked={input.verified}
                      onChange={(event) =>
                        update("verified", event.target.checked)
                      }
                    />
                    Saya sudah memverifikasi destinasi ini dan memastikan
                    pemandu lokal siap.
                  </label>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Menyimpan…" : "Simpan destinasi terverifikasi"}
                  </Button>
                </form>
              )}
              {catalog.destinations.length === 0 ? (
                <p>Belum ada destinasi.</p>
              ) : (
                <ul className="admin-destination-list">
                  {catalog.destinations.map((destination) => (
                    <li key={destination.destinationId}>
                      <div>
                        <strong>{destination.name}</strong>
                        <p>{destination.locationLabel}</p>
                      </div>
                      <InlineStatus
                        tone={
                          destination.status === "ACTIVE" &&
                          destination.guideReady
                            ? "success"
                            : "neutral"
                        }
                      >
                        {destination.status === "ACTIVE" &&
                        destination.guideReady
                          ? "Terverifikasi · aktif"
                          : "Belum aktif"}
                      </InlineStatus>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )
      )}
    </div>
  );
}
