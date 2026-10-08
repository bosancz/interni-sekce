import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, Put, Query, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { Config } from "src/config";
import { FaceReviewOrder } from "src/models/albums/schema/detected-faces";
import { PhotoFacesMatchingService } from "src/models/albums/services/photo-faces-matching.service";
import { PhotoFacesService } from "src/models/albums/services/photo-faces.service";
import { FacesDetectionService } from "src/models/worker/services/faces-detection.service";
import {
	FaceDetectionBatchPermission,
	FaceDetectionLogPermission,
	FaceDetectionSummaryPermission,
	FaceMatchingRunPermission,
	FaceMatchingSettingsUpdatePermission,
	FaceMatchingSummaryPermission,
	FaceReviewPermission,
} from "../acl/worker.acl";
import {
	FaceDetectionBatchBody,
	FaceDetectionBatchResponse,
	FaceDetectionLogEntryResponse,
	FaceDetectionLogQuery,
	FaceDetectionSummaryResponse,
	FaceMatchingSettingsResponse,
	FaceMatchingSettingsUpdateBody,
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
		private facesDetectionService: FacesDetectionService,
	) {}

	@Get()
	@AcLinks(FaceDetectionSummaryPermission)
	@ApiResponse({ status: 200, type: FaceDetectionSummaryResponse })
	async getFaceDetectionSummary(@Req() req: Request): Promise<FaceDetectionSummaryResponse> {
		FaceDetectionSummaryPermission.canOrThrow(req);

		const [stats, queue] = await Promise.all([
			this.photoFacesService.getDetectionStats(),
			this.facesDetectionService.getQueueStatus(),
		]);

		return {
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

		const queued = await this.facesDetectionService.enqueueBatch(body.limit);

		return { queued };
	}

	@Get("matching")
	@AcLinks(FaceMatchingSummaryPermission)
	@ApiResponse({ status: 200, type: FaceMatchingSummaryResponse })
	async getFaceMatchingSummary(@Req() req: Request): Promise<FaceMatchingSummaryResponse> {
		FaceMatchingSummaryPermission.canOrThrow(req);

		const [settings, faces, analysis, queue] = await Promise.all([
			this.photoFacesMatchingService.getSettings(),
			this.photoFacesMatchingService.getFacesStats(),
			this.photoFacesMatchingService.getAnalysis(),
			this.facesDetectionService.getQueueStatus(),
		]);

		return {
			settings,
			status: this.photoFacesMatchingService.getStatus(),
			faces,
			analysis,
			nextMatchAt: queue.nextMatchAt,
		};
	}

	@Put("matching/settings")
	@AcLinks(FaceMatchingSettingsUpdatePermission)
	@ApiResponse({ status: 200, type: FaceMatchingSettingsResponse })
	async updateFaceMatchingSettings(
		@Req() req: Request,
		@Body() body: FaceMatchingSettingsUpdateBody,
	): Promise<FaceMatchingSettingsResponse> {
		FaceMatchingSettingsUpdatePermission.canOrThrow(req);

		const settings = await this.photoFacesMatchingService.updateSettings({ threshold: body.threshold });

		this.photoFacesMatchingService.matchAll().catch((err) => this.logger.error(`Face matching failed: ${err}`));

		return settings;
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
			{
				filter: query.filter,
				excludePhotoIds: query.excludePhotoIds,
				memberId: query.memberId,
				faceId: query.faceId,
			},
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
