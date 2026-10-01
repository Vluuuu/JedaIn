export const DEMO_DOCUMENT_MAX_BYTES = 5 * 1024 * 1024;

export function validateDemoDestinationDocument(
  file: File,
): string | undefined {
  if (
    !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(
      file.type,
    )
  )
    return "Pilih dokumen PDF, JPG, PNG, atau WebP.";
  if (!file.size || file.size > DEMO_DOCUMENT_MAX_BYTES)
    return "Dokumen harus berukuran maksimal 5 MB dan tidak kosong.";
}

// Demo attachments remain in this browser session; only their existing
// metadata is part of the application submitted to the backend.
const documents = new Map<string, { file: File; url: string }>();

export const demoDestinationDocumentStore = {
  get(applicationId: string) {
    return documents.get(applicationId);
  },
  set(applicationId: string, file: File) {
    const invalid = validateDemoDestinationDocument(file);
    if (invalid) throw new Error(invalid);
    const url = URL.createObjectURL(file);
    const prior = documents.get(applicationId);
    if (prior) URL.revokeObjectURL(prior.url);
    documents.set(applicationId, { file, url });
  },
  reset() {
    for (const { url } of documents.values()) URL.revokeObjectURL(url);
    documents.clear();
  },
};
