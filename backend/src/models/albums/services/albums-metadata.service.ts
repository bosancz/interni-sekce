import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { join } from "path";
import { Config } from "src/config";
import { FilesService } from "src/models/files/services/files.service";
import { IsNull, Repository } from "typeorm";
import { Album } from "../entities/album.entity";
import { Photo } from "../entities/photo.entity";

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
		@InjectRepository(Photo) private photosRepository: Repository<Photo>,
	) {}

	/** Absolute path of one of the photos directories, given its name. */
	private getAlbumDirPath(albumDir: string): string {
		return join(this.config.fs.photosDir, albumDir);
	}

	/** Path to an album's `metadata.json` inside the given photos directory. */
	private getMetadataPath(albumDir: string): string {
		return join(this.getAlbumDirPath(albumDir), "metadata.json");
	}

	/**
	 * The photos directories an album's files actually live in, as used by
	 * `PhotosFilesService.getPhotoImagePath`: photos imported from the old Mongo server sit in a
	 * directory named after their legacy album ObjectId (`srcAlbumId`), natively uploaded ones in
	 * one named after the numeric album id. An album can have both (photos added to an imported
	 * album), so this returns every distinct directory — the metadata file belongs next to the
	 * photos, wherever they are. Albums with no photos at all fall back to the numeric id.
	 */
	private resolveAlbumDirs(albumId: number, srcAlbumIds: (string | null)[]): string[] {
		const dirs = new Set(srcAlbumIds.filter((id): id is string => !!id));

		if (!dirs.size || srcAlbumIds.some((id) => !id)) dirs.add(String(albumId));

		return [...dirs];
	}

	/** Look up which photos directories a single album's files live in. */
	private async getAlbumDirs(albumId: number): Promise<string[]> {
		const photos = await this.photosRepository.find({ where: { albumId }, select: { srcAlbumId: true } });

		return this.resolveAlbumDirs(
			albumId,
			photos.map((photo) => photo.srcAlbumId),
		);
	}

	/** Photos directories of every album that has photos, keyed by album id, in a single query. */
	private async getAllAlbumDirs(): Promise<Map<number, string[]>> {
		const photos = await this.photosRepository.find({ select: { albumId: true, srcAlbumId: true } });

		const srcAlbumIds = new Map<number, (string | null)[]>();
		for (const photo of photos) {
			const ids = srcAlbumIds.get(photo.albumId) ?? [];
			ids.push(photo.srcAlbumId);
			srcAlbumIds.set(photo.albumId, ids);
		}

		return new Map([...srcAlbumIds].map(([albumId, ids]) => [albumId, this.resolveAlbumDirs(albumId, ids)]));
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
	 * Write `metadata.json` for a single album into every directory its photos live in. Best-effort:
	 * a failure here (e.g. disk error) is logged but never propagated, so it can't break the album
	 * create/update request that triggered it — the metadata file is a backup, not the source of
	 * truth. Pass a freshly loaded album so the file reflects the persisted state; pass `albumDirs`
	 * to reuse directories already looked up in bulk.
	 */
	async writeAlbumMetadata(album: Album, albumDirs?: string[]): Promise<void> {
		let dirs: string[];

		try {
			dirs = albumDirs ?? (await this.getAlbumDirs(album.id));
		} catch (err) {
			this.logger.error(`Failed to resolve photos directories of album ${album.id}: ${err}`);
			return;
		}

		const content = JSON.stringify(this.buildMetadata(album), null, "\t");

		for (const dir of dirs) {
			const path = this.getMetadataPath(dir);

			try {
				await this.files.saveFile(path, content);
			} catch (err) {
				this.logger.error(`Failed to write album metadata to ${path}: ${err}`);
			}
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
		const [albums, dirsByAlbum] = await Promise.all([
			this.repository.find({ where: { deletedAt: IsNull() } }),
			this.getAllAlbumDirs(),
		]);

		this.logger.log(`Writing metadata for ${albums.length} albums.`);

		for (const album of albums) {
			await this.writeAlbumMetadata(album, dirsByAlbum.get(album.id) ?? [String(album.id)]);
		}

		this.logger.log("Finished writing album metadata.");
	}

	/**
	 * Delete `metadata.json` files stranded in a photos directory an album's photos do not live in.
	 * Metadata used to always be written under the numeric album id, so albums whose photos all sit
	 * in the legacy ObjectId layout have a leftover file there — usually in a directory that holds
	 * nothing else, which is removed too. Only files of albums still present in the database, whose
	 * photos are known to be in another directory, are deleted; a `metadata.json` that could be the
	 * last remaining record of an album is never touched. Backs the CLI command.
	 */
	async cleanAlbumsMetadata(): Promise<void> {
		// soft-deleted albums keep their photos on disk, so their stale files are worth cleaning too
		const [albums, dirsByAlbum] = await Promise.all([
			this.repository.find({ withDeleted: true }),
			this.getAllAlbumDirs(),
		]);

		this.logger.log(`Checking metadata of ${albums.length} albums for stale files.`);

		let deleted = 0;

		for (const album of albums) {
			const dirs = dirsByAlbum.get(album.id);

			// an album with no photos, or with photos in the numeric directory, keeps its metadata there
			if (!dirs || dirs.includes(String(album.id))) continue;

			const path = this.getMetadataPath(String(album.id));

			try {
				await this.files.fileAccessible(path);
			} catch {
				continue; // nothing stale left behind for this album
			}

			try {
				await this.files.deleteFile(path);
				deleted++;
				this.logger.verbose(
					`Deleted stale metadata ${path}, photos of album ${album.id} are in ${dirs.join(", ")}.`,
				);
			} catch (err) {
				this.logger.error(`Failed to delete stale album metadata ${path}: ${err}`);
				continue;
			}

			await this.deleteAlbumDirIfEmpty(String(album.id));
		}

		this.logger.log(`Finished cleaning album metadata, deleted ${deleted} stale files.`);
	}

	/** Remove a photos directory that the deleted metadata file was the only thing left in. */
	private async deleteAlbumDirIfEmpty(albumDir: string): Promise<void> {
		const path = this.getAlbumDirPath(albumDir);

		try {
			if ((await this.files.readDir(path)).length) return;

			await this.files.deleteDir(path);
			this.logger.verbose(`Removed empty photos directory ${path}.`);
		} catch (err) {
			this.logger.warn(`Failed to remove empty photos directory ${path}: ${err}`);
		}
	}
}
