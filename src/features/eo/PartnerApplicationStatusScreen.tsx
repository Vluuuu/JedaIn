import { createElement, useEffect, useState } from "react";
import { partnerRegistrationRepository } from "../../data/partnerRegistrationRepository";
import { getDataMode } from "../../lib/supabase/config";
import { DestinationVerificationStatusScreen } from "../destination/DestinationVerificationStatusScreen";
import { EoApplicationStatusScreen } from "./EoApplicationStatusScreen";
import { partnerSessionStore } from "./partnerSessionStore";

export function PartnerApplicationStatusScreen() {
  const [loading, setLoading] = useState(getDataMode() === "supabase");
  const [error, setError] = useState<string>();
  const [attempt, retry] = useState(0);
  useEffect(() => {
    if (getDataMode() !== "supabase") return;
    let active = true;
    partnerRegistrationRepository
      .loadCurrent()
      .then(() => {
        if (active) {
          setError(undefined);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError("Status pengajuan belum dapat dimuat.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  if (loading) return <p role="status">Memuat status pengajuan...</p>;
  if (error)
    return (
      <div role="alert">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            retry((value) => value + 1);
          }}
        >
          Coba lagi
        </button>
      </div>
    );
  const partner = partnerSessionStore.get();
  if (partner?.role === "DESTINATION") {
    return createElement(DestinationVerificationStatusScreen);
  }
  return createElement(EoApplicationStatusScreen);
}
