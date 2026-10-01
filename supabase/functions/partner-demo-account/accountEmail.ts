const DOMAIN = "@jedain.biz.id";

export function partnerAccountEmailCandidates(
  role: "EO" | "DESTINATION",
  applicationId: string,
  destinationName = "",
  currentEmail?: string | null,
): string[] {
  const id = applicationId
    .replace(/[^a-z0-9-]/gi, "")
    .slice(-36)
    .toLowerCase();
  if (role === "EO") return [`to-${id}${DOMAIN}`];
  const legacyEmail = `destinasi-${id}${DOMAIN}`;
  if (
    currentEmail &&
    currentEmail !== legacyEmail &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*@jedain\.biz\.id$/.test(currentEmail) &&
    currentEmail.split("@")[0].length <= 64
  )
    return [currentEmail];
  const name =
    destinationName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64)
      .replace(/-+$/g, "") || "destinasi";
  return [
    `${name}${DOMAIN}`,
    `${name.slice(0, 27).replace(/-+$/g, "")}-${id}${DOMAIN}`,
  ];
}
