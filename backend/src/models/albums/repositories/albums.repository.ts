import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PaginationOptions } from "src/models/helpers/pagination";
import { Repository } from "typeorm";
import { Album } from "../entities/album.entity";
import { PhotosRepository } from "./photos.repository";

export interface GetAlbumsOptions extends PaginationOptions {
  year?: number;
  status?: Album["status"];
  search?: string;
}

@Injectable()
export class AlbumsRepository {
  constructor(
    private photosService: PhotosRepository,
    @InjectRepository(Album) private repository: Repository<Album>,
  ) {}

  createQueryBuilder(alias?: string) {
    return this.repository.createQueryBuilder(alias);
  }

  async getAlbums(options: GetAlbumsOptions = {}) {
    const q = this.repository
      .createQueryBuilder("albums")
      .select([
        "albums.id",
        "albums.name",
        "albums.status",
        "albums.dateFrom",
        "albums.dateTill",
        "albums.datePublished",
      ])
      .orderBy("albums.dateFrom", "DESC")
      .take(options.limit || 25)
      .skip(options.offset || 0);

    if (options.year) {
      q.andWhere("date_till >= :yearStart AND date_from <= :yearEnd", {
        yearStart: `${options.year}-01-01`,
        yearEnd: `${options.year}-12-31`,
      });
    }

    if (options.status) q.andWhere("albums.status = :status", { status: options.status });

    if (options.search) {
      const search = `%${options.search}%`;
      q.andWhere("albums.name LIKE :search", { search });
    }

    return q.getMany();
  }

  async getAlbumsYears() {
    return this.repository
      .createQueryBuilder("albums")
      .select("DISTINCT EXTRACT(YEAR FROM albums.dateFrom)", "year")
      .orderBy("year", "DESC")
      .getRawMany<{ year: string }>()
      .then((years) => years.map((y) => parseInt(y.year)));
  }

  async getAlbum(id: number) {
    return this.repository.findOneBy({ id });
  }

  async createAlbum(album: Partial<Album>) {
    return this.repository.save(album);
  }

  async updateAlbum(id: Album["id"], album: Partial<Album>) {
    return this.repository.save({ ...album, id });
  }

  async deleteAlbum(id: Album["id"]) {
    await this.photosService.deletePhotosByAlbum(id);

    return this.repository.delete(id);
  }
}
