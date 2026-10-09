const FIRST_DELAY_MS = 2000;
const MAX_DELAY_MS = 30_000;
const MAX_ATTEMPTS = 40;

export function isPhotoPending(photo: { thumbnailsAt?: string | null } | null | undefined): boolean {
	return photo?.thumbnailsAt === null;
}

export async function waitForImage(url: string, signal: AbortSignal): Promise<boolean> {
	let delay = FIRST_DELAY_MS;

	for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
		await new Promise((resolve) => setTimeout(resolve, delay));
		if (signal.aborted) return false;

		if (await loadImage(url)) return !signal.aborted;

		delay = Math.min(delay * 1.5, MAX_DELAY_MS);
	}

	return false;
}

function loadImage(url: string): Promise<boolean> {
	return new Promise((resolve) => {
		const image = new Image();
		image.onload = () => resolve(true);
		image.onerror = () => resolve(false);
		image.src = url;
	});
}
