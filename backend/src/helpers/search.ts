/**
 * Turn a raw user search string into a prefix `to_tsquery` input for the `simple_unaccent`
 * text-search configuration.
 *
 * Each whitespace-separated token is stripped of anything that isn't a letter or number (so the
 * user can't inject tsquery operators like `&`, `|`, `!`, `:` or unbalanced parens), given a `:*`
 * prefix marker, and the tokens are AND-ed together. Diacritics and case are handled by the
 * `simple_unaccent` configuration itself at query time, so they are left untouched here.
 *
 * Returns an empty string when the input has no usable tokens; callers should skip the filter in
 * that case rather than run `@@ ''` (which matches nothing).
 *
 * Example: `"Kopeč Novák"` -> `"Kopeč:* & Novák:*"` -> matches `kopecek`, `novak` (any order).
 */
export function toPrefixTsQuery(input: string): string {
	return input
		.split(/\s+/)
		.map((token) => token.replace(/[^\p{L}\p{N}]/gu, ""))
		.filter((token) => token.length > 0)
		.map((token) => `${token}:*`)
		.join(" & ");
}
