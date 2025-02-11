import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PaginationOptions } from "src/helpers/pagination";
import { Member } from "src/models/members/entities/member.entity";
import { Repository } from "typeorm";
import { Photo } from "../entities/photo.entity";

export interface GetPhotosOptions extends PaginationOptions {
	album?: number;
}

@Injectable()
export class PhotosRepository {
	constructor(@InjectRepository(Photo) private repository: Repository<Photo>) {}

	getPhotos(options: GetPhotosOptions = {}) {
		const q = this.repository
			.createQueryBuilder("photos")
			.select(["photos.id", "photos.name", "photos.status"])
			.take(options.limit || 25)
			.skip(options.offset || 0);

		if (options.album) q.where("photos.album_id = :album", { album: options.album });

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

	async createPhoto(albumId: number, photo: Omit<Photo, "id">, file: Express.Multer.File) {
		// TODO: save file

		return this.repository.save({ photo, albumId });
	}

	async updatePhoto(id: Photo["id"], photo: Partial<Photo>) {
		return this.repository.save({ ...photo, id });
	}

	async deletePhoto(id: Photo["id"]) {
		//TODO: delete files
		return await this.repository.delete(id);
	}

	async deletePhotosByAlbum(albumId: Photo["albumId"]) {
		const photos = await this.repository.findBy({ albumId });

		for (let photo of photos) {
			await this.deletePhoto(photo.id);
		}
	}
}
