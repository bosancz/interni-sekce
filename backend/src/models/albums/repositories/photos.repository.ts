import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { extname } from "path";
import { PaginationOptions } from "src/helpers/pagination";
import { MemberRoles } from "src/models/members/entities/member.entity";
import { User } from "src/models/users/entities/user.entity";
import { Brackets, In, Repository } from "typeorm";
import { AlbumStatus } from "../entities/album.entity";
import { PhotoFace } from "../entities/photo-face.entity";
import { FaceEmotion } from "../schema/detected-faces";
import { PhotoExif } from "../schema/photo-exif";
import { Photo } from "../entities/photo.entity";
import { PHOTO_EMBEDDING_DIMENSION, toVectorLiteral } from "../helpers/photo-embeddings";
import { PhotosFilesService } from "../services/photos-files.service";

const VECTOR = `vector(${PHOTO_EMBEDDING_DIMENSION})`;

export interface GetPhotosOptions extends PaginationOptions {
	album?: number;
}

export interface BrowsePhotosOptions {
	query?: ArrayLike<number>;
	dateFrom?: string;
	dateTill?: string;
	categories?: { query: ArrayLike<number>; minScore: number }[];
	memberIds?: number[];
	emotions?: FaceEmotion[];
	limit: number;
	offset: number;
	timezone?: string;
}

@Injectable()
export class PhotosRepository {
	constructor(
		@InjectRepository(Photo) private repository: Repository<Photo>,
		@InjectRepository(PhotoFace) private facesRepository: Repository<PhotoFace>,
		private photosFiles: PhotosFilesService,
	) {}

	getPhotos(options: GetPhotosOptions = {}, where: Brackets | string = "1=1") {
		const q = this.repository
			.createQueryBuilder("photos")
			.where(where)
			.orderBy("photos.order", "ASC", "NULLS LAST")
			.addOrderBy("photos.timestamp", "ASC");

		if (options.album) q.andWhere("photos.album_id = :album", { album: options.album });

		if (options.offset) q.skip(options.offset);

		if (options.limit) q.take(options.limit);
		else if (!options.album) q.take(50);

		return q.getMany();
	}

