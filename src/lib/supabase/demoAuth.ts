import type { User } from "@supabase/supabase-js";
import { partnerSessionStore } from "../../features/eo/partnerSessionStore";
import type { PartnerUser } from "../../features/eo/types";
import { getPartnerRoleLabel } from "../../features/identity/partnerLabels";
import { getSupabaseClient } from "./client";
import { isSupabaseMode } from "./config";
import type { PartnerProfileRow } from "./database.types";

const PROFILE_SELECT =
  "id, auth_user_id, role, display_name, business_name, email, guide_status, organizer_review_ref, destination_identity_id";

export const DEMO_EO_CREDENTIALS = {
  email: "partner@jedaalam.id",
  password: "JedaInDemo2026!",
  partnerId: "eo_jeda_alam",
  role: "EO" as const,
  businessName: "Jeda Alam Nusantara",
};

export const DEMO_DESTINATION_CREDENTIALS = {
  email: "destinasi@lerenghijau.id",
  password: "JedaInDemo2026!",
  partnerId: "dest_partner_lereng_hijau",
  destinationIdentityId: "dest_lereng_hijau",
  role: "DESTINATION" as const,
  businessName: "Pengelola Lereng Hijau Batu",
};

export interface DemoAuthResult {
  success: boolean;
  mode: "mock" | "supabase";
  user?: { id: string; email: string };
  partnerId?: string;
  isLinked?: boolean;
  error?: string;
}

export interface BackendAuthStatus {
  mode: "mock" | "supabase";
  isAuthenticated: boolean;
  userId?: string;
  userEmail?: string;
  role?: "EO" | "DESTINATION" | "ADMIN";
  partnerId?: string;
  isLinked?: boolean;
  error?: string;
}

/**
 * Ensures an authenticated Supabase session for Demo Travel Organizer (EO).
 * In mock mode: immediately succeeds and syncs local session store.
 * In supabase mode: logs in or registers demo EO user, links partner_profiles.auth_user_id,
 * and sets partnerSessionStore.
 */
export async function ensureDemoEoSession(): Promise<DemoAuthResult> {
  if (!isSupabaseMode()) {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    return {
      success: true,
      mode: "mock",
      user: { id: "mock_eo_uid", email: DEMO_EO_CREDENTIALS.email },
      partnerId: DEMO_EO_CREDENTIALS.partnerId,
      isLinked: true,
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      mode: "supabase",
      error:
        "Klien Supabase tidak tersedia. Periksa konfigurasi VITE_SUPABASE_URL & KEY.",
    };
  }

  try {
    // 1. Check current session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    let authUser: User | null = session?.user ?? null;

    if (
      authUser &&
      authUser.email?.toLowerCase() !== DEMO_EO_CREDENTIALS.email.toLowerCase()
    ) {
      // User is logged in as someone else (e.g. destination partner), sign out first
      await supabase.auth.signOut();
      authUser = null;
    }

    if (!authUser) {
      // 2. Attempt sign in with demo password
      const signInRes = await supabase.auth.signInWithPassword({
        email: DEMO_EO_CREDENTIALS.email,
        password: DEMO_EO_CREDENTIALS.password,
      });

      if (!signInRes.error && signInRes.data.user) {
        authUser = signInRes.data.user;
      } else {
        // 3. If sign in fails, user might not exist in auth.users yet. Attempt sign up.
        const signUpRes = await supabase.auth.signUp({
          email: DEMO_EO_CREDENTIALS.email,
          password: DEMO_EO_CREDENTIALS.password,
          options: {
            data: {
              role: DEMO_EO_CREDENTIALS.role,
              partner_id: DEMO_EO_CREDENTIALS.partnerId,
            },
          },
        });

        if (signUpRes.error) {
          return {
            success: false,
            mode: "supabase",
            error: `Autentikasi Supabase gagal: ${signUpRes.error.message}`,
          };
        }

        if (signUpRes.data.session) {
          authUser = signUpRes.data.user;
        } else if (signUpRes.data.user) {
          // Retry sign in to establish active session if auto-confirm was applied
          const retrySignIn = await supabase.auth.signInWithPassword({
            email: DEMO_EO_CREDENTIALS.email,
            password: DEMO_EO_CREDENTIALS.password,
          });
          if (retrySignIn.error || !retrySignIn.data.user) {
            return {
              success: false,
              mode: "supabase",
              error: `Pengguna berhasil dibuat tetapi sesi tidak dapat dibuat: ${retrySignIn.error?.message || "Periksa konfigurasi auth Supabase"}`,
            };
          }
          authUser = retrySignIn.data.user;
        }
      }
    }

    if (!authUser) {
      return {
        success: false,
        mode: "supabase",
        error: "Gagal mendapatkan sesi pengguna Supabase terautentikasi.",
      };
    }

    const linked = await requireAuthenticatedUser("EO");
    if (
      !linked.success ||
      linked.partnerUser?.id !== DEMO_EO_CREDENTIALS.partnerId
    ) {
      partnerSessionStore.logout();
      return {
        success: false,
        mode: "supabase",
        error:
          linked.error ??
          "Profil demo Travel Organizer tidak tertaut ke akun Supabase ini.",
      };
    }

    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    return {
      success: true,
      mode: "supabase",
      user: {
        id: authUser.id,
        email: authUser.email || DEMO_EO_CREDENTIALS.email,
      },
      partnerId: DEMO_EO_CREDENTIALS.partnerId,
      isLinked: true,
    };
  } catch (err: unknown) {
    return {
      success: false,
      mode: "supabase",
      error:
        err instanceof Error
          ? err.message
          : "Kesalahan sistem autentikasi demo.",
    };
  }
}

