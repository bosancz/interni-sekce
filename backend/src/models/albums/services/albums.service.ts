import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, Repository } from "typeorm";
import { Album } from "../entities/album.entity";
import { PhotosService } from "./photos.service";

@Injectable()
export class AlbumsService {
  constructor(private photosService: PhotosService, @InjectRepository(Album) public repository: Repository<Album>) {}

  createQueryBuilder(alias?: string) {
    return this.repository.createQueryBuilder(alias);
  }

  async getAlbums(options?: FindManyOptions<Album>) {
    return this.repository.find(options);
  }

  async updateAlbum(id: Album["id"], album: Partial<Album>) {
    return this.repository.save({ ...album, id });
  }

  async deleteAlbum(id: Album["id"]) {
    await this.photosService.deletePhotosByAlbum(id);

    return this.repository.delete(id);
  }
}
