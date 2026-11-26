import { PhotoFacesMatchingService } from "src/models/albums/services/photo-faces-matching.service";
import { PhotoFacesService } from "src/models/albums/services/photo-faces.service";
import { FaceReviewResponse } from "../dto/worker.dto";

export async function toFaceReviewResponse(
	{ face, remaining }: Awaited<ReturnType<PhotoFacesService["getFaceForReview"]>>,
	matchingService: PhotoFacesMatchingService,
): Promise<FaceReviewResponse> {
	if (!face?.photo) return { face: null, photo: null, options: [], remaining };

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
		options: await matchingService.getReviewOptions(face),
		remaining,
	};
}
