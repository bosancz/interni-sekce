import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Logger,
	Optional,
	Post,
	Query,
	Req,
	ServiceUnavailableException,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { Config } from "src/config";
import { FACE_MATCH_SETTINGS } from "src/models/albums/helpers/face-matching";
import { FaceReviewOrder } from "src/models/albums/schema/detected-faces";
import { PhotoFacesMatchingService } from "src/models/albums/services/photo-faces-matching.service";
import { PhotoFacesService } from "src/models/albums/services/photo-faces.service";
import { FacesDetectionService } from "src/models/worker/services/faces-detection.service";
import {
	FaceDetectionBatchPermission,
	FaceDetectionLogPermission,
	FaceDetectionSummaryPermission,
	FaceMatchingRunPermission,
	FaceMatchingSummaryPermission,
	FaceReviewPermission,
} from "../acl/worker.acl";
import {
	FaceDetectionBatchBody,
	FaceDetectionBatchResponse,
	FaceDetectionLogEntryResponse,
	FaceDetectionLogQuery,
	FaceDetectionSummaryResponse,
	FaceMatchingSummaryResponse,
	FaceReviewQuery,
	FaceReviewResponse,
} from "../dto/worker.dto";

@Controller("face-detection")
@Authenticated()
@AcController()
@ApiTags("Worker")
export class FaceDetectionController {
	private logger = new Logger(FaceDetectionController.name);

	constructor(
		private photoFacesService: PhotoFacesService,
		private photoFacesMatchingService: PhotoFacesMatchingService,
		private config: Config,
		@Optional() private facesDetectionService?: FacesDetectionService,
	) {}

	@Get()
	@AcLinks(FaceDetectionSummaryPermission)
	@ApiResponse({ status: 200, type: FaceDetectionSummaryResponse })
	async getFaceDetectionSummary(@Req() req: Request): Promise<FaceDetectionSummaryResponse> {
		FaceDetectionSummaryPermission.canOrThrow(req);

		const [stats, queue] = await Promise.all([
			this.photoFacesService.getDetectionStats(),
			this.facesDetectionService?.getQueueStatus() ?? null,
		]);

		return {
			enabled: !!this.facesDetectionService,
			schedule: {
				cron: this.config.faces.cron,
				stopCron: this.config.faces.stopCron,
				matchCron: this.config.faces.matchCron,
				timezone: this.config.faces.timezone,
				batchSize: this.config.faces.batchSize,
			},
			photos: stats.photos,
			faces: stats.faces,
			queue,
		};
	}

	@Get("log")
	@AcLinks(FaceDetectionLogPermission)
	@ApiResponse({ status: 200, type: FaceDetectionLogEntryResponse, isArray: true })
	async listFaceDetectionLog(
		@Req() req: Request,
		@Query() query: FaceDetectionLogQuery,
	): Promise<FaceDetectionLogEntryResponse[]> {
		FaceDetectionLogPermission.canOrThrow(req);

		const photos = await this.photoFacesService.getDetectionLog(query);

		return photos.map((photo) => ({
			photoId: photo.id,
			photoName: photo.name,
			albumId: photo.albumId,
			albumName: photo.album?.name ?? null,
			detectedAt: photo.facesDetectedAt!,
			model: photo.facesModel ?? null,
			error: photo.facesError ?? null,
			faces: (photo.faces ?? []).map((face) => ({
				id: face.id,
				photoId: photo.id,
				score: face.score,
				memberId: face.memberId,
				memberNickname: face.member?.nickname ?? null,
				assignment: face.assignment,
				emotions: face.emotions,
				emotion: face.emotion,
			})),
		}));
	}

	@Post("batch")
	@AcLinks(FaceDetectionBatchPermission)
	@ApiResponse({ status: 201, type: FaceDetectionBatchResponse })
	async enqueueFaceDetectionBatch(
		@Req() req: Request,
		@Body() body: FaceDetectionBatchBody,
	): Promise<FaceDetectionBatchResponse> {
		FaceDetectionBatchPermission.canOrThrow(req);

		if (!this.facesDetectionService) throw new ServiceUnavailableException("Face detection is not configured.");

		const queued = await this.facesDetectionService.enqueueBatch(body.limit);

		return { queued };
	}

	@Get("matching")
	@AcLinks(FaceMatchingSummaryPermission)
	@ApiResponse({ status: 200, type: FaceMatchingSummaryResponse })
	async getFaceMatchingSummary(@Req() req: Request): Promise<FaceMatchingSummaryResponse> {
		FaceMatchingSummaryPermission.canOrThrow(req);

		const [faces, analysis, queue] = await Promise.all([
			this.photoFacesMatchingService.getFacesStats(),
			this.photoFacesMatchingService.getAnalysis(),
			this.facesDetectionService?.getQueueStatus() ?? null,
		]);

		return {
			settings: FACE_MATCH_SETTINGS,
			status: this.photoFacesMatchingService.getStatus(),
			faces,
			analysis,
			nextMatchAt: queue?.nextMatchAt ?? null,
		};
	}

	@Post("match")
	@AcLinks(FaceMatchingRunPermission)
	@HttpCode(HttpStatus.ACCEPTED)
	@ApiResponse({ status: 202 })
	async runFaceMatching(@Req() req: Request): Promise<void> {
		FaceMatchingRunPermission.canOrThrow(req);

		this.photoFacesMatchingService.matchAll().catch((err) => this.logger.error(`Face matching failed: ${err}`));
	}

	@Get("review")
	@AcLinks(FaceReviewPermission)
	@ApiResponse({ status: 200, type: FaceReviewResponse })
	async getFaceForReview(@Req() req: Request, @Query() query: FaceReviewQuery): Promise<FaceReviewResponse> {
		FaceReviewPermission.canOrThrow(req);

		const { face, remaining } = await this.photoFacesService.getFaceForReview(
			query.order ?? FaceReviewOrder.uncertain,
			{ excludePhotoIds: query.excludePhotoIds, memberId: query.memberId },
		);
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
}