/**
 * Ensures an authenticated Supabase session for Demo Destination Partner.
 */
export async function ensureDemoDestinationSession(): Promise<DemoAuthResult> {
  if (!isSupabaseMode()) {
    partnerSessionStore.loginAsDemoDestination();
    return {
      success: true,
      mode: "mock",
      user: { id: "mock_dest_uid", email: DEMO_DESTINATION_CREDENTIALS.email },
      partnerId: DEMO_DESTINATION_CREDENTIALS.partnerId,
      isLinked: true,
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      mode: "supabase",
      error:
        "Klien Supabase tidak tersedia. Periksa konfigurasi VITE_SUPABASE_URL & KEY.",
    };
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    let authUser: User | null = session?.user ?? null;

    if (
      authUser &&
      authUser.email?.toLowerCase() !==
        DEMO_DESTINATION_CREDENTIALS.email.toLowerCase()
    ) {
      await supabase.auth.signOut();
      authUser = null;
    }

    if (!authUser) {
      const signInRes = await supabase.auth.signInWithPassword({
        email: DEMO_DESTINATION_CREDENTIALS.email,
        password: DEMO_DESTINATION_CREDENTIALS.password,
      });

      if (!signInRes.error && signInRes.data.user) {
        authUser = signInRes.data.user;
      } else {
        const signUpRes = await supabase.auth.signUp({
          email: DEMO_DESTINATION_CREDENTIALS.email,
          password: DEMO_DESTINATION_CREDENTIALS.password,
          options: {
            data: {
              role: DEMO_DESTINATION_CREDENTIALS.role,
              partner_id: DEMO_DESTINATION_CREDENTIALS.partnerId,
            },
          },
        });

        if (signUpRes.error) {
          return {
            success: false,
            mode: "supabase",
            error: `Autentikasi Destinasi gagal: ${signUpRes.error.message}`,
          };
        }

        if (signUpRes.data.session) {
          authUser = signUpRes.data.user;
        } else if (signUpRes.data.user) {
          const retrySignIn = await supabase.auth.signInWithPassword({
            email: DEMO_DESTINATION_CREDENTIALS.email,
            password: DEMO_DESTINATION_CREDENTIALS.password,
          });
          if (retrySignIn.error || !retrySignIn.data.user) {
            return {
              success: false,
              mode: "supabase",
              error: `Pengguna berhasil dibuat tetapi sesi tidak dapat dibuat: ${retrySignIn.error?.message || "Periksa konfigurasi auth Supabase"}`,
            };
          }
          authUser = retrySignIn.data.user;
        }
      }
    }

    if (!authUser) {
      return {
        success: false,
        mode: "supabase",
        error: "Gagal mendapatkan sesi pengguna Supabase terautentikasi.",
      };
    }

    const linked = await requireAuthenticatedUser("DESTINATION");
    if (
      !linked.success ||
      linked.partnerUser?.id !== DEMO_DESTINATION_CREDENTIALS.partnerId
    ) {
      partnerSessionStore.logout();
      return {
        success: false,
        mode: "supabase",
        error:
          linked.error ??
          "Profil demo Destinasi tidak tertaut ke akun Supabase ini.",
      };
    }

    partnerSessionStore.loginAsDemoDestination();

    return {
      success: true,
      mode: "supabase",
      user: {
        id: authUser.id,
        email: authUser.email || DEMO_DESTINATION_CREDENTIALS.email,
      },
      partnerId: DEMO_DESTINATION_CREDENTIALS.partnerId,
      isLinked: true,
    };
  } catch (err: unknown) {
    return {
      success: false,
      mode: "supabase",
      error:
        err instanceof Error
          ? err.message
          : "Kesalahan sistem autentikasi demo destinasi.",
    };
  }
}

