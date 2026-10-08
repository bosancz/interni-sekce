import {
	Body,
	Controller,
	Get,
	GatewayTimeoutException,
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
import { PhotoEmbeddingsService } from "src/models/albums/services/photo-embeddings.service";
import { PhotoContentService } from "src/models/worker/services/photo-content.service";
import {
	PhotoContentBatchPermission,
	PhotoContentSearchPermission,
	PhotoContentSummaryPermission,
} from "../acl/worker.acl";
import {
	PhotoContentBatchBody,
	PhotoContentBatchResponse,
	PhotoContentSearchHitResponse,
	PhotoContentSearchQuery,
	PhotoContentSummaryResponse,
} from "../dto/photo-content.dto";

const SEARCH_LIMIT = 60;

@Controller("photo-content")
@Authenticated()
@AcController()
@ApiTags("Worker")
export class PhotoContentController {
	private logger = new Logger(PhotoContentController.name);

	constructor(
		private photoEmbeddingsService: PhotoEmbeddingsService,
		private config: Config,
		@Optional() private photoContentService?: PhotoContentService,
	) {}

	@Get()
	@AcLinks(PhotoContentSummaryPermission)
	@ApiResponse({ status: 200, type: PhotoContentSummaryResponse })
	async getPhotoContentSummary(@Req() req: Request): Promise<PhotoContentSummaryResponse> {
		PhotoContentSummaryPermission.canOrThrow(req);

		const [photos, queue] = await Promise.all([
			this.photoEmbeddingsService.getStats(),
			this.photoContentService?.getQueueStatus() ?? null,
		]);

		return {
			enabled: !!this.photoContentService,
			batchSize: this.config.photoContent.batchSize,
			photos,
			queue,
		};
	}

	@Post("batch")
	@AcLinks(PhotoContentBatchPermission)
	@ApiResponse({ status: 201, type: PhotoContentBatchResponse })
	async enqueuePhotoContentBatch(
		@Req() req: Request,
		@Body() body: PhotoContentBatchBody,
	): Promise<PhotoContentBatchResponse> {
		PhotoContentBatchPermission.canOrThrow(req);

		if (!this.photoContentService)
			throw new ServiceUnavailableException("Photo content recognition is not configured.");

		const queued = await this.photoContentService.enqueueBatch(body.limit);

		return { queued };
	}

	@Get("search")
	@AcLinks(PhotoContentSearchPermission)
	@ApiResponse({ status: 200, type: PhotoContentSearchHitResponse, isArray: true })
	async searchPhotoContent(
		@Req() req: Request,
		@Query() query: PhotoContentSearchQuery,
	): Promise<PhotoContentSearchHitResponse[]> {
		PhotoContentSearchPermission.canOrThrow(req);

		if (!this.photoContentService)
			throw new ServiceUnavailableException("Photo content recognition is not configured.");

		let embedding: number[];
		try {
			embedding = await this.photoContentService.embedText(query.q);
		} catch (err) {
			this.logger.warn(`Text embedding failed: ${err}`);
			throw new GatewayTimeoutException("Worker did not answer, is any worker running the embed-text task?");
		}

		const hits = await this.photoEmbeddingsService.search(embedding, {
			limit: query.limit ?? SEARCH_LIMIT,
			minScore: query.minScore,
		});

		return hits.map(({ photo, score }) => ({
			photoId: photo.id,
			photoName: photo.name,
			photoTitle: photo.title,
			albumId: photo.albumId,
			albumName: photo.album?.name ?? null,
			score,
		}));
	}
}
