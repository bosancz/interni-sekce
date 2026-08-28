import { DateTime } from "luxon";

type DateInput = string | DateTime | null | undefined;

export const INSURANCE_CARD_EXPIRATION_WARNING_DAYS = 30;

export type InsuranceCardExpirationState = "unknown" | "valid" | "expiring" | "expired";

function toDateTime(value: DateInput): DateTime | null {
	if (!value) return null;
	const date = typeof value === "string" ? DateTime.fromISO(value) : value;
	return date.isValid ? date : null;
}

export function getInsuranceCardExpirationDays(expiration: DateInput, at?: DateInput): number | null {
	const expirationDate = toDateTime(expiration)?.startOf("day");
	if (!expirationDate) return null;

	const reference = (toDateTime(at) ?? DateTime.now()).startOf("day");

	return Math.round(expirationDate.diff(reference, "days").days);
}

export function getInsuranceCardExpirationState(expiration: DateInput, at?: DateInput): InsuranceCardExpirationState {
	const days = getInsuranceCardExpirationDays(expiration, at);
	if (days === null) return "unknown";
	if (days < 0) return "expired";
	if (days <= INSURANCE_CARD_EXPIRATION_WARNING_DAYS) return "expiring";
	return "valid";
}

export function getInsuranceCardExpirationLabel(expiration: DateInput, at?: DateInput): string {
	const days = getInsuranceCardExpirationDays(expiration, at);
	if (days === null) return "Platnost neuvedena";
	if (days < 0) return "Platnost vypršela";
	if (days === 0) return "Platnost končí dnes";
	if (days > INSURANCE_CARD_EXPIRATION_WARNING_DAYS) return "";

	return `Vyprší za ${days} ${days === 1 ? "den" : days < 5 ? "dny" : "dní"}`;
}