/**
 * Checks backend authentication status for telemetry / diagnostics.
 */
export async function getBackendAuthStatus(): Promise<BackendAuthStatus> {
  if (!isSupabaseMode()) {
    const partner = partnerSessionStore.get();
    return {
      mode: "mock",
      isAuthenticated: Boolean(partner),
      role: partner?.role,
      partnerId: partner?.id,
      userEmail: partner?.email,
      userId: partner ? `mock_${partner.id}` : undefined,
      isLinked: true,
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      mode: "supabase",
      isAuthenticated: false,
      error: "Supabase client tidak terkonfigurasi.",
    };
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return {
        mode: "supabase",
        isAuthenticated: false,
      };
    }

    const { data: profile } = await supabase
      .from("partner_profiles")
      .select("id, role, auth_user_id, email")
      .eq("auth_user_id", session.user.id)
      .maybeSingle();

    const isLinked = Boolean(profile);
    const pRow = profile as PartnerProfileRow | null;

    return {
      mode: "supabase",
      isAuthenticated: true,
      userId: session.user.id,
      userEmail: session.user.email,
      role: pRow?.role,
      partnerId: pRow?.id,
      isLinked,
    };
  } catch (err) {
    return {
      mode: "supabase",
      isAuthenticated: false,
      error:
        err instanceof Error ? err.message : "Gagal memeriksa status auth.",
    };
  }
}

/**
 * Enforces authenticated actor requirements before allowing backend writes.
 * If in Supabase mode, verifies that a live authenticated Supabase session exists
 * and that the user is mapped to the requested role.
 */
