import { createElement } from "react";
import { DestinationVerificationStatusScreen } from "../destination/DestinationVerificationStatusScreen";
import { EoApplicationStatusScreen } from "./EoApplicationStatusScreen";
import { partnerSessionStore } from "./partnerSessionStore";

export function PartnerApplicationStatusScreen() {
  const partner = partnerSessionStore.get();
  if (partner?.role === "DESTINATION") {
    return createElement(DestinationVerificationStatusScreen);
  }
  return createElement(EoApplicationStatusScreen);
}
