import { FaceBox } from "../schema/detected-faces";

export const PHOTO_ROTATIONS = [0, 90, 180, 270] as const;

export type PhotoRotation = (typeof PHOTO_ROTATIONS)[number];

export function normalizeRotation(degrees: number): PhotoRotation {
	return ((((Math.round(degrees / 90) * 90) % 360) + 360) % 360) as PhotoRotation;
}

export function rotateFaceBox(box: FaceBox, degrees: number): FaceBox {
	switch (normalizeRotation(degrees)) {
		case 90:
			return { x: 1 - (box.y + box.height), y: box.x, width: box.height, height: box.width };
		case 180:
			return { x: 1 - (box.x + box.width), y: 1 - (box.y + box.height), width: box.width, height: box.height };
		case 270:
			return { x: box.y, y: 1 - (box.x + box.width), width: box.height, height: box.width };
		default:
			return { ...box };
	}
}