	async browsePhotos(options: BrowsePhotosOptions) {
		const params: unknown[] = [];
		const param = (value: unknown) => {
			params.push(value);
			return `$${params.length}`;
		};

		const joins: string[] = [];
		const conditions: string[] = ["a.deleted_at IS NULL"];
		const timezone = options.timezone ?? "Europe/Prague";

		if (options.query) {
			joins.push(
				`INNER JOIN (
					SELECT e.photo_id, min(e.embedding::${VECTOR} <#> ${param(toVectorLiteral(options.query))}::${VECTOR}) AS distance
					FROM photo_embeddings e
					WHERE e.embedding IS NOT NULL
					GROUP BY e.photo_id
				) s ON s.photo_id = p.id`,
			);
		}

		if (options.dateFrom) {
			conditions.push(
				`p.timestamp >= (${param(options.dateFrom)}::date::timestamp AT TIME ZONE ${param(timezone)})`,
			);
		}

		if (options.dateTill) {
			conditions.push(
				`p.timestamp < ((${param(options.dateTill)}::date + 1)::timestamp AT TIME ZONE ${param(timezone)})`,
			);
		}

		const emotions = options.emotions?.length ? [...new Set(options.emotions)] : null;

		if (options.memberIds?.length) {
			const memberIds = [...new Set(options.memberIds)];
			conditions.push(
				`p.id IN (
					SELECT f.photo_id FROM photo_faces f
					WHERE f.member_id = ANY(${param(memberIds)}::int[])
					${emotions ? `AND f.emotion = ANY(${param(emotions)}::varchar[])` : ""}
					GROUP BY f.photo_id
					HAVING count(DISTINCT f.member_id) = ${param(memberIds.length)}
				)`,
			);
		} else if (emotions) {
			conditions.push(
				`p.id IN (SELECT f.photo_id FROM photo_faces f WHERE f.emotion = ANY(${param(emotions)}::varchar[]))`,
			);
		}

		if (options.categories?.length) {
			conditions.push(
				`p.id IN (
					SELECT c.photo_id FROM (
						SELECT e.photo_id, q.min_score, -min(e.embedding::${VECTOR} <#> q.query) AS score
						FROM photo_embeddings e
						CROSS JOIN unnest(
							${param(options.categories.map((category) => toVectorLiteral(category.query)))}::${VECTOR}[],
							${param(options.categories.map((category) => category.minScore))}::float8[]
						) WITH ORDINALITY AS q(query, min_score, index)
						WHERE e.embedding IS NOT NULL
						GROUP BY e.photo_id, q.index, q.min_score
					) c
					WHERE c.score >= c.min_score
					GROUP BY c.photo_id
					HAVING count(*) = ${param(options.categories.length)}
				)`,
			);
		}

		const order = options.query ? "s.distance ASC, p.id ASC" : "p.timestamp DESC, p.id DESC";

		const rows: { id: number }[] = await this.repository.query(
			`SELECT p.id
			FROM photos p
			INNER JOIN albums a ON a.id = p.album_id
			${joins.join("\n")}
			WHERE ${conditions.join(" AND ")}
			ORDER BY ${order}
			LIMIT ${param(options.limit)} OFFSET ${param(options.offset)}`,
			params,
		);

		if (!rows.length) return [];

		const photos = await this.repository.find({
			where: { id: In(rows.map((row) => row.id)) },
			relations: { album: true },
		});
		const photosById = new Map(photos.map((photo) => [photo.id, photo]));

		return rows.flatMap((row) => photosById.get(row.id) ?? []);
	}

	async getPhoto(id: Photo["id"]) {
		return this.repository.findOneBy({ id });
	}

	async getPhotoExif(photo: Photo): Promise<PhotoExif | null> {
		const stored = await this.repository.findOne({ select: { id: true, exif: true }, where: { id: photo.id } });
		return stored?.exif ?? null;
	}

	async loadPhotoExif(photo: Photo): Promise<PhotoExif | null> {
		const exif = await this.photosFiles.readExif(photo);
		if (exif) await this.repository.update(photo.id, { exif });

		return exif;
	}

	async createPhoto(albumId: number, file: Express.Multer.File, uploadedById: User["id"] | null) {
		const ext = extname(file.originalname);
		const metadata = await this.photosFiles.extractMetadata(file.buffer);

		const { max } = await this.repository
			.createQueryBuilder("photos")
			.select("MAX(photos.order)", "max")
			.where("photos.album_id = :albumId", { albumId })
			.getRawOne();

		const photo = await this.repository.save({
			albumId,
			uploadedById,
			name: file.originalname,
			timestamp: metadata.timestamp,
			order: (max ?? 0) + 1,
			width: metadata.width,
			height: metadata.height,
			bg: metadata.bg,
			exif: metadata.exif,
		});

		try {
			await this.photosFiles.savePhotoFiles(albumId, photo.id, ext, file.buffer);
		} catch (err) {
			await this.repository.delete(photo.id);
			await this.photosFiles.deletePhotoFiles(photo);
			throw err;
		}

		return photo;
	}

	async updatePhoto(id: Photo["id"], photo: Partial<Photo>) {
		return this.repository.save({ ...photo, id });
	}

	async reorderPhotos(albumId: Photo["albumId"], photoIds: number[]) {
		await this.repository.query(
			`UPDATE "photos" SET "order" = u.ord
			 FROM unnest($1::int[]) WITH ORDINALITY AS u(id, ord)
			 WHERE "photos".id = u.id AND "photos".album_id = $2`,
			[photoIds, albumId],
		);
	}

