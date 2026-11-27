export function hasAccentAbove(text: string | null | undefined): boolean {
	return !!text && /[̀-̔̽̚-̈́͆͊-͌͐-͒͗͛ͣ-ͯ]/.test(text.normalize("NFD"));
}
