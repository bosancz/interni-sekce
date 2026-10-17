export function pickInsuranceCardExpiration(
	dates: string[],
	birthday: string | null | undefined,
	today: string,
): string | null {
	const found = [...new Set(dates)].sort();

	if (found.length === 1) return found[0] !== birthday && found[0] >= today ? found[0] : null;

	const candidates =
		birthday && found.includes(birthday) ? found.filter((date) => date !== birthday) : found.slice(1);

	const expiration = candidates.at(-1);
	if (!expiration || (birthday && expiration <= birthday)) return null;

	return expiration;
}
