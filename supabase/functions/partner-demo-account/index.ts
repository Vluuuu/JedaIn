import { createClient } from "@supabase/supabase-js";
import { createPartnerAccountHandler } from "./handler.ts";

const options = { auth: { persistSession: false, autoRefreshToken: false } };
const url = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(
  url,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  options,
);
const client = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, options);

Deno.serve(
  createPartnerAccountHandler({
    async getUser(token) {
      const result = await client.auth.getUser(token);
      return result.error ? null : result.data.user;
    },
    async getApplication(userId) {
      const result = await admin
        .from("partner_applications")
        .select("id,auth_user_id,role,status,account_email,payload")
        .eq("auth_user_id", userId)
        .maybeSingle();
      if (result.error)
        throw new Error("Pengajuan belum dapat dimuat. Coba lagi.");
      return result.data;
    },
    async acquire(applicationId, userId) {
      const result = await admin.rpc("begin_partner_account_issue", {
        p_application_id: applicationId,
        p_actor_id: userId,
      });
      if (result.error || !result.data)
        throw new Error(
          result.error?.message ?? "Akun sedang diproses. Coba lagi.",
        );
      return result.data;
    },
    async emailInUse(email, userId) {
      const result = await admin.rpc("partner_account_email_in_use", {
        p_email: email,
        p_actor_id: userId,
      });
      if (result.error || typeof result.data !== "boolean")
        throw new Error(
          "Ketersediaan alamat akun belum dapat diperiksa. Coba lagi.",
        );
      return result.data;
    },
    async updateAuth(userId, email, password) {
      const result = await admin.auth.admin.updateUserById(userId, {
        email,
        password,
        email_confirm: true,
      });
      if (result.error || result.data.user?.id !== userId)
        throw new Error("Akun login belum dapat diterbitkan. Coba lagi.");
    },
    async finish(applicationId, userId, lease, email) {
      const result = await admin.rpc("finish_partner_account_issue", {
        p_application_id: applicationId,
        p_actor_id: userId,
        p_issue_token: lease,
        p_account_email: email,
      });
      if (result.error) throw new Error(result.error.message);
      if (
        result.data?.account_email !== email ||
        result.data?.auth_user_id !== userId ||
        result.data?.status !== "APPROVED"
      )
        throw new Error("Persetujuan dan akun login belum terverifikasi.");
    },
    async signIn(email, password) {
      // Separate client: signing in must not replace the service role context.
      const auth = createClient(
        url,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        options,
      );
      const result = await auth.auth.signInWithPassword({ email, password });
      if (result.error || !result.data.session || !result.data.user)
        throw new Error(
          "Sesi akun baru belum dapat dibuat. Muat ulang status untuk mencoba lagi.",
        );
      return {
        userId: result.data.user.id,
        access_token: result.data.session.access_token,
        refresh_token: result.data.session.refresh_token,
      };
    },
    async release(applicationId, lease) {
      const result = await admin.rpc("release_partner_account_issue", {
        p_application_id: applicationId,
        p_issue_token: lease,
      });
      if (result.error)
        throw new Error("Kunci penerbitan akun belum dapat dilepas.");
    },
  }),
);
