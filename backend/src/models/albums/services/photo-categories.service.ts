import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Not, Repository } from "typeorm";
import { PhotoCategory } from "../entities/photo-category.entity";
import { Photo } from "../entities/photo.entity";
import { decodeEmbedding, encodeEmbedding } from "../helpers/photo-embeddings";
import { PhotoCategoryInput } from "../schema/photo-embeddings";
import { PhotoEmbeddingsService } from "./photo-embeddings.service";

const MAX_CATEGORY_PHOTOS = 100_000;

@Injectable()
export class PhotoCategoriesService {
	private embeddings: Map<number, Float32Array> | null = null;
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
				embedding: encodeEmbedding(embedding.vector),
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
			...(embedding ? { model: embedding.model, embedding: encodeEmbedding(embedding.vector) } : {}),
		});
		this.invalidate();

		return this.getCategory(categoryId);
	}

	async deleteCategory(categoryId: PhotoCategory["id"]) {
		await this.photoCategories.delete(categoryId);
		this.invalidate();
	}

	async getPhotoCounts() {
		const index = await this.photoEmbeddingsService.getIndex();
		const version = this.photoEmbeddingsService.indexVersion;
		if (this.counts && this.countsVersion === version) return this.counts;

		const [categories, embeddings] = await Promise.all([this.getCategories(), this.getEmbeddings()]);
		const counts = new Map<number, number>();

		for (const category of categories) {
			const embedding = embeddings.get(category.id);
			counts.set(category.id, embedding ? index.count(embedding, category.threshold) : 0);
		}

		this.counts = counts;
		this.countsVersion = version;

		return counts;
	}

	async getCategoryPhotos(category: PhotoCategory, options: { limit: number; offset: number }) {
		const embedding = (await this.getEmbeddings()).get(category.id);
		if (!embedding) return [];

		const index = await this.photoEmbeddingsService.getIndex();
		const hits = index
			.top(embedding, Math.min(options.offset + options.limit, MAX_CATEGORY_PHOTOS), category.threshold)
			.slice(options.offset);

		return this.photoEmbeddingsService.withPhotos(hits);
	}

	async getPhotoCategories(photoId: Photo["id"]) {
		const index = await this.photoEmbeddingsService.getIndex();
		if (!index.has(photoId)) return [];

		const [categories, embeddings] = await Promise.all([this.getCategories(), this.getEmbeddings()]);

		return categories
			.map((category) => {
				const embedding = embeddings.get(category.id);
				return { category, score: embedding ? (index.score(photoId, embedding) ?? -1) : -1 };
			})
			.filter(({ category, score }) => score >= category.threshold)
			.sort((a, b) => b.score - a.score);
	}

	async previewCategory(vector: number[], limit: number) {
		const index = await this.photoEmbeddingsService.getIndex();

		return this.photoEmbeddingsService.withPhotos(index.top(Float32Array.from(vector), limit));
	}

	private async getEmbeddings() {
		if (this.embeddings) return this.embeddings;

		const rows = await this.photoCategories
			.createQueryBuilder("categories")
			.select(["categories.id", "categories.embedding"])
			.where("categories.embedding IS NOT NULL")
			.getMany();

		this.embeddings = new Map(rows.map((row) => [row.id, decodeEmbedding(row.embedding!)]));

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
