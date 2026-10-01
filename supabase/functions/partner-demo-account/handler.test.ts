import { describe, expect, it, vi } from "vitest";
import { createPartnerAccountHandler, type AccountGateway } from "./handler";
import { partnerAccountEmailCandidates } from "./accountEmail";

const applicationId = "c9f09ba7-9a61-44b0-8c93-324c02389f6e";
function setup(
  role: "EO" | "DESTINATION" = "EO",
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" = "PENDING_REVIEW",
) {
  const gateway = {
    getUser: vi.fn(async () => ({ id: "owner" })),
    getApplication: vi.fn(async () => ({
      id: applicationId,
      auth_user_id: "owner",
      role,
      status,
      account_email:
        status === "APPROVED" ? `to-${applicationId}@jedain.biz.id` : null,
      payload: { name: "Puncak Budug Asu" },
    })),
    acquire: vi.fn(async () => "lease"),
    emailInUse: vi.fn(async () => false),
    updateAuth: vi.fn(async () => undefined),
    finish: vi.fn(async () => undefined),
    signIn: vi.fn(async () => ({
      userId: "owner",
      access_token: "access",
      refresh_token: "refresh",
    })),
    release: vi.fn(async () => undefined),
  } satisfies AccountGateway;
  const handler = createPartnerAccountHandler(gateway);
  const request = (action = "approve", extra = {}) =>
    new Request("https://example.com/function", {
      method: "POST",
      headers: {
        Authorization: "Bearer verified_token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, ...extra }),
    });
  return { gateway, handler, request };
}

describe("Platform partner account issuance", () => {
  it("uses a stable application suffix only when the destination address is taken", async () => {
    const { gateway, handler, request } = setup("DESTINATION");
    gateway.emailInUse.mockResolvedValueOnce(true);
    const result = await (await handler(request())).json();
    expect(result.accountEmail).toBe(
      `puncak-budug-asu-${applicationId}@jedain.biz.id`,
    );
    expect(gateway.updateAuth).toHaveBeenCalledTimes(1);
    expect(gateway.finish).toHaveBeenCalledWith(
      applicationId,
      "owner",
      "lease",
      result.accountEmail,
    );
  });
  it("does not try a different address on a generic Auth failure", async () => {
    const { gateway, handler, request } = setup("DESTINATION");
    gateway.updateAuth.mockRejectedValueOnce(new Error("Auth unavailable"));
    expect((await handler(request())).status).toBe(409);
    expect(gateway.updateAuth).toHaveBeenCalledTimes(1);
    expect(gateway.finish).not.toHaveBeenCalled();
  });
  it("handles a collision that appears after checking address availability", async () => {
    const { gateway, handler, request } = setup("DESTINATION");
    gateway.emailInUse.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    gateway.updateAuth.mockRejectedValueOnce(new Error("Auth internal error"));
    const result = await (await handler(request())).json();
    expect(result.accountEmail).toBe(
      `puncak-budug-asu-${applicationId}@jedain.biz.id`,
    );
    expect(gateway.updateAuth).toHaveBeenCalledTimes(2);
  });
  it("releases the lease without changing Auth when availability cannot be checked", async () => {
    const { gateway, handler, request } = setup("DESTINATION");
    gateway.emailInUse.mockRejectedValueOnce(new Error("Lookup unavailable"));
    expect((await handler(request())).status).toBe(409);
    expect(gateway.updateAuth).not.toHaveBeenCalled();
    expect(gateway.release).toHaveBeenCalledWith(applicationId, "lease");
  });
  it("keeps an issued name address and migrates a legacy destination address on explicit reissue", async () => {
    const { gateway, handler, request } = setup("DESTINATION", "APPROVED");
    const app = await gateway.getApplication();
    gateway.getApplication.mockResolvedValue({
      ...app,
      account_email: `destinasi-${applicationId}@jedain.biz.id`,
    });
    expect(
      (await (await handler(request("reissue"))).json()).accountEmail,
    ).toBe("puncak-budug-asu@jedain.biz.id");
    const email = `puncak-budug-asu-${applicationId}@jedain.biz.id`;
    gateway.getApplication.mockResolvedValue({ ...app, account_email: email });
    expect(
      (await (await handler(request("reissue"))).json()).accountEmail,
    ).toBe(email);
  });
  it.each(["  Budug / Asu! ", "森 🌳", "Kawasan-".repeat(20)])(
    "creates valid bounded address candidates from %s",
    (name) => {
      const candidates = partnerAccountEmailCandidates(
        "DESTINATION",
        applicationId,
        name,
      );
      for (const email of candidates) {
        expect(email).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*@jedain\.biz\.id$/);
        expect(email.split("@")[0].length).toBeLessThanOrEqual(64);
      }
      expect(candidates[0]).not.toContain(applicationId);
    },
  );
  it("rejects callers without a verified user before any privileged operation", async () => {
    const { gateway, handler, request } = setup();
    expect(
      (
        await handler(
          new Request("https://example.com/function", { method: "POST" }),
        )
      ).status,
    ).toBe(401);
    expect(gateway.getUser).not.toHaveBeenCalled();
    gateway.getUser.mockResolvedValueOnce(null as never);
    expect((await handler(request())).status).toBe(401);
    expect(gateway.acquire).not.toHaveBeenCalled();
    expect(gateway.updateAuth).not.toHaveBeenCalled();
  });
  it("cannot issue credentials for another applicant even if an application ID is supplied", async () => {
    const { gateway, handler, request } = setup();
    gateway.getApplication.mockResolvedValueOnce({
      id: applicationId,
      auth_user_id: "someone_else",
      role: "EO",
      status: "PENDING_REVIEW",
      account_email: null,
      payload: { name: "Other destination" },
    });
    expect((await handler(request("approve", { applicationId }))).status).toBe(
      404,
    );
    expect(gateway.getApplication).toHaveBeenCalledWith("owner");
    expect(gateway.updateAuth).not.toHaveBeenCalled();
  });
  it.each(["EO", "DESTINATION"] as const)(
    "issues a unique server password and the configured domain for %s after explicit approval",
    async (role) => {
      const { gateway, handler, request } = setup(role);
      const response = await handler(
        request("approve", {
          accountEmail: "attacker@other.id",
          password: "chosen",
          name: "Nama dari client",
        }),
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      const issued = await response.json();
      expect(issued.accountEmail).toBe(
        role === "EO"
          ? `to-${applicationId}@jedain.biz.id`
          : "puncak-budug-asu@jedain.biz.id",
      );
      expect(issued.password.length).toBeGreaterThanOrEqual(24);
      expect(gateway.updateAuth).toHaveBeenCalledWith(
        "owner",
        issued.accountEmail,
        issued.password,
      );
      expect(gateway.finish).toHaveBeenCalledWith(
        applicationId,
        "owner",
        "lease",
        issued.accountEmail,
      );
      expect(JSON.stringify(gateway.finish.mock.calls)).not.toContain(
        issued.password,
      );
      expect(gateway.release).toHaveBeenCalledWith(applicationId, "lease");
    },
  );
  it.each(["REJECTED", "PENDING_REVIEW"] as const)(
    "does not permit reissuance while status is %s",
    async (status) => {
      const { gateway, handler, request } = setup("EO", status);
      expect((await handler(request("reissue"))).status).toBe(409);
      expect(gateway.updateAuth).not.toHaveBeenCalled();
    },
  );
  it("serializes concurrent issuance before changing Auth credentials", async () => {
    const { gateway, handler, request } = setup();
    gateway.acquire.mockRejectedValueOnce(
      new Error("Penerbitan akun sedang diproses."),
    );
    expect((await handler(request())).status).toBe(409);
    expect(gateway.updateAuth).not.toHaveBeenCalled();
  });
  it.each(["updateAuth", "finish", "signIn"] as const)(
    "releases the lease and does not disclose credentials if %s fails",
    async (stage) => {
      const { gateway, handler, request } = setup();
      gateway[stage].mockRejectedValueOnce(new Error("Operation failed"));
      const response = await handler(request());
      expect(response.status).toBe(409);
      expect(await response.json()).toEqual({ error: "Operation failed" });
      expect(gateway.release).toHaveBeenCalledWith(applicationId, "lease");
    },
  );
  it("does not return a session for a different authenticated user", async () => {
    const { gateway, handler, request } = setup();
    gateway.signIn.mockResolvedValueOnce({
      userId: "other",
      access_token: "access",
      refresh_token: "refresh",
    });
    expect((await handler(request())).status).toBe(409);
  });
  it("rotates a lost password only through the explicit approved-account action", async () => {
    const { gateway, handler, request } = setup("EO", "APPROVED");
    expect((await handler(request())).status).toBe(409);
    expect(gateway.updateAuth).not.toHaveBeenCalled();
    const first = await (await handler(request("reissue"))).json();
    const second = await (await handler(request("reissue"))).json();
    expect(second.accountEmail).toBe(first.accountEmail);
    expect(second.password).not.toBe(first.password);
  });
});
