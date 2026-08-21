import { DateTime } from "luxon";

type DateInput = string | DateTime | null | undefined;

function toDateTime(value: DateInput): DateTime | null {
	if (!value) return null;
	const date = typeof value === "string" ? DateTime.fromISO(value) : value;
	return date.isValid ? date : null;
}

export function getAge(birthday: DateInput, at?: DateInput): number | null {
	const birthdayDate = toDateTime(birthday);
	if (!birthdayDate) return null;

	const reference = toDateTime(at) ?? DateTime.now();

	return Math.floor(reference.diff(birthdayDate, "years").years);
}

export function getAgeLabel(birthday: DateInput, at?: DateInput): string {
	const age = getAge(birthday, at);
	if (age === null) return "";

	return `${age} ${age === 1 ? "rok" : age < 5 ? "roky" : "let"}`;
}

export function hasBirthdayBetween(birthday: DateInput, from: DateInput, till: DateInput): boolean {
	const birthdayDate = toDateTime(birthday);
	const fromDate = toDateTime(from)?.startOf("day");
	const tillDate = toDateTime(till)?.endOf("day");
	if (!birthdayDate || !fromDate || !tillDate) return false;

	let next = birthdayDate.set({ year: fromDate.year }).startOf("day");
	if (next < fromDate) next = next.plus({ years: 1 });

	return next <= tillDate;
}
