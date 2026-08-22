export function sanitizeFilename(czech: string): string {
	return czech
		.trim()
		.replace(/\s/g, "_")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");
}

export function contentDispositionFilename(filename: string): string {
	const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");

	return `filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
