import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { PhotoEmbedding } from "../entities/photo-embedding.entity";
import { Photo } from "../entities/photo.entity";
import {
	bufferToHalves,
	encodeHalfEmbeddings,
	halvesToBuffer,
	PHOTO_EMBEDDING_DIMENSION,
	PhotoVectorIndex,
} from "../helpers/photo-embeddings";
import { PhotoEmbeddedResult, PhotoSearchHit } from "../schema/photo-embeddings";

const LOAD_ID_RANGE = 5000;
const CACHE_IDLE_MS = 30 * 60_000;

@Injectable()
export class PhotoEmbeddingsService implements OnModuleDestroy {
	private logger = new Logger(PhotoEmbeddingsService.name);

	private index: PhotoVectorIndex | null = null;
	private loading: Promise<PhotoVectorIndex> | null = null;
	private pendingUpdates = new Map<number, Uint16Array | null>();
	private idleTimer?: ReturnType<typeof setTimeout>;
	private version = 0;

	constructor(
		@InjectRepository(PhotoEmbedding) private photoEmbeddings: Repository<PhotoEmbedding>,
		@InjectRepository(Photo) private photos: Repository<Photo>,
		private dataSource: DataSource,
	) {}

	onModuleDestroy() {
		clearTimeout(this.idleTimer);
	}

	get indexVersion() {
		return this.version;
	}

	async getPhotosForEmbedding(limit: number) {
		return this.photos
			.createQueryBuilder("photos")
			.where("NOT EXISTS (SELECT 1 FROM photo_embeddings e WHERE e.photo_id = photos.id)")
			.orderBy("photos.timestamp", "DESC")
			.addOrderBy("photos.id", "DESC")
			.take(limit)
			.getMany();
	}

	async markEmbeddingFailed(photoId: Photo["id"], model: string | null, error: string) {
		await this.dataSource.transaction(async (t) => {
			await t.delete(PhotoEmbedding, { photoId });
			await t.insert(PhotoEmbedding, { photoId, crop: 0, model, error: error.slice(0, 1000), embedding: null });
		});
		this.updateIndex(photoId, null);
	}

	async saveEmbedding(result: PhotoEmbeddedResult) {
		const exists = await this.photos.existsBy({ id: result.photoId });
		if (!exists) return;

		if (result.error !== undefined) return this.markEmbeddingFailed(result.photoId, result.model, result.error);

		const vectors = result.embeddings.filter((vector) => vector.length === PHOTO_EMBEDDING_DIMENSION);
		if (!vectors.length) return this.markEmbeddingFailed(result.photoId, result.model, "Empty embedding.");

		const halves = encodeHalfEmbeddings(vectors);
		await this.dataSource.transaction(async (t) => {
			await t.delete(PhotoEmbedding, { photoId: result.photoId });
			await t.insert(
				PhotoEmbedding,
				vectors.map((_, crop) => ({
					photoId: result.photoId,
					crop,
					model: result.model,
					error: null,
					embedding: halvesToBuffer(
						halves.subarray(crop * PHOTO_EMBEDDING_DIMENSION, (crop + 1) * PHOTO_EMBEDDING_DIMENSION),
					),
				})),
			);
		});
		this.updateIndex(result.photoId, halves);
	}

	async getStats() {
		const [stats] = await this.photos.query(
			`SELECT count(p.id)::int AS "total",
				count(e.photo_id)::int AS "processed",
				count(p.id) FILTER (WHERE e.photo_id IS NULL)::int AS "pending",
				count(e.error)::int AS "failed",
				max(e.created_at) AS "lastEmbeddedAt"
			FROM photos p
			LEFT JOIN (
				SELECT photo_id, max(error) AS error, max(created_at) AS created_at
				FROM photo_embeddings GROUP BY photo_id
			) e ON e.photo_id = p.id`,
		);

		return stats as {
			total: number;
			processed: number;
			pending: number;
			failed: number;
			lastEmbeddedAt: Date | null;
		};
	}

	async search(query: number[], options: { limit: number; minScore?: number }) {
		const index = await this.getIndex();
		const hits = index.top(Float32Array.from(query), options.limit, options.minScore);

		return this.withPhotos(hits);
	}

	async withPhotos(hits: PhotoSearchHit[]) {
		if (!hits.length) return [];

		const photos = await this.photos.find({
			where: { id: In(hits.map((hit) => hit.photoId)) },
			relations: { album: true },
		});
		const photosById = new Map(photos.map((photo) => [photo.id, photo]));

		return hits.flatMap((hit) => {
			const photo = photosById.get(hit.photoId);
			return photo ? [{ photo, score: hit.score }] : [];
		});
	}

	async getIndex() {
		clearTimeout(this.idleTimer);
		this.idleTimer = setTimeout(() => (this.index = null), CACHE_IDLE_MS);
		this.idleTimer.unref?.();

		if (this.index) return this.index;
		if (!this.loading) {
			this.loading = this.loadIndex().finally(() => (this.loading = null));
		}
		return this.loading;
	}

	private updateIndex(photoId: number, halves: Uint16Array | null) {
		this.version++;
		if (this.loading) this.pendingUpdates.set(photoId, halves);
		if (!this.index) return;
		if (halves) this.index.set(photoId, halves);
		else this.index.delete(photoId);
	}

	private async loadIndex() {
		const started = Date.now();
		this.pendingUpdates.clear();

		const [{ count, max }] = await this.photoEmbeddings.query(
			`SELECT count(*)::int AS "count", coalesce(max(photo_id), 0)::int AS "max"
			FROM photo_embeddings WHERE embedding IS NOT NULL`,
		);
		const index = new PhotoVectorIndex(PHOTO_EMBEDDING_DIMENSION, Math.max(1024, count));

		for (let from = 0; from <= max; from += LOAD_ID_RANGE) {
			const rows: { photo_id: number; embedding: Buffer }[] = await this.photoEmbeddings.query(
				`SELECT photo_id, embedding FROM photo_embeddings
				WHERE embedding IS NOT NULL AND photo_id > $1 AND photo_id <= $2
				ORDER BY photo_id, crop`,
				[from, from + LOAD_ID_RANGE],
			);

			let start = 0;
			while (start < rows.length) {
				let end = start;
				while (end < rows.length && rows[end].photo_id === rows[start].photo_id) end++;
				const halves = new Uint16Array((end - start) * PHOTO_EMBEDDING_DIMENSION);
				for (let i = start; i < end; i++)
					halves.set(bufferToHalves(rows[i].embedding), (i - start) * PHOTO_EMBEDDING_DIMENSION);
				index.set(rows[start].photo_id, halves);
				start = end;
			}
		}

		for (const [photoId, halves] of this.pendingUpdates) {
			if (halves) index.set(photoId, halves);
			else index.delete(photoId);
		}
		this.pendingUpdates.clear();

		this.index = index;
		this.logger.log(`Loaded ${index.rowCount} embeddings of ${index.size} photos in ${Date.now() - started} ms.`);

		return index;
	}
}
