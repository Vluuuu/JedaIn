import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { getSupabaseClient } from "../../lib/supabase/client";
import { isSupabaseMode } from "../../lib/supabase/config";
import { partnerRegistrationRepository } from "../../data/partnerRegistrationRepository";
import {
  DEMO_DESTINATION_CREDENTIALS,
  DEMO_EO_CREDENTIALS,
  requireAuthenticatedUser,
} from "../../lib/supabase/demoAuth";
import { mockDestinationVerificationStore } from "../admin/mockDestinationVerificationStore";
import { mockApplicationStore } from "./mockApplicationStore";
import {
  DEMO_CONCEPT_EO_USER,
  DEMO_DESTINATION_USER,
  DEMO_EO_USER,
  partnerSessionStore,
} from "./partnerSessionStore";
import "./partnerPortal.css";

type PartnerRole = "EO" | "DESTINATION";

interface PartnerLoginScreenProps {
  role?: PartnerRole;
  onBack?: () => void;
  onRegister?: () => void;
}

export function PartnerLoginScreen({
  role = "DESTINATION",
  onBack,
  onRegister,
}: PartnerLoginScreenProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const register = () => {
    if (role !== "EO") return;
    if (onRegister) {
      onRegister();
      return;
    }
    navigate("/partner/apply/eo");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      if (isSupabaseMode()) {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("Layanan masuk belum tersedia.");
        const signedIn = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (signedIn.error)
          throw new Error("Email atau kata sandi tidak sesuai.");
        const verified = await requireAuthenticatedUser(role);
        if (!verified.success || !verified.partnerUser) {
          await supabase.auth.signOut();
          partnerSessionStore.logout();
          throw new Error(
            verified.error ?? "Profil mitra belum terverifikasi.",
          );
        }
        partnerSessionStore.setPartner(verified.partnerUser);
        await partnerRegistrationRepository.loadCurrent();
      } else {
        const isExistingDemo = [
          DEMO_EO_USER,
          DEMO_CONCEPT_EO_USER,
          DEMO_DESTINATION_USER,
        ].some((user) => user.email.toLowerCase() === normalizedEmail);
        if (
          isExistingDemo
            ? password !== DEMO_EO_CREDENTIALS.password
            : !partnerRegistrationRepository.matchesMockPassword(
                normalizedEmail,
                password,
              )
        ) {
          throw new Error("Email atau kata sandi tidak sesuai.");
        }
        if (role === "EO") {
          const account = [DEMO_EO_USER, DEMO_CONCEPT_EO_USER].find(
            (user) => user.email.toLowerCase() === normalizedEmail,
          );
          const application = mockApplicationStore
            .getAll()
            .find(
              (item) =>
                (item.accountEmail ?? item.email).toLowerCase() ===
                normalizedEmail,
            );
          if (account) partnerSessionStore.setPartner(account);
          else if (application) {
            partnerSessionStore.setPartner({
              id: application.identityId,
              email: application.accountEmail ?? application.email,
              name: application.contactPerson,
              role: "EO",
              businessName: application.businessName,
              guideStatus: application.guideStatus,
            });
          } else throw new Error("Akun Travel Organizer belum terdaftar.");
        } else {
          const application = mockDestinationVerificationStore
            .getAll()
            .find(
              (item) =>
                (item.accountEmail ?? item.contactEmail)
                  ?.trim()
                  .toLowerCase() === normalizedEmail,
            );
          if (DEMO_DESTINATION_USER.email.toLowerCase() === normalizedEmail) {
            partnerSessionStore.setPartner(DEMO_DESTINATION_USER);
          } else if (application) {
            partnerSessionStore.setPartner({
              id: application.partnerIdentityId,
              email:
                application.accountEmail ??
                application.contactEmail ??
                normalizedEmail,
              name: application.name,
              role: "DESTINATION",
              businessName: application.managementName ?? application.name,
              destinationIdentityId: application.destinationIdentityId,
            });
          } else throw new Error("Akun Mitra Destinasi belum terdaftar.");
        }
      }

      const partner = partnerSessionStore.get();
      if (!partner || partner.role !== role)
        throw new Error("Peran akun tidak sesuai.");
      if (role === "EO") {
        const application = mockApplicationStore.getBySellerId(partner.id);
        navigate(
          application && application.status !== "APPROVED"
            ? "/partner/application"
            : "/partner/eo",
        );
      } else {
        const application = mockDestinationVerificationStore
          .getAll()
          .find((item) => item.partnerIdentityId === partner.id);
        navigate(
          application && application.status !== "APPROVED"
            ? "/partner/application"
            : "/partner/destination",
        );
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Gagal masuk. Coba lagi.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className="partner-entry__login"
      aria-label={`Masuk ${role === "EO" ? "Travel Organizer" : "Mitra Destinasi"}`}
    >
      <button
        type="button"
        className="partner-entry__back"
        onClick={onBack ?? (() => navigate("/partner"))}
      >
        ← Kembali ke portal TO
      </button>
      <span className="partner-entry__eyebrow">Selamat datang kembali</span>
      <h2>
        Masuk sebagai {role === "EO" ? "Travel Organizer" : "Mitra Destinasi"}
      </h2>
      <p>Masukkan akun mitramu untuk melanjutkan pekerjaan di JedaIn.</p>
      <form onSubmit={submit} className="partner-entry__form">
        <label htmlFor="partner-email">Email</label>
        <input
          id="partner-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="akun@jedain.biz.id"
          required
        />
        <label htmlFor="partner-password">Kata sandi</label>
        <div className="partner-entry__password">
          <input
            id="partner-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={
              showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"
            }
          >
            {showPassword ? "Sembunyikan" : "Lihat"}
          </button>
        </div>
        {error && (
          <p className="partner-entry__error" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="partner-entry__primary"
          disabled={submitting}
        >
          {submitting ? "Memeriksa akun…" : "Masuk ke ruang kerja"}
        </button>
      </form>
      {role === "EO" ? (
        <p className="partner-entry__register">
          Belum menjadi mitra?{" "}
          <button type="button" onClick={register}>
            Ajukan kemitraan
          </button>
        </p>
      ) : (
        <p className="partner-entry__register">
          Destinasi diverifikasi dan ditambahkan oleh tim JedaIn.
        </p>
      )}
      {!isSupabaseMode() && (
        <details className="partner-entry__preview">
          <summary>Akses akun contoh prototipe</summary>
          <p>
            Email:{" "}
            {role === "EO"
              ? DEMO_EO_CREDENTIALS.email
              : DEMO_DESTINATION_CREDENTIALS.email}
            <br />
            Kata sandi: {DEMO_EO_CREDENTIALS.password}
          </p>
        </details>
      )}
    </section>
  );
}