export async function requireAuthenticatedUser(
  requiredRole?: "EO" | "DESTINATION" | "ADMIN",
): Promise<{
  success: boolean;
  userId?: string;
  partnerUser?: PartnerUser;
  error?: string;
}> {
  if (!isSupabaseMode()) {
    const actor = partnerSessionStore.get();
    if (!actor) {
      return {
        success: false,
        error: "Akses ditolak: Tidak ada sesi mitra aktif.",
      };
    }
    if (requiredRole && actor.role !== requiredRole) {
      return {
        success: false,
        error: `Akses ditolak: Hanya ${getPartnerRoleLabel(requiredRole)} yang dapat melakukan aksi ini.`,
      };
    }
    return {
      success: true,
      userId: `mock_${actor.id}`,
      partnerUser: actor,
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      error: "Klien Supabase tidak tersedia.",
    };
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    return {
      success: false,
      error: `Gagal membaca sesi Supabase: ${sessionError.message}`,
    };
  }

  if (!session?.user) {
    return {
      success: false,
      error:
        "Akses ditolak: Sesi Supabase tidak terautentikasi (auth.uid() = null). Silakan masuk ke portal demo terlebih dahulu.",
    };
  }

  // A linked profile is authoritative. An unlinked profile may be claimed by email.
  const { data: initialProfile, error: profileError } = await supabase
    .from("partner_profiles")
    .select(PROFILE_SELECT)
    .eq("auth_user_id", session.user.id)
    .maybeSingle();
  let profile = initialProfile;

  if (profileError) {
    return {
      success: false,
      error: `Gagal membaca profil partner: ${profileError.message}`,
    };
  }

  if (!profile && session.user.email) {
    const { data: byEmail, error: lookupError } = await supabase
      .from("partner_profiles")
      .select(PROFILE_SELECT)
      .ilike("email", session.user.email)
      .maybeSingle();

    if (lookupError) {
      return {
        success: false,
        error: `Gagal mencari profil partner: ${lookupError.message}`,
      };
    }

    if (byEmail) {
      const candidate = byEmail as PartnerProfileRow;
      if (
        candidate.email?.toLowerCase() !== session.user.email.toLowerCase() ||
        candidate.auth_user_id !== null
      ) {
        return {
          success: false,
          error: "Profil partner tidak dapat diklaim oleh akun ini.",
        };
      }
      if (requiredRole && candidate.role !== requiredRole) {
        return {
          success: false,
          error: `Akses ditolak: Peran akun (${getPartnerRoleLabel(candidate.role)}) tidak memiliki izin sebagai ${getPartnerRoleLabel(requiredRole)}.`,
        };
      }

      // Contract: Database migration 20260928000002_restrict_partner_profile_claim_updates.sql
      // revokes table-wide UPDATE and grants column-level UPDATE strictly on (auth_user_id)
      // to 'authenticated'. The claim payload MUST ONLY contain auth_user_id and NEVER modify
      // authorization attributes (role, email, display_name, business_name, etc.).
      const { error: updateError } = await supabase
        .from("partner_profiles")
        .update({ auth_user_id: session.user.id })
        .eq("id", candidate.id)
        .is("auth_user_id", null);

      if (updateError) {
        return {
          success: false,
          error: `Gagal menautkan profil partner: ${updateError.message}`,
        };
      }

      const verified = await supabase
        .from("partner_profiles")
        .select(PROFILE_SELECT)
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (
        verified.error ||
        !verified.data ||
        (verified.data as PartnerProfileRow).id !== candidate.id
      ) {
        return {
          success: false,
          error: `Profil partner belum terverifikasi setelah claim${verified.error ? `: ${verified.error.message}` : "."}`,
        };
      }
      profile = verified.data;
    }
  }

  if (!profile) {
    return {
      success: false,
      error: `Akses ditolak: Akun Supabase (${session.user.email}) belum ditautkan ke profil partner_profiles aktif.`,
    };
  }

  const pRow = profile as PartnerProfileRow;
  if (pRow.auth_user_id !== session.user.id) {
    return {
      success: false,
      error: "Profil partner belum tertaut ke sesi Supabase ini.",
    };
  }
  if (requiredRole && pRow.role !== requiredRole) {
    return {
      success: false,
      error: `Akses ditolak: Peran akun (${getPartnerRoleLabel(pRow.role)}) tidak memiliki izin sebagai ${getPartnerRoleLabel(requiredRole)}.`,
    };
  }

  const mappedPartnerUser: PartnerUser = {
    id: pRow.id,
    email: pRow.email ?? session.user.email ?? "",
    name: pRow.display_name,
    role: pRow.role,
    businessName: pRow.business_name,
    guideStatus: pRow.guide_status ?? undefined,
    organizerReviewRef: pRow.organizer_review_ref ?? undefined,
    destinationIdentityId: pRow.destination_identity_id ?? undefined,
  };

  return {
    success: true,
    userId: session.user.id,
    partnerUser: mappedPartnerUser,
  };
}
