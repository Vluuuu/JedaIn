import { demoDestinationDocumentStore } from "./demoDestinationDocumentStore";

export function DemoDestinationDocument({
  applicationId,
  name,
}: {
  applicationId: string;
  name?: string;
}) {
  const local = demoDestinationDocumentStore.get(applicationId);
  const available = local && local.file.name === name;
  return (
    <div className="eo-form-group">
      <span className="eo-form-label">Dokumen izin pengelolaan kawasan</span>
      {available ? (
        <a href={local.url} target="_blank" rel="noreferrer">
          Buka {local.file.name}
        </a>
      ) : (
        <span>{name || "Belum dilampirkan"}</span>
      )}
      {name && (
        <span className="eo-form-helper">
          {available
            ? "Lampiran demo hanya tersedia selama sesi browser ini."
            : "File demo tidak tersedia pada sesi browser ini."}
        </span>
      )}
    </div>
  );
}
