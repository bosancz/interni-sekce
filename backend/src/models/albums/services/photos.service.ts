import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Member } from "src/models/members/entities/member.entity";
import { Repository } from "typeorm";
import { Photo } from "../entities/photo.entity";

@Injectable()
export class PhotosService {
  constructor(@InjectRepository(Photo) private photosRepository: Repository<Photo>) {}

  async getPhotosByMember(memberId: Member["id"], options: { limit?: number } = {}) {
    const query = this.photosRepository
      .createQueryBuilder("photos")
      .innerJoin("photos.faces", "faces")
      .where("faces.member_id = :member", { member: memberId })
      .orderBy("date DESC");

    if (options.limit) query.limit(options.limit);

    return query.getMany();
  }
}
