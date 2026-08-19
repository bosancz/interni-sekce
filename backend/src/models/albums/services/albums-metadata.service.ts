import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { join } from "path";
import { Config } from "src/config";
import { FilesService } from "src/models/files/services/files.service";
import { IsNull, Repository } from "typeorm";
import { Album } from "../entities/album.entity";
import { Photo } from "../entities/photo.entity";

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

	private getAlbumDirPath(albumDir: string): string {
		return join(this.config.fs.photosDir, albumDir);
	}

	private getMetadataPath(albumDir: string): string {
		return join(this.getAlbumDirPath(albumDir), "metadata.json");
	}

	private resolveAlbumDirs(albumId: number, srcAlbumIds: (string | null)[]): string[] {
		const dirs = new Set(srcAlbumIds.filter((id): id is string => !!id));

		if (!dirs.size || srcAlbumIds.some((id) => !id)) dirs.add(String(albumId));

		return [...dirs];
	}

	private async getAlbumDirs(albumId: number): Promise<string[]> {
		const photos = await this.photosRepository.find({ where: { albumId }, select: { srcAlbumId: true } });

		return this.resolveAlbumDirs(
			albumId,
			photos.map((photo) => photo.srcAlbumId),
		);
	}

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

	async writeAlbumMetadataById(albumId: number): Promise<void> {
		const album = await this.repository.findOne({ where: { id: albumId } });
		if (!album) return;

		await this.writeAlbumMetadata(album);
	}

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

	async cleanAlbumsMetadata(): Promise<void> {
		const [albums, dirsByAlbum] = await Promise.all([
			this.repository.find({ withDeleted: true }),
			this.getAllAlbumDirs(),
		]);

		this.logger.log(`Checking metadata of ${albums.length} albums for stale files.`);

		let deleted = 0;

		for (const album of albums) {
			const dirs = dirsByAlbum.get(album.id);

			if (!dirs || dirs.includes(String(album.id))) continue;

			const path = this.getMetadataPath(String(album.id));

			try {
				await this.files.fileAccessible(path);
			} catch {
				continue;
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
