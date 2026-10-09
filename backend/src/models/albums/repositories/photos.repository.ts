import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PaginationOptions } from "src/helpers/pagination";
import { MemberRoles } from "src/models/members/entities/member.entity";
import { User } from "src/models/users/entities/user.entity";
import { Brackets, Repository } from "typeorm";
import { AlbumStatus } from "../entities/album.entity";
import { PhotoFace } from "../entities/photo-face.entity";
import { FaceEmotion } from "../schema/detected-faces";
import { Photo } from "../entities/photo.entity";
import { PhotosFilesService } from "../services/photos-files.service";

export interface GetPhotosOptions extends PaginationOptions {
	album?: number;
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

	async getPhoto(id: Photo["id"]) {
		return this.repository.findOneBy({ id });
	}

	async createPhoto(albumId: number, file: Express.Multer.File, uploadedById: User["id"] | null) {
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
			bg: null,
			thumbnailsAt: null,
		});

		try {
			await this.photosFiles.saveOriginal(photo, file.buffer);
		} catch (err) {
			await this.repository.delete(photo.id);
			await this.photosFiles.deletePhotoFiles(photo);
			throw err;
		}

		return photo;
	}

	getPhotosWithoutThumbnails(limit: number) {
		return this.repository
			.createQueryBuilder("photos")
			.where("photos.thumbnails_at IS NULL")
			.orderBy("photos.id", "DESC")
			.take(limit)
			.getMany();
	}

	async setThumbnailsState(
		id: Photo["id"],
		state: Pick<Photo, "thumbnailsAt" | "thumbnailsError"> & Partial<Pick<Photo, "bg">>,
	) {
		await this.repository.update(id, state);
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
