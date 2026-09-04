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

/**
 * The membership year a variable symbol was issued for — the inverse of {@link getVariableSymbol}.
 *
 * The symbol only carries the last two digits of the year, so they are read back into the current
 * century (`26` → 2026); that is the same assumption the symbol itself makes by dropping them.
 * Returns `null` for anything that is not a symbol this app generated, so the caller can fall back
 * to the year it is showing rather than print a nonsensical one.
 *
 * Used by the payment e-mail, which has to name the year the recipient is being asked to pay for —
 * and that is the year of the variable symbol they are given, not necessarily today's.
 */
export function getVariableSymbolYear(variableSymbol: string): number | null {
	if (!/^\d{7}$/.test(variableSymbol)) return null;

	return Math.floor(new Date().getFullYear() / 100) * 100 + Number(variableSymbol.slice(0, 2));
}
