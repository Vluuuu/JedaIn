// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { destinationRepository } from "../../data/destinationRepository";
import { packageRepository } from "../../data/packageRepository";
import { sessionRepository } from "../../data/sessionRepository";
import { mockDestinationStore } from "../eo/mockDestinationStore";
import { mockEoPackageStore } from "../eo/mockEoPackageStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import { defaultExploreAdapter } from "../explore/mockAdapter";
import { MockPackageDetailAdapter } from "../packageDetail/mockAdapter";
import { MockSessionSelectionAdapter } from "../sessionSelection/mockAdapter";

describe("Cross-Surface Backend Sync Golden Scenarios (Scenarios A, B, C)", () => {
  beforeEach(() => {
    mockDestinationStore.reset();
    mockEoPackageStore.reset();
    partnerSessionStore.reset();
  });

  afterEach(() => {
    mockDestinationStore.reset();
    mockEoPackageStore.reset();
    partnerSessionStore.reset();
  });

  it("SCENARIO A — DESTINATION SYNC: Destination Partner edits description & guide fee -> TO views updated destination", async () => {
    // 1. Destination Partner login
    partnerSessionStore.loginAsDemoDestination();
    const partner = partnerSessionStore.get();
    expect(partner?.role).toBe("DESTINATION");

    // 2. Edit description & guide fee
    const updatedDesc =
      "Kawasan perkebunan teh Lereng Hijau diperluas dengan area mindfulness hening.";
    const updatedFee = 40000;

    const descRes = await destinationRepository.updateDescription(
      "dest_lereng_hijau",
      updatedDesc,
    );
    expect(descRes.success).toBe(true);

    const feeRes = await destinationRepository.updateLocalGuideFee(
      "dest_lereng_hijau",
      updatedFee,
    );
    expect(feeRes.success).toBe(true);

    // 3. Switch device / actor to Travel Organizer
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    const toPartner = partnerSessionStore.get();
    expect(toPartner?.role).toBe("EO");

    // 4. TO reads destination detail from repository
    const toViewedDest =
      await destinationRepository.getById("dest_lereng_hijau");
    expect(toViewedDest).toBeDefined();
    expect(toViewedDest?.description).toBe(updatedDesc);
    expect(toViewedDest?.localGuideFeePerPerson).toBe(updatedFee);
  });

  it("SCENARIO B — PACKAGE LIFECYCLE: TO selects destination -> saves draft -> submits -> ACC demo -> publishes LIVE", async () => {
    // 1. TO selects active destination
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    // 2. TO creates package & saves draft
    const draftRes = await packageRepository.saveDraft({
      title: "Jeda Meditatif Lereng Hijau",
      shortSummary: "Pengalaman hening sehari penuh di lereng teh alami",
      destinationId: "dest_lereng_hijau",
      durationLabel: "1 hari",
      guideSource: "DESTINATION",
      meetingPointLabel: "Alun-alun Kota Batu",
      departureTimeLabel: "07.30 WIB",
      outboundTransport: "Minibus ber-AC dari Alun-Alun Batu ke Lereng Hijau",
      returnTransport: "Minibus kembali ke Alun-Alun Batu",
      includedItems: [
        "Tiket masuk kawasan",
        "Pemandu lokal",
        "Wedang teh herbal",
      ],
      excludedItems: ["Transportasi pribadi"],
      safetyNotes: ["Gunakan sepatu yang nyaman"],
      itinerary: [
        {
          order: 1,
          title: "Sesi Jalan Pagi Hening",
          description: "Menyusuri jalur kebun teh dengan hening",
        },
      ],
      pricing: {
        destinationBaseCost: 125000,
        localGuideFee: 40000,
        eoMargin: 135000,
        customerPrice: 300000,
      },
    });
    expect(draftRes.success).toBe(true);
    const newPkgId = draftRes.package!.packageId;
    expect(draftRes.package?.status).toBe("DRAFT");

    // 3. TO submits for review -> status = PENDING_ADMIN_REVIEW
    const submitRes = await packageRepository.submitForReview(newPkgId);
    expect(submitRes.success).toBe(true);
    expect(submitRes.package?.status).toBe("PENDING_ADMIN_REVIEW");

    // 4. TO triggers ACC Paket (Demo) -> status = APPROVED (NOT LIVE yet!)
    const approveRes =
      await packageRepository.approveOwnPackageForDemo(newPkgId);
    expect(approveRes.success).toBe(true);
    expect(approveRes.package?.status).toBe("APPROVED");
    expect(approveRes.package?.status).not.toBe("LIVE");

    // 5. TO triggers Publish -> status = LIVE
    const publishRes = await packageRepository.publishApprovedPackage(newPkgId);
    expect(publishRes.success).toBe(true);
    expect(publishRes.package?.status).toBe("LIVE");

    // Verify package is now LIVE in repository
    const livePkg = await packageRepository.getPackageById(newPkgId);
    expect(livePkg?.status).toBe("LIVE");
  });

  it("SCENARIO C — TRAVELER CROSS DEVICE: TO opens future session -> Traveler Explore, Detail, and Session Selection see it", async () => {
    // 1. TO creates a future OPEN session for LIVE package slow_green_day
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    const futureStart = new Date(Date.now() + 5 * 86400000).toISOString();
    const futureEnd = new Date(
      Date.now() + 5 * 86400000 + 6 * 3600000,
    ).toISOString();

    const sessionRes = await sessionRepository.createSession({
      packageId: "slow_green_day",
      startAt: futureStart,
      endAt: futureEnd,
      capacity: 8,
      pricePerPerson: 300000,
      operationalNote: "Pertemuan di lobby keberangkatan",
    });
    expect(sessionRes.success).toBe(true);
    const createdSessionId = sessionRes.session!.sessionId;

    // 2. Switch to Traveler context (no partner logged in)
    partnerSessionStore.logout();

    // 3. Traveler Explore reads catalog
    const exploreResult = await defaultExploreAdapter.getExplorePackages({});
    const explorePackage = exploreResult.packages.find(
      (p) => p.id === "slow_green_day",
    );
    expect(explorePackage).toBeDefined();
    expect(explorePackage?.status).toBe("LIVE");

    // 4. Traveler Package Detail opens
    const detailAdapter = new MockPackageDetailAdapter();
    const detailResult = await detailAdapter.getPackageDetail("slow_green_day");
    expect(detailResult.state).toBe("READY");
    if (
      detailResult.state === "READY" &&
      detailResult.package &&
      detailResult.detail
    ) {
      expect(detailResult.package.title).toBe("Sehari Pelan di Lereng Hijau");
      const foundSession = detailResult.detail.upcomingSessionPreviews.find(
        (s) => s.sessionId === createdSessionId,
      );
      expect(foundSession).toBeDefined();
      expect(foundSession?.remainingSlots).toBe(8);
    }

    // 5. Traveler Session Selection opens
    const sessionAdapter = new MockSessionSelectionAdapter();
    const sessionResult =
      await sessionAdapter.getPackageSessions("slow_green_day");
    expect(sessionResult.state).toBe("READY");
    if (sessionResult.state === "READY") {
      const match = sessionResult.sessions.find(
        (s) => s.sessionId === createdSessionId,
      );
      expect(match).toBeDefined();
      expect(match?.status).toBe("OPEN");
      expect(match?.remainingSlots).toBe(8);
    }
  });
});
