export function sanitizeFilename(czech: string): string {
	return czech
		.trim()
		.replace(/\s/g, "_")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");
}