	async setTitlePhoto(albumId: Photo["albumId"], photoId: Photo["id"] | null) {
		await this.repository.manager.transaction(async (t) => {
			await t.query(`UPDATE "photos" SET "title_photo" = false WHERE "album_id" = $1`, [albumId]);

			if (photoId != null) {
				await t.query(`UPDATE "photos" SET "title_photo" = true WHERE "id" = $1 AND "album_id" = $2`, [
					photoId,
					albumId,
				]);
			}
		});
	}

	async getTitlePhoto(albumId: Photo["albumId"]) {
		return this.repository.findOne({ where: { albumId, titlePhoto: true } });
	}

	async getCoverPhotosByAlbums(albumIds: Photo["albumId"][]) {
		const map = new Map<number, Photo>();
		if (!albumIds.length) return map;

		const photos = await this.repository
			.createQueryBuilder("photos")
			.distinctOn(["photos.albumId"])
			.where("photos.album_id IN (:...albumIds)", { albumIds })
			.orderBy("photos.albumId", "ASC")
			.addOrderBy("photos.titlePhoto", "DESC")
			.addOrderBy("photos.order", "ASC", "NULLS LAST")
			.addOrderBy("photos.timestamp", "ASC")
			.getMany();

		for (const photo of photos) map.set(photo.albumId, photo);

		return map;
	}

	async getTitlePhotosByAlbums(albumIds: Photo["albumId"][]) {
		const map = new Map<number, Photo>();
		if (!albumIds.length) return map;

		const photos = await this.repository
			.createQueryBuilder("photos")
			.where("photos.album_id IN (:...albumIds)", { albumIds })
			.andWhere("photos.title_photo = true")
			.getMany();

		for (const photo of photos) map.set(photo.albumId, photo);

		return map;
	}

	async getDailyPhoto(timezone = "Europe/Prague") {
		const photo = await this.repository
			.createQueryBuilder("photos")
			.innerJoinAndSelect("photos.album", "album")
			.where("album.status = :status", { status: AlbumStatus.public })
			.andWhere(
				`EXISTS (
					SELECT 1 FROM photo_faces faces
					INNER JOIN members ON members.id = faces.member_id
					WHERE faces.photo_id = photos.id
						AND faces.emotion = :emotion
						AND members.role = :role
						AND members.deleted_at IS NULL
				)`,
				{ role: MemberRoles.vedouci, emotion: FaceEmotion.happy },
			)
			.orderBy("md5(photos.id::text || (now() AT TIME ZONE :timezone)::date::text)")
			.setParameter("timezone", timezone)
			.limit(1)
			.getOne();

		if (!photo) return { photo: null, leaders: [] };

		const faces = await this.facesRepository
			.createQueryBuilder("faces")
			.innerJoinAndSelect("faces.member", "member")
			.where("faces.photo_id = :photoId", { photoId: photo.id })
			.andWhere("member.role = :role", { role: MemberRoles.vedouci })
			.orderBy("faces.x + faces.width / 2", "ASC")
			.getMany();

		const leaders = new Map<number, { id: number; nickname: string }>();
		for (const { member } of faces) {
			if (member && !leaders.has(member.id)) leaders.set(member.id, { id: member.id, nickname: member.nickname });
		}

		return { photo, leaders: [...leaders.values()] };
	}

	async deletePhoto(id: Photo["id"]) {
		const photo = await this.repository.findOneBy({ id });
		if (!photo) return;

		const faces = await this.facesRepository.find({ select: { id: true }, where: { photoId: id } });

		await this.repository.delete(id);
		await this.photosFiles.deletePhotoFiles(photo);
		await Promise.all(faces.map((face) => this.photosFiles.deleteFaceImage(face.id)));
	}

	async deletePhotosByAlbum(albumId: Photo["albumId"]) {
		const photos = await this.repository.findBy({ albumId });

		for (let photo of photos) {
			await this.deletePhoto(photo.id);
		}
	}
}
