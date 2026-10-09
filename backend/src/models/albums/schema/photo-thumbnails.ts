export interface PhotoThumbnailsJob {
	photoId: number;
	path: string;
	sizes: Record<string, { width: number; height: number }>;
}

export type PhotoThumbnailsResult =
	| { photoId: number; thumbnails: Record<string, string>; bg: string | null; error?: undefined }
	| { photoId: number; error: string; thumbnails?: undefined; bg?: undefined };
