export interface DetectedFace {
	x: number;
	y: number;
	width: number;
	height: number;
	score: number;
	descriptor: number[];
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
