import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Member } from "src/models/members/entities/member.entity";
import { Repository } from "typeorm";
import { Photo } from "../entities/photo.entity";

@Injectable()
export class PhotosService {
  constructor(@InjectRepository(Photo) public repository: Repository<Photo>) {}

  async getPhotosByMemberFace(memberId: Member["id"], options: { limit?: number } = {}) {
    const query = this.repository
      .createQueryBuilder("photos")
      .innerJoin("photos.faces", "faces")
      .where("faces.member_id = :member", { member: memberId })
      .orderBy("date DESC");

    if (options.limit) query.limit(options.limit);

    return query.getMany();
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
