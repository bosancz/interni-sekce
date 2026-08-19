/**
 * Turn a raw user search string into a prefix `to_tsquery` input for the `simple_unaccent`
 * text-search configuration.
 *
 * Phone numbers are normalised as the indexed columns normalise them, then the input is split on
 * anything that isn't a letter or number (so the user can't inject tsquery operators like `&`, `|`,
 * `!`, `:` or unbalanced parens), each token is given a `:*` prefix marker, and the tokens are
 * AND-ed together. Diacritics and case are handled by the `simple_unaccent` configuration itself at
 * query time, so they are left untouched here.
 *
 * Returns an empty string when the input has no usable tokens; callers should skip the filter in
 * that case rather than run `@@ ''` (which matches nothing).
 *
 * Example: `"Kopeč Novák"` -> `"Kopeč:* & Novák:*"` -> matches `kopecek`, `novak` (any order).
 */
export function toPrefixTsQuery(input: string): string {
	return normalizePhoneNumbers(input)
		.split(/[^\p{L}\p{N}]+/u)
		.filter((token) => token.length > 0)
		.map((token) => `${token}:*`)
		.join(" & ");
}

export function normalizePhoneNumbers(input: string): string {
	return input.replace(/(?<=\d)[\s-]+(?=\d)/g, "").replace(/(\+|00)420/g, "");
}
