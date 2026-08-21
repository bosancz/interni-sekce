import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PaginationOptions } from "src/helpers/pagination";
import { toPrefixTsQuery } from "src/helpers/search";
import { applySort } from "src/helpers/sort";
import { Brackets, FindOptionsRelations, Repository } from "typeorm";
import { Album } from "../entities/album.entity";
import { AlbumsMetadataService } from "../services/albums-metadata.service";
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
		private albumsMetadata: AlbumsMetadataService,
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
				"albums.createdById",
			])
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
			const search = toPrefixTsQuery(options.search);
			if (search) q.andWhere("albums.searchVector @@ to_tsquery('simple_unaccent', :search)", { search });
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

	async getDeletedAlbums(where: Brackets | string = "1=1") {
		return this.repository
			.createQueryBuilder("albums")
			.select([
				"albums.id",
				"albums.name",
				"albums.status",
				"albums.dateFrom",
				"albums.dateTill",
				"albums.datePublished",
				"albums.createdById",
				"albums.deletedAt",
			])
			.withDeleted()
			.where(where)
			.andWhere("albums.deletedAt IS NOT NULL")
			.orderBy("albums.deletedAt", "DESC")
			.getMany();
	}

	async getDeletedAlbum(id: Album["id"]) {
		return this.repository.findOne({ where: { id }, withDeleted: true });
	}

	async createAlbum(album: Partial<Album>) {
		const saved = await this.repository.save(album);
		await this.albumsMetadata.writeAlbumMetadataById(saved.id);
		return saved;
	}

	async updateAlbum(id: Album["id"], album: Partial<Album>) {
		const saved = await this.repository.save({ ...album, id });
		await this.albumsMetadata.writeAlbumMetadataById(id);
		return saved;
	}

	async deleteAlbum(id: Album["id"]) {
		return this.repository.softDelete({ id });
	}

	async restoreAlbum(id: Album["id"]) {
		return this.repository.restore({ id });
	}

	async hardDeleteAlbum(id: Album["id"]) {
		await this.photosService.deletePhotosByAlbum(id);

		return this.repository.delete(id);
	}
}
