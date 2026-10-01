import { describe, expect, it, vi } from "vitest";
import { createPartnerAccountHandler, type AccountGateway } from "./handler";

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
    })),
    acquire: vi.fn(async () => "lease"),
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
        }),
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      const issued = await response.json();
      expect(issued.accountEmail).toBe(
        `${role === "EO" ? "to" : "destinasi"}-${applicationId}@jedain.biz.id`,
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
