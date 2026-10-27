export function openPdf(data: Blob) {
	const url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
	window.open(url, "_blank", "noopener");
	setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
