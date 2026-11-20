import { PhotoFacesService } from "src/models/albums/services/photo-faces.service";
import { FaceReviewResponse } from "../dto/worker.dto";

export function toFaceReviewResponse({
	face,
	remaining,
}: Awaited<ReturnType<PhotoFacesService["getFaceForReview"]>>): FaceReviewResponse {
	if (!face?.photo) return { face: null, photo: null, remaining };

	const { photo, ...faceData } = face;

	return {
		face: faceData,
		photo: {
			id: photo.id,
			name: photo.name,
			albumId: photo.albumId,
			albumName: photo.album?.name ?? null,
			width: photo.width,
			height: photo.height,
			bg: photo.bg,
			timestamp: photo.timestamp,
		},
		remaining,
	};
}
