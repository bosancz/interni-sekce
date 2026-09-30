import { Body, Controller, Get, Optional, Post, Query, Req, ServiceUnavailableException } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { Config } from "src/config";
import { PhotoFacesService } from "src/models/albums/services/photo-faces.service";
import { FacesDetectionService } from "src/models/worker/services/faces-detection.service";
import {
	FaceDetectionBatchPermission,
	FaceDetectionLogPermission,
	FaceDetectionSummaryPermission,
} from "../acl/worker.acl";
import {
	FaceDetectionBatchBody,
	FaceDetectionBatchResponse,
	FaceDetectionLogEntryResponse,
	FaceDetectionLogQuery,
	FaceDetectionSummaryResponse,
} from "../dto/worker.dto";

@Controller("face-detection")
@Authenticated()
@AcController()
@ApiTags("Worker")
export class FaceDetectionController {
	constructor(
		private photoFacesService: PhotoFacesService,
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
}
