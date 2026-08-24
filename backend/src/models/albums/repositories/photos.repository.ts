import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { extname } from "path";
import { PaginationOptions } from "src/helpers/pagination";
import { Member } from "src/models/members/entities/member.entity";
import { User } from "src/models/users/entities/user.entity";
import { Brackets, Repository } from "typeorm";
import { PhotoFace } from "../entities/photo-face.entity";
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

	async getPhotosByMemberFace(memberId: Member["id"], options: { limit?: number } = {}) {
		const query = this.repository
			.createQueryBuilder("photos")
			.innerJoin("photos.faces", "faces")
			.where("faces.member_id = :member", { member: memberId })
			.orderBy("date DESC");

		if (options.limit) query.limit(options.limit);

		return query.getMany();
	}

	async getPhoto(id: Photo["id"]) {
		return this.repository.findOneBy({ id });
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

	/**
	 * Set (or clear) the album's single title photo. Any previously flagged photo in the album is
	 * unset first, then the given one — when it belongs to the album — is flagged, all in one
	 * transaction so the album never briefly has two or none. Pass null to just clear the selection.
	 */
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

	/** The album's title photo (its preview thumbnail), or null when none is chosen. */
	async getTitlePhoto(albumId: Photo["albumId"]) {
		return this.repository.findOne({ where: { albumId, titlePhoto: true } });
	}

	/** The title photo of each of the given albums, keyed by album id (albums without one are absent). */
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

	async deletePhoto(id: Photo["id"]) {
		const photo = await this.repository.findOneBy({ id });
		if (!photo) return;

		await this.facesRepository.delete({ photoId: id });

		await this.repository.delete(id);
		await this.photosFiles.deletePhotoFiles(photo);
	}

	async deletePhotosByAlbum(albumId: Photo["albumId"]) {
		const photos = await this.repository.findBy({ albumId });

		for (let photo of photos) {
			await this.deletePhoto(photo.id);
		}
	}
}
