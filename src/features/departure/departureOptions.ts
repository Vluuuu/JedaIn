import type { EoPackageRecord } from "../eo/types";

export interface DepartureOption {
  id: string;
  areaLabel: string;
  meetingPointLabel: string;
  departureTimeLabel: string;
  // Omitted on legacy final-price options; null means an unfinished cost entry.
  departureCostPerPerson?: number | null;
  pricePerPerson: number;
}

export function createDepartureOption(): DepartureOption {
  return {
    id: `departure_${crypto.randomUUID()}`,
    areaLabel: "",
    meetingPointLabel: "",
    departureTimeLabel: "",
    departureCostPerPerson: null,
    pricePerPerson: 0,
  };
}

export function isValidDepartureOption(option: DepartureOption): boolean {
  return Boolean(
    option.id?.trim() &&
    option.areaLabel?.trim() &&
    option.meetingPointLabel?.trim() &&
    option.departureTimeLabel?.trim() &&
    (option.departureCostPerPerson === undefined ||
      (option.departureCostPerPerson !== null &&
        Number.isSafeInteger(option.departureCostPerPerson) &&
        option.departureCostPerPerson >= 0)) &&
    Number.isSafeInteger(option.pricePerPerson) &&
    option.pricePerPerson > 0,
  );
}

export function priceDepartureOptions(
  options: DepartureOption[] | undefined,
  sharedPrice: number,
): DepartureOption[] | undefined {
  return options?.map((option) => {
    const cost = option.departureCostPerPerson;
    if (cost === undefined) return { ...option };
    const finalPrice = cost === null ? 0 : sharedPrice + cost;
    return {
      ...option,
      pricePerPerson:
        cost !== null &&
        Number.isSafeInteger(cost) &&
        cost >= 0 &&
        Number.isSafeInteger(sharedPrice) &&
        sharedPrice >= 0 &&
        Number.isSafeInteger(finalPrice) &&
        finalPrice > 0
          ? finalPrice
          : 0,
    };
  });
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
    priceDepartureOptions(
      pkg.departureOptions,
      pkg.pricing.destinationBaseCost +
        pkg.pricing.localGuideFee +
        pkg.pricing.eoMargin,
    ) ?? [
      legacyDepartureOption(
        pkg.packageId,
        pkg.pricing.customerPrice,
        pkg.meetingPointLabel,
        pkg.departureTimeLabel,
      ),
    ]
  );
}

export function travelerDepartureOptions(
  options: DepartureOption[] | undefined,
): DepartureOption[] | undefined {
  return options?.map(
    ({
      id,
      areaLabel,
      meetingPointLabel,
      departureTimeLabel,
      pricePerPerson,
    }) => ({
      id,
      areaLabel,
      meetingPointLabel,
      departureTimeLabel,
      pricePerPerson,
    }),
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
