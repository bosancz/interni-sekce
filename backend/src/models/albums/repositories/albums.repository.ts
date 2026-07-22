import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PaginationOptions } from "src/helpers/pagination";
import { applySort } from "src/helpers/sort";
import { Brackets, FindOptionsRelations, Repository } from "typeorm";
import { Album } from "../entities/album.entity";
import { PhotosRepository } from "./photos.repository";

export interface GetAlbumsOptions extends PaginationOptions {
	year?: number[];
	status?: Album["status"][];
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

	async getAlbums(options: GetAlbumsOptions = {}, where: Brackets | string = "1=1") {
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
			// row-level permission filter (see Permission.canWhere)
			.where(where)
			.take(options.limit || 25)
			.skip(options.offset || 0);

		applySort(
			q,
			options,
			{
				name: "albums.name",
				dateFrom: "albums.dateFrom",
				status: "albums.status",
				datePublished: "albums.datePublished",
			},
			{ column: "albums.dateFrom", order: "DESC" },
		);

		if (options.year?.length) {
			q.andWhere(
				new Brackets((qb) => {
					for (const [index, year] of options.year!.entries()) {
						qb.orWhere(`date_till >= :yearStart${index} AND date_from <= :yearEnd${index}`, {
							[`yearStart${index}`]: `${year}-01-01`,
							[`yearEnd${index}`]: `${year}-12-31`,
						});
					}
				}),
			);
		}

		if (options.status?.length) q.andWhere("albums.status IN (:...statuses)", { statuses: options.status });

		if (options.search) {
			const search = `%${options.search}%`;
			q.andWhere("albums.name ILIKE :search", { search });
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

	async getAlbum(id: number, relations: FindOptionsRelations<Album> = {}) {
		return this.repository.findOne({ where: { id }, relations });
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
