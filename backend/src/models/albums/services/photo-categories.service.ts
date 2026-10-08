import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Not, Repository } from "typeorm";
import { PhotoCategory } from "../entities/photo-category.entity";
import { Photo } from "../entities/photo.entity";
import { PhotoCategoryInput } from "../schema/photo-embeddings";
import { PhotoEmbeddingsService } from "./photo-embeddings.service";

const MAX_CATEGORY_PHOTOS = 100_000;

@Injectable()
export class PhotoCategoriesService {
	private embeddings: Map<number, number[]> | null = null;
	private counts: Map<number, number> | null = null;
	private countsVersion = -1;

	constructor(
		@InjectRepository(PhotoCategory) private photoCategories: Repository<PhotoCategory>,
		private photoEmbeddingsService: PhotoEmbeddingsService,
	) {}

	async getCategories() {
		return this.photoCategories.find({ order: { order: { direction: "ASC", nulls: "LAST" }, name: "ASC" } });
	}

	async getCategory(categoryId: PhotoCategory["id"]) {
		return this.photoCategories.findOneBy({ id: categoryId });
	}

	async createCategory(input: PhotoCategoryInput, embedding: { model: string; vector: number[] }) {
		await this.assertUniqueName(input.name);

		const category = await this.photoCategories.save(
			this.photoCategories.create({
				...input,
				model: embedding.model,
				embedding: embedding.vector,
			}),
		);
		this.invalidate();

		return (await this.getCategory(category.id))!;
	}

	async updateCategory(
		categoryId: PhotoCategory["id"],
		input: Partial<PhotoCategoryInput>,
		embedding?: { model: string; vector: number[] },
	) {
		if (input.name !== undefined) await this.assertUniqueName(input.name, categoryId);

		await this.photoCategories.update(categoryId, {
			...input,
			...(embedding ? { model: embedding.model, embedding: embedding.vector } : {}),
		});
		this.invalidate();

		return this.getCategory(categoryId);
	}

	async deleteCategory(categoryId: PhotoCategory["id"]) {
		await this.photoCategories.delete(categoryId);
		this.invalidate();
	}

	async getPhotoCounts() {
		const version = this.photoEmbeddingsService.embeddingsVersion;
		if (this.counts && this.countsVersion === version) return this.counts;

		const [categories, embeddings] = await Promise.all([this.getCategories(), this.getEmbeddings()]);
		const queries = categories.flatMap((category) => {
			const query = embeddings.get(category.id);
			return query ? [{ categoryId: category.id, query, minScore: category.threshold }] : [];
		});
		const results = await this.photoEmbeddingsService.countPhotos(queries);

		const counts = new Map<number, number>(categories.map((category) => [category.id, 0]));
		queries.forEach((query, i) => counts.set(query.categoryId, results[i]));

		if (version === this.photoEmbeddingsService.embeddingsVersion) {
			this.counts = counts;
			this.countsVersion = version;
		}

		return counts;
	}

	async getCategoryPhotos(category: PhotoCategory, options: { limit: number; offset: number }) {
		const embedding = (await this.getEmbeddings()).get(category.id);
		if (!embedding) return [];

		const limit = Math.min(options.limit, MAX_CATEGORY_PHOTOS - options.offset);
		if (limit <= 0) return [];

		return this.photoEmbeddingsService.search(embedding, {
			limit,
			offset: options.offset,
			minScore: category.threshold,
		});
	}

	async getPhotoCategories(photoId: Photo["id"]) {
		const [categories, embeddings] = await Promise.all([this.getCategories(), this.getEmbeddings()]);
		const withEmbedding = categories.filter((category) => embeddings.has(category.id));
		const scores = await this.photoEmbeddingsService.getPhotoScores(
			photoId,
			withEmbedding.map((category) => embeddings.get(category.id)!),
		);

		return withEmbedding
			.map((category, i) => ({ category, score: scores[i] }))
			.filter((hit): hit is { category: PhotoCategory; score: number } => hit.score !== null)
			.filter(({ category, score }) => score >= category.threshold)
			.sort((a, b) => b.score - a.score);
	}

	async previewCategory(vector: number[], limit: number) {
		return this.photoEmbeddingsService.search(vector, { limit });
	}

	private async getEmbeddings() {
		if (this.embeddings) return this.embeddings;

		const rows = await this.photoCategories
			.createQueryBuilder("categories")
			.select(["categories.id", "categories.embedding"])
			.where("categories.embedding IS NOT NULL")
			.getMany();

		this.embeddings = new Map(rows.map((row) => [row.id, row.embedding!]));

		return this.embeddings;
	}

	private invalidate() {
		this.embeddings = null;
		this.counts = null;
	}

	private async assertUniqueName(name: string, exceptId?: PhotoCategory["id"]) {
		const exists = await this.photoCategories.existsBy({
			name,
			...(exceptId !== undefined ? { id: Not(exceptId) } : {}),
		});
		if (exists) throw new ConflictException(`Kategorie "${name}" už existuje.`);
	}
}
