import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { PhotoEmbedding } from "../entities/photo-embedding.entity";
import { Photo } from "../entities/photo.entity";
import { PHOTO_EMBEDDING_DIMENSION, toVectorLiteral } from "../helpers/photo-embeddings";
import { PhotoEmbeddedResult, PhotoSearchHit } from "../schema/photo-embeddings";

const VECTOR = `vector(${PHOTO_EMBEDDING_DIMENSION})`;
const PHOTO_DISTANCE = (query: string) => `min(e.embedding::${VECTOR} <#> ${query})`;

@Injectable()
export class PhotoEmbeddingsService {
	private version = 0;

	constructor(
		@InjectRepository(PhotoEmbedding) private photoEmbeddings: Repository<PhotoEmbedding>,
		@InjectRepository(Photo) private photos: Repository<Photo>,
		private dataSource: DataSource,
	) {}

	get embeddingsVersion() {
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
		this.version++;
	}

	async saveEmbedding(result: PhotoEmbeddedResult) {
		const exists = await this.photos.existsBy({ id: result.photoId });
		if (!exists) return;

		if (result.error !== undefined) return this.markEmbeddingFailed(result.photoId, result.model, result.error);

		const vectors = result.embeddings.filter((vector) => vector.length === PHOTO_EMBEDDING_DIMENSION);
		if (!vectors.length) return this.markEmbeddingFailed(result.photoId, result.model, "Empty embedding.");

		await this.dataSource.transaction(async (t) => {
			await t.delete(PhotoEmbedding, { photoId: result.photoId });
			await t.insert(
				PhotoEmbedding,
				vectors.map((embedding, crop) => ({
					photoId: result.photoId,
					crop,
					model: result.model,
					error: null,
					embedding,
				})),
			);
		});
		this.version++;
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

	async search(query: ArrayLike<number>, options: { limit: number; offset?: number; minScore?: number }) {
		return this.withPhotos(await this.getTopPhotos(query, options));
	}

	async getTopPhotos(
		query: ArrayLike<number>,
		options: { limit: number; offset?: number; minScore?: number },
	): Promise<PhotoSearchHit[]> {
		const rows: PhotoSearchHit[] = await this.dataSource.query(
			`SELECT e.photo_id AS "photoId", -${PHOTO_DISTANCE(`$1::${VECTOR}`)} AS "score"
			FROM photo_embeddings e
			WHERE e.embedding IS NOT NULL
			GROUP BY e.photo_id
			HAVING $2::float8 IS NULL OR -${PHOTO_DISTANCE(`$1::${VECTOR}`)} >= $2::float8
			ORDER BY ${PHOTO_DISTANCE(`$1::${VECTOR}`)}, e.photo_id
			LIMIT $3 OFFSET $4`,
			[toVectorLiteral(query), options.minScore ?? null, options.limit, options.offset ?? 0],
		);

		return rows;
	}

	async countPhotos(queries: { query: ArrayLike<number>; minScore: number }[]) {
		if (!queries.length) return [];

		const rows: { index: number; count: number }[] = await this.dataSource.query(
			`SELECT q.index::int AS "index", (
				SELECT count(*) FROM (
					SELECT 1 FROM photo_embeddings e
					WHERE e.embedding IS NOT NULL
					GROUP BY e.photo_id
					HAVING -${PHOTO_DISTANCE("q.query")} >= q.min_score
				) hits
			)::int AS "count"
			FROM unnest($1::${VECTOR}[], $2::float8[]) WITH ORDINALITY AS q(query, min_score, index)`,
			[queries.map((query) => toVectorLiteral(query.query)), queries.map((query) => query.minScore)],
		);

		return rows.sort((a, b) => a.index - b.index).map((row) => row.count);
	}

	async getPhotoScores(photoId: Photo["id"], queries: ArrayLike<number>[]) {
		if (!queries.length) return [];

		const rows: { index: number; score: number }[] = await this.dataSource.query(
			`SELECT q.index::int AS "index", -${PHOTO_DISTANCE("q.query")} AS "score"
			FROM photo_embeddings e
			CROSS JOIN unnest($2::${VECTOR}[]) WITH ORDINALITY AS q(query, index)
			WHERE e.photo_id = $1 AND e.embedding IS NOT NULL
			GROUP BY q.index`,
			[photoId, queries.map((query) => toVectorLiteral(query))],
		);

		const scores = new Array<number | null>(queries.length).fill(null);
		for (const row of rows) scores[row.index - 1] = row.score;
		return scores;
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
}
