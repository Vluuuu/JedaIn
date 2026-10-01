import type { EoPackageRecord } from "../eo/types";

export interface DepartureOption {
  id: string;
  areaLabel: string;
  meetingPointLabel: string;
  departureTimeLabel: string;
  pricePerPerson: number;
}

export function createDepartureOption(): DepartureOption {
  return {
    id: `departure_${crypto.randomUUID()}`,
    areaLabel: "",
    meetingPointLabel: "",
    departureTimeLabel: "",
    pricePerPerson: 0,
  };
}

export function isValidDepartureOption(option: DepartureOption): boolean {
  return Boolean(
    option.id?.trim() &&
    option.areaLabel?.trim() &&
    option.meetingPointLabel?.trim() &&
    option.departureTimeLabel?.trim() &&
    Number.isSafeInteger(option.pricePerPerson) &&
    option.pricePerPerson > 0,
  );
}

export function minimumDeparturePrice(
  options: DepartureOption[] | undefined,
  legacyPrice = 0,
): number {
  if (options === undefined) return legacyPrice;
  const prices = options
    .map((o) => o.pricePerPerson)
    .filter((p) => Number.isFinite(p) && p > 0);
  return prices.length ? Math.min(...prices) : 0;
}

// Missing legacy labels remain empty; the UI explains missing information.
export function legacyDepartureOption(
  packageId: string,
  price: number,
  meetingPointLabel = "",
  departureTimeLabel = "",
  areaLabel = "",
): DepartureOption {
  return {
    id: `legacy_${packageId}`,
    areaLabel,
    meetingPointLabel,
    departureTimeLabel,
    pricePerPerson: price,
  };
}

export function getEoDepartureOptions(pkg: EoPackageRecord): DepartureOption[] {
  return (
    pkg.departureOptions ?? [
      legacyDepartureOption(
        pkg.packageId,
        pkg.pricing.customerPrice,
        pkg.meetingPointLabel,
        pkg.departureTimeLabel,
      ),
    ]
  );
}

export function departureSearch(optionId?: string): string {
  return optionId ? `?departure=${encodeURIComponent(optionId)}` : "";
}

export function resolveDepartureOption(
  options: DepartureOption[],
  optionId?: string | null,
): DepartureOption | undefined {
  return optionId
    ? options.find((option) => option.id === optionId)
    : options.length === 1
      ? options[0]
      : undefined;
}
