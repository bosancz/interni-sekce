import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, Repository } from "typeorm";
import { Album } from "../entities/album.entity";

@Injectable()
export class AlbumsService {
  constructor(@InjectRepository(Album) private albumsRepository: Repository<Album>) {}

  createQueryBuilder(alias?: string) {
    return this.albumsRepository.createQueryBuilder(alias);
  }

  async getAlbums(options?: FindManyOptions<Album>) {
    return this.albumsRepository.find(options);
  }
}
