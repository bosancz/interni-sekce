import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { join } from "path";
import { Config } from "src/config";
import { FilesService } from "src/models/files/services/files.service";
import { IsNull, Repository } from "typeorm";
import { Album } from "../entities/album.entity";

/**
 * Shape of the `metadata.json` written next to an album's photos. It captures the album's
 * human-meaningful fields so the gallery could be reconstructed from the photo files alone
 * if the database were ever lost.
 */
export interface AlbumMetadata {
	id: number;
	name: string;
	description: string | null;
	dateFrom: string | null;
	dateTill: string | null;
	datePublished: Date | string | null;
}

@Injectable()
export class AlbumsMetadataService {
	private logger = new Logger(AlbumsMetadataService.name);

	constructor(
		private config: Config,
		private files: FilesService,
		@InjectRepository(Album) private repository: Repository<Album>,
	) {}

	/** Path to an album's `metadata.json`, inside its photos directory. */
	private getMetadataPath(albumId: number): string {
		return join(this.config.fs.photosDir, String(albumId), "metadata.json");
	}

	private buildMetadata(album: Album): AlbumMetadata {
		return {
			id: album.id,
			name: album.name,
			description: album.description,
			dateFrom: album.dateFrom,
			dateTill: album.dateTill,
			datePublished: album.datePublished,
		};
	}

	/**
	 * Write `metadata.json` for a single album into its photos directory. Best-effort: a failure
	 * here (e.g. disk error) is logged but never propagated, so it can't break the album
	 * create/update request that triggered it — the metadata file is a backup, not the source of
	 * truth. Pass a freshly loaded album so the file reflects the persisted state.
	 */
	async writeAlbumMetadata(album: Album): Promise<void> {
		const path = this.getMetadataPath(album.id);

		try {
			await this.files.saveFile(path, JSON.stringify(this.buildMetadata(album), null, "\t"));
		} catch (err) {
			this.logger.error(`Failed to write album metadata to ${path}: ${err}`);
		}
	}

	/** Load an album by id and (re)write its metadata file. Missing albums are skipped. */
	async writeAlbumMetadataById(albumId: number): Promise<void> {
		const album = await this.repository.findOne({ where: { id: albumId } });
		if (!album) return;

		await this.writeAlbumMetadata(album);
	}

	/** Backfill `metadata.json` for every (non-deleted) album. Backs the CLI command. */
	async writeAlbumsMetadata(): Promise<void> {
		const albums = await this.repository.find({ where: { deletedAt: IsNull() } });

		this.logger.log(`Writing metadata for ${albums.length} albums.`);

		for (const album of albums) {
			await this.writeAlbumMetadata(album);
		}

		this.logger.log("Finished writing album metadata.");
	}
}
