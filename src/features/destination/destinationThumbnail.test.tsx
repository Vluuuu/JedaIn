// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { destinationRepository } from "../../data/destinationRepository";
import * as auth from "../../lib/supabase/demoAuth";
import * as config from "../../lib/supabase/config";
import * as client from "../../lib/supabase/client";
import { mapDestinationRecordToRow } from "../../lib/supabase/mappers";
import { mockDestinationStore } from "../eo/mockDestinationStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import { mockDestinationVerificationStore } from "../admin/mockDestinationVerificationStore";
import { DestinationSettingsScreen } from "./DestinationSettingsScreen";
import type { DestinationMediaItem } from "../eo/types";

let root: Root | undefined;
let container: HTMLDivElement;
const destinationId = "dest_lereng_hijau";
const upload: DestinationMediaItem = {
  mediaId: "photo_upload",
  label: "Foto destinasi",
  url: "data:image/png;base64,YWJjZA==",
  category: "DESTINATION",
  provenance: "DESTINATION_SOURCE",
};
beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});
beforeEach(() => {
  mockDestinationStore.reset();
  mockDestinationVerificationStore.reset();
  partnerSessionStore.loginAsDemoDestination();
});
afterEach(async () => {
  await act(() => root?.unmount());
  root = undefined;
  container?.remove();
  vi.restoreAllMocks();
  partnerSessionStore.reset();
  mockDestinationStore.reset();
  mockDestinationVerificationStore.reset();
});
async function render() {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      createElement(
        MemoryRouter,
        null,
        createElement(DestinationSettingsScreen),
      ),
    );
  });
  return container;
}
function backend() {
  vi.spyOn(config, "isSupabaseMode").mockReturnValue(true);
  vi.spyOn(auth, "requireAuthenticatedUser").mockResolvedValue({
    success: true,
    partnerUser: partnerSessionStore.get()!,
  });
  const current = mockDestinationStore.getById(destinationId)!;
  vi.spyOn(destinationRepository, "getAuthoritativeById").mockResolvedValue(
    current,
  );
  const single = vi.fn().mockResolvedValue({
    data: {
      ...mapDestinationRecordToRow(current),
      id: destinationId,
      image_url: upload.url,
      media_gallery: [upload, ...current.mediaGallery!],
    },
    error: null,
  });
  const query = { update: vi.fn(), eq: vi.fn(), select: vi.fn(), single };
  query.update.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.select.mockReturnValue(query);
  vi.spyOn(client, "getSupabaseClient").mockReturnValue({
    from: vi.fn(() => query),
  } as unknown as ReturnType<typeof client.getSupabaseClient>);
  return query;
}
describe("Destination default thumbnail", () => {
  it("clears a default photo when the destination owner removes it from the gallery", async () => {
    await destinationRepository.updateDefaultThumbnail(destinationId, upload);
    const current = mockDestinationStore.getById(destinationId)!;
    const result = await destinationRepository.updateMediaGallery(
      destinationId,
      current.mediaGallery!.filter((media) => media.mediaId !== upload.mediaId),
    );
    expect(result.success).toBe(true);
    expect(
      mockDestinationStore.getById(destinationId)?.imageUrl,
    ).toBeUndefined();
  });
  it("saves a gallery choice into canonical thumbnail and first gallery position, including reopening settings", async () => {
    const current = mockDestinationStore.getById(destinationId)!;
    const second = current.mediaGallery![1];
    await render();
    const radio = container.querySelector<HTMLInputElement>(
      `input[value="${second.mediaId}"]`,
    )!;
    await act(async () => {
      radio.click();
    });
    const form = container.querySelector<HTMLFormElement>(".dest-thumbnail")!;
    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });
    expect(container.textContent).toContain(
      "Thumbnail default destinasi tersimpan.",
    );
    const updated = await destinationRepository.getById(destinationId);
    expect(updated?.imageUrl).toBe(second.url);
    expect(updated?.mediaGallery?.[0]).toEqual(second);
    expect(updated?.mediaGallery).toHaveLength(current.mediaGallery!.length);
    expect(
      updated?.mediaGallery?.filter(
        (item) => item.provenance === "PROTOTYPE_ILLUSTRATION",
      ),
    ).toHaveLength(current.mediaGallery!.length);
    await act(() => root!.unmount());
    container.remove();
    await render();
    expect(
      container
        .querySelector<HTMLImageElement>(".dest-thumbnail__preview")
        ?.getAttribute("src"),
    ).toBe(second.url);
    expect(
      container.querySelector<HTMLInputElement>(
        `input[value="${second.mediaId}"]`,
      )?.checked,
    ).toBe(true);
  });
  it("keeps an empty gallery honest and rejects unsupported upload files", async () => {
    const current = mockDestinationStore.getById(destinationId)!;
    mockDestinationStore.upsertVerifiedDestination({
      ...current,
      imageUrl: undefined,
      mediaGallery: [],
    });
    await render();
    expect(container.textContent).toContain("Belum ada thumbnail destinasi.");
    const file = container.querySelector<HTMLInputElement>(
      "#destination-thumbnail-upload",
    )!;
    Object.defineProperty(file, "files", {
      value: [new File(["pdf"], "izin.pdf", { type: "application/pdf" })],
    });
    await act(async () => {
      file.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "JPG, PNG, atau WebP",
    );
    expect(
      container.querySelector<HTMLButtonElement>(".dest-thumbnail button")
        ?.disabled,
    ).toBe(true);
    expect(
      mockDestinationStore.getById(destinationId)?.imageUrl,
    ).toBeUndefined();
  });
  it("does not grant EO or another destination account thumbnail authority", async () => {
    expect(
      (
        await destinationRepository.updateDefaultThumbnail(
          "dest_curah_rawan",
          upload,
        )
      ).success,
    ).toBe(false);
    partnerSessionStore.loginAsDemoApproved();
    expect(
      (
        await destinationRepository.updateDefaultThumbnail(
          destinationId,
          upload,
        )
      ).success,
    ).toBe(false);
    expect(
      mockDestinationStore
        .getById(destinationId)
        ?.mediaGallery?.some((item) => item.mediaId === upload.mediaId),
    ).toBe(false);
  });
  it("persists thumbnail and uploaded gallery media together through Supabase", async () => {
    const query = backend();
    const result = await destinationRepository.updateDefaultThumbnail(
      destinationId,
      upload,
    );
    expect(result.success).toBe(true);
    expect(query.eq).toHaveBeenCalledWith("id", destinationId);
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        image_url: upload.url,
        media_gallery: expect.arrayContaining([upload]),
      }),
    );
    expect(mockDestinationStore.getById(destinationId)?.imageUrl).toBe(
      upload.url,
    );
  });
  it.each([
    { data: null, error: new Error("offline") },
    { data: null, error: null },
  ])(
    "does not mutate thumbnail or claim success without a saved backend row",
    async (response) => {
      const query = backend();
      query.single.mockResolvedValue(response);
      const original = mockDestinationStore.getById(destinationId);
      await render();
      const radio = container.querySelector<HTMLInputElement>(
        'input[name="destination-thumbnail"]',
      )!;
      await act(async () => {
        radio.click();
      });
      const form = container.querySelector<HTMLFormElement>(".dest-thumbnail")!;
      await act(async () => {
        form.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      });
      expect(container.querySelector('[role="alert"]')?.textContent).toContain(
        "Thumbnail belum tersimpan",
      );
      expect(container.textContent).not.toContain(
        "Thumbnail default destinasi tersimpan.",
      );
      expect(mockDestinationStore.getById(destinationId)).toEqual(original);
    },
  );
});
