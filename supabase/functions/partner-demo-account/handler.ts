import { partnerAccountEmailCandidates } from "./accountEmail.ts";

interface Application {
  id: string;
  auth_user_id: string;
  role: "EO" | "DESTINATION";
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  account_email: string | null;
  payload: { name?: string };
}

export interface AccountGateway {
  getUser(token: string): Promise<{ id: string } | null>;
  getApplication(userId: string): Promise<Application | null>;
  acquire(applicationId: string, userId: string): Promise<string>;
  emailInUse(email: string, userId: string): Promise<boolean>;
  updateAuth(userId: string, email: string, password: string): Promise<void>;
  finish(
    applicationId: string,
    userId: string,
    lease: string,
    email: string,
  ): Promise<void>;
  signIn(
    email: string,
    password: string,
  ): Promise<{ userId: string; access_token: string; refresh_token: string }>;
  release(applicationId: string, lease: string): Promise<void>;
}

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
function response(status: number, data: unknown) {
  return new Response(JSON.stringify(data), { status, headers });
}

export function createPartnerAccountHandler(gateway: AccountGateway) {
  return async (request: Request): Promise<Response> => {
    if (request.method === "OPTIONS") return new Response("ok", { headers });
    if (request.method !== "POST")
      return response(405, { error: "Metode tidak didukung." });
    const bearer = request.headers.get("Authorization");
    if (!bearer?.startsWith("Bearer "))
      return response(401, {
        error: "Masuk dengan akun pengajuan terlebih dahulu.",
      });
    let app: Application | null = null;
    let lease: string | undefined;
    try {
      const user = await gateway.getUser(bearer.slice(7));
      if (!user)
        return response(401, { error: "Sesi akun pengajuan tidak valid." });
      const body = await request.json().catch(() => null);
      if (!body || !["approve", "reissue"].includes(body.action))
        return response(400, {
          error: "Pilih persetujuan atau penerbitan ulang akun.",
        });
      app = await gateway.getApplication(user.id);
      if (!app || app.auth_user_id !== user.id)
        return response(404, { error: "Pengajuan akun ini tidak ditemukan." });
      if (app.role === "DESTINATION" && app.status !== "APPROVED")
        return response(409, {
          error:
            "Destinasi wajib diverifikasi tim/Admin JedaIn sebelum aktivasi.",
        });
      if (
        app.status === "REJECTED" ||
        (body.action === "reissue" && app.status !== "APPROVED")
      )
        return response(409, {
          error: "Pengajuan belum dapat diterbitkan. Periksa status pengajuan.",
        });
      if (body.action === "approve" && app.account_email)
        return response(409, {
          error:
            "Akun sudah diterbitkan. Muat ulang status untuk menerbitkan ulang kata sandi.",
        });
      lease = await gateway.acquire(app.id, user.id);
      const candidates = partnerAccountEmailCandidates(
        app.role,
        app.id,
        app.payload.name,
        app.account_email,
      );
      let email = candidates[0];
      if (candidates[1] && (await gateway.emailInUse(email, user.id)))
        email = candidates[1];
      const alphabet =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
      const password =
        "Jd!8" +
        Array.from(
          crypto.getRandomValues(new Uint8Array(24)),
          (value) => alphabet[value & 63],
        ).join("");
      try {
        await gateway.updateAuth(user.id, email, password);
      } catch (cause) {
        // Auth may return an internal error for a duplicate email. Confirm the
        // collision on the server before retrying a different address.
        if (
          email !== candidates[0] ||
          !candidates[1] ||
          !(await gateway.emailInUse(email, user.id))
        )
          throw cause;
        email = candidates[1];
        await gateway.updateAuth(user.id, email, password);
      }
      await gateway.finish(app.id, user.id, lease, email);
      const session = await gateway.signIn(email, password);
      if (session.userId !== user.id)
        throw new Error("Sesi akun baru tidak sesuai dengan pengajuan.");
      return response(200, {
        accountEmail: email,
        password,
        authUserId: user.id,
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        },
      });
    } catch (cause) {
      return response(409, {
        error:
          cause instanceof Error
            ? cause.message
            : "Penerbitan akun belum berhasil. Coba lagi.",
      });
    } finally {
      if (app && lease)
        await gateway.release(app.id, lease).catch(() => undefined);
    }
  };
}
