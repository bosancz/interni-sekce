import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Logger,
	NotFoundException,
	Optional,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Query,
	Req,
	ServiceUnavailableException,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { PhotoCategory } from "src/models/albums/entities/photo-category.entity";
import { Photo } from "src/models/albums/entities/photo.entity";
import { meanEmbedding } from "src/models/albums/helpers/photo-embeddings";
import { PhotoCategoriesService } from "src/models/albums/services/photo-categories.service";
import { PhotoContentService } from "src/models/worker/services/photo-content.service";
import {
	PhotoCategoriesListPermission,
	PhotoCategoryCreatePermission,
	PhotoCategoryDeletePermission,
	PhotoCategoryEditPermission,
	PhotoCategoryPhotosPermission,
	PhotoCategoryPreviewPermission,
	PhotoCategoryReadPermission,
} from "../acl/worker.acl";
import {
	PhotoCategoryCreateBody,
	PhotoCategoryPhotosQuery,
	PhotoCategoryPreviewBody,
	PhotoCategoryResponse,
	PhotoCategoryUpdateBody,
	PhotoContentSearchHitResponse,
} from "../dto/photo-content.dto";

const CATEGORY_PHOTOS_LIMIT = 60;
const PREVIEW_LIMIT = 120;

@Controller("photo-categories")
@Authenticated()
@AcController()
@ApiTags("Worker")
export class PhotoCategoriesController {
	private logger = new Logger(PhotoCategoriesController.name);

	constructor(
		private photoCategoriesService: PhotoCategoriesService,
		@Optional() private photoContentService?: PhotoContentService,
	) {}

	@Get()
	@AcLinks(PhotoCategoriesListPermission)
	@ApiResponse({ status: 200, type: WithLinks(PhotoCategoryResponse), isArray: true })
	async listPhotoCategories(@Req() req: Request): Promise<PhotoCategoryResponse[]> {
		PhotoCategoriesListPermission.canOrThrow(req);

		const [categories, counts] = await Promise.all([
			this.photoCategoriesService.getCategories(),
			this.photoCategoriesService.getPhotoCounts(),
		]);

		return categories.map((category) => ({ ...category, photosCount: counts.get(category.id) ?? 0 }));
	}

	@Post()
	@AcLinks(PhotoCategoryCreatePermission)
	@ApiResponse({ status: 201, type: WithLinks(PhotoCategoryResponse) })
	async createPhotoCategory(
		@Req() req: Request,
		@Body() body: PhotoCategoryCreateBody,
	): Promise<PhotoCategoryResponse> {
		PhotoCategoryCreatePermission.canOrThrow(req);

		return this.photoCategoriesService.createCategory(body, await this.embedPrompts(body.prompts));
	}

	@Post("preview")
	@AcLinks(PhotoCategoryPreviewPermission)
	@HttpCode(HttpStatus.OK)
	@ApiResponse({ status: 200, type: PhotoContentSearchHitResponse, isArray: true })
	async previewPhotoCategory(
		@Req() req: Request,
		@Body() body: PhotoCategoryPreviewBody,
	): Promise<PhotoContentSearchHitResponse[]> {
		PhotoCategoryPreviewPermission.canOrThrow(req);

		const { vector } = await this.embedPrompts(body.prompts);
		const hits = await this.photoCategoriesService.previewCategory(vector, body.limit ?? PREVIEW_LIMIT);

		return hits.map(toHit);
	}

	@Get(":categoryId")
	@AcLinks(PhotoCategoryReadPermission)
	@ApiResponse({ status: 200, type: WithLinks(PhotoCategoryResponse) })
	async getPhotoCategory(
		@Req() req: Request,
		@Param("categoryId", ParseIntPipe) categoryId: number,
	): Promise<PhotoCategoryResponse> {
		const category = await this.findCategory(categoryId);
		PhotoCategoryReadPermission.canOrThrow(req, category);

		const counts = await this.photoCategoriesService.getPhotoCounts();

		return { ...category, photosCount: counts.get(category.id) ?? 0 };
	}

	@Patch(":categoryId")
	@AcLinks(PhotoCategoryEditPermission)
	@ApiResponse({ status: 200, type: WithLinks(PhotoCategoryResponse) })
	async updatePhotoCategory(
		@Req() req: Request,
		@Param("categoryId", ParseIntPipe) categoryId: number,
		@Body() body: PhotoCategoryUpdateBody,
	): Promise<PhotoCategoryResponse> {
		const category = await this.findCategory(categoryId);
		PhotoCategoryEditPermission.canOrThrow(req, category);

		const embedding = body.prompts ? await this.embedPrompts(body.prompts) : undefined;

		return (await this.photoCategoriesService.updateCategory(categoryId, body, embedding))!;
	}

	@Delete(":categoryId")
	@AcLinks(PhotoCategoryDeletePermission)
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiResponse({ status: 204 })
	async deletePhotoCategory(@Req() req: Request, @Param("categoryId", ParseIntPipe) categoryId: number) {
		const category = await this.findCategory(categoryId);
		PhotoCategoryDeletePermission.canOrThrow(req, category);

		await this.photoCategoriesService.deleteCategory(categoryId);
	}

	@Get(":categoryId/photos")
	@AcLinks(PhotoCategoryPhotosPermission)
	@ApiResponse({ status: 200, type: PhotoContentSearchHitResponse, isArray: true })
	async listPhotoCategoryPhotos(
		@Req() req: Request,
		@Param("categoryId", ParseIntPipe) categoryId: number,
		@Query() query: PhotoCategoryPhotosQuery,
	): Promise<PhotoContentSearchHitResponse[]> {
		const category = await this.findCategory(categoryId);
		PhotoCategoryPhotosPermission.canOrThrow(req, category);

		const hits = await this.photoCategoriesService.getCategoryPhotos(category, {
			limit: query.limit ?? CATEGORY_PHOTOS_LIMIT,
			offset: query.offset ?? 0,
		});

		return hits.map(toHit);
	}

	private async findCategory(categoryId: PhotoCategory["id"]) {
		const category = await this.photoCategoriesService.getCategory(categoryId);
		if (!category) throw new NotFoundException();
		return category;
	}

	private async embedPrompts(prompts: string[]) {
		if (!this.photoContentService)
			throw new ServiceUnavailableException("Photo content recognition is not configured.");

		try {
			const vectors = await this.photoContentService.embedTexts(prompts);
			return { model: this.photoContentService.textModel ?? "", vector: meanEmbedding(vectors) };
		} catch (err) {
			this.logger.warn(`Text embedding failed: ${err}`);
			throw new ServiceUnavailableException("Worker did not answer, is any worker running the embed-text task?");
		}
	}
}

function toHit({ photo, score }: { photo: Photo; score: number }): PhotoContentSearchHitResponse {
	return {
		photoId: photo.id,
		photoName: photo.name,
		photoTitle: photo.title,
		albumId: photo.albumId,
		albumName: photo.album?.name ?? null,
		score,
	};
}
