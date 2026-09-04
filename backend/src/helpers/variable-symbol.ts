/**
 * Variable symbol of a member's membership fee: the last two digits of the year followed by the
 * member id padded to five digits (member 1 in 2026 → `2600001`). Always derived, never entered by
 * hand, so the treasurer can map any incoming payment back to a member and a season.
 *
 * A function of the member rather than a method of the payment-request service: the treasurer view
 * lists it per year next to the fee, and the payment request is only one of its readers. It takes
 * the id structurally, so an entity, a DTO or anything else carrying one can be passed.
 * The frontend mirrors this in `src/app/core/helpers/variable-symbol.ts`.
 */
export function getVariableSymbol(member: { id: number }, year: number = new Date().getFullYear()): string {
	return String(year).slice(-2) + String(member.id).padStart(5, "0");
}

/**
 * The member a variable symbol was issued for — the inverse of {@link getVariableSymbol}.
 *
 * Returns `null` for anything that is not a symbol this app generated, so a caller handed one
 * from the outside can answer 404 rather than look up a nonsensical member. The frontend mirrors
 * the year half of the same parse in `src/app/core/helpers/variable-symbol.ts`.
 *
 * Used by the public QR platba link, which is addressed by variable symbol: it is the number the
 * recipient already has in front of them in the payment e-mail.
 */
export function getVariableSymbolMemberId(variableSymbol: string): number | null {
	if (!/^\d{7}$/.test(variableSymbol)) return null;

	return Number(variableSymbol.slice(2)) || null;
}
