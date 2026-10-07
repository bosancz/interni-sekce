export interface EmbedPhotoJob {
	photoId: number;
	path: string;
}

export type PhotoEmbeddedResult =
	| { photoId: number; model: string; embeddings: number[][]; error?: undefined }
	| { photoId: number; model: string; error: string; embeddings?: undefined };

export interface EmbedTextJob {
	texts: string[];
}

export interface EmbedTextResult {
	model: string;
	embeddings: number[][];
}

export interface PhotoSearchHit {
	photoId: number;
	score: number;
}

export interface PhotoCategoryInput {
	name: string;
	prompts: string[];
	threshold?: number;
	order?: number | null;
}
