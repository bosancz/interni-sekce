/**
 * Variable symbol of a member's membership fee: the last two digits of the year followed by the
 * member id padded to five digits (member 1 in 2026 → `2600001`). Always derived, never entered by
 * hand, so the treasurer can map any incoming payment back to a member and a season.
 *
 * Derived here rather than read from the API because the treasurer view shows it for whichever year
 * is on screen, while the payment request only ever describes the current one.
 * Mirrors `backend/src/helpers/variable-symbol.ts`.
 */
export function getVariableSymbol(member: { id: number }, year: number = new Date().getFullYear()): string {
	return String(year).slice(-2) + String(member.id).padStart(5, "0");
}
