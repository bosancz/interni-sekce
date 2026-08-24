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
