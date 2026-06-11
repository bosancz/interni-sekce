import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { extname } from "path";
import { PaginationOptions } from "src/helpers/pagination";
import { Member } from "src/models/members/entities/member.entity";
import { User } from "src/models/users/entities/user.entity";
import { Repository } from "typeorm";
import { Photo } from "../entities/photo.entity";
import { PhotosFilesService } from "../services/photos-files.service";

export interface GetPhotosOptions extends PaginationOptions {
	album?: number;
}

@Injectable()
export class PhotosRepository {
	constructor(
		@InjectRepository(Photo) private repository: Repository<Photo>,
		private photosFiles: PhotosFilesService,
	) {}

	getPhotos(options: GetPhotosOptions = {}) {
		const q = this.repository.createQueryBuilder("photos").orderBy("photos.timestamp", "ASC");

		if (options.album) q.where("photos.album_id = :album", { album: options.album });

		if (options.offset) q.skip(options.offset);

		// return the whole album for the gallery; cap only the unfiltered global list
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

		const photo = await this.repository.save({
			albumId,
			uploadedById,
			name: file.originalname,
			timestamp: metadata.timestamp,
			width: metadata.width,
			height: metadata.height,
			bg: metadata.bg,
		});

		try {
			await this.photosFiles.savePhotoFiles(albumId, photo.id, ext, file.buffer);
		} catch (err) {
			await this.repository.delete(photo.id);
			await this.photosFiles.deletePhotoFiles(albumId, photo.id, ext);
			throw err;
		}

		return photo;
	}

	async updatePhoto(id: Photo["id"], photo: Partial<Photo>) {
		return this.repository.save({ ...photo, id });
	}

	async deletePhoto(id: Photo["id"]) {
		const photo = await this.repository.findOneBy({ id });
		if (!photo) return;

		await this.repository.delete(id);
		await this.photosFiles.deletePhotoFiles(photo.albumId, photo.id, extname(photo.name));
	}

	async deletePhotosByAlbum(albumId: Photo["albumId"]) {
		const photos = await this.repository.findBy({ albumId });

		for (let photo of photos) {
			await this.deletePhoto(photo.id);
		}
	}
}
