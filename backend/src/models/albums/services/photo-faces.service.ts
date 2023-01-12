import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Member } from "src/models/members/entities/member.entity";
import { Repository } from "typeorm";
import { PhotoFace } from "../entities/photo-face.entity";

@Injectable()
export class PhotoFacesService {
  constructor(@InjectRepository(PhotoFace) private photoFacesRepository: Repository<PhotoFace>) {}

  async getFacesByMember(memberId: Member["id"], options: { limit?: number } = {}) {
    return this.photoFacesRepository.find({ where: { memberId }, take: options.limit });
  }

  async getSimilarFaces(faceId: number, options: { limit?: number } = {}) {
    const query = this.photoFacesRepository
      .createQueryBuilder("faces")
      .leftJoin("photo_faces", "face", "face.id = :face", { face: faceId })
      .where("faces.descriptor <-> face.descriptor < :treshold", { treshold: 0.6 });

    if (options.limit) query.limit(options.limit);

    return query.getMany();
  }
}
