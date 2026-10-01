export enum FaceEmotion {
	angry = "angry",
	disgust = "disgust",
	fearful = "fearful",
	happy = "happy",
	neutral = "neutral",
	sad = "sad",
	surprised = "surprised",
}

export enum FacesMatchTrigger {
	all = "all",
	changes = "changes",
}

export enum PhotoFaceAssignment {
	manual = "manual",
	auto = "auto",
}

export type FaceEmotions = Partial<Record<FaceEmotion, number>>;

export interface DetectedFace {
	x: number;
	y: number;
	width: number;
	height: number;
	score: number;
	descriptor: number[];
	emotions?: FaceEmotions;
	emotion?: FaceEmotion;
}

export interface DetectFacesJob {
	photoId: number;
	path: string;
}

export type FacesDetectedResult =
	| { photoId: number; model: string; faces: DetectedFace[]; error?: undefined }
	| { photoId: number; model: string; error: string; faces?: undefined };

export interface FaceBox {
	x: number;
	y: number;
	width: number;
	height: number;
}

export enum FaceReviewOrder {
	uncertain = "uncertain",
	candidates = "candidates",
	random = "random",
}
