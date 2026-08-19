import { Injectable, Logger } from "@nestjs/common";
import { extname, join } from "path";
import { Config } from "src/config";
import exifReader = require("exif-reader");
import sharp = require("sharp");
import { FilesService } from "src/models/files/services/files.service";
import { PhotoSizes } from "src/api/albums/dto/photo.dto";
import { Photo } from "../entities/photo.entity";

const MAX_INPUT_PIXELS = 24000 * 24000;

export interface PhotoMetadata {
	width: number | null;
	height: number | null;
	bg: string | null;
	timestamp: Date;
}

@Injectable()
export class PhotosFilesService {
	private logger = new Logger(PhotosFilesService.name);

	constructor(
		private config: Config,
		private files: FilesService,
	) {}

	isAllowedType(ext: string): boolean {
		return this.config.photos.allowedTypes.includes(ext);
	}

	async fileExists(path: string): Promise<void> {
		return this.files.fileAccessible(path);
	}

	getImagePath(albumId: number, photoId: number, size: PhotoSizes, ext: string): string {
		if (size === PhotoSizes.original) {
			return join(this.config.fs.photosDir, String(albumId), `${photoId}${ext}`);
		}
		return join(this.config.fs.thumbnailsDir, String(albumId), `${photoId}_${size}${ext}`);
	}

	getPhotoImagePath(photo: Photo, size: PhotoSizes): string {
		const ext = extname(photo.name);
		const albumDir = photo.srcAlbumId ?? String(photo.albumId);
		const fileId = photo.srcId ?? String(photo.id);

		if (size === PhotoSizes.original) {
			return join(this.config.fs.photosDir, albumDir, `${fileId}${ext}`);
		}
		return join(this.config.fs.thumbnailsDir, albumDir, `${fileId}_${size}${ext}`);
	}

	async readServedDimensions(photo: Photo): Promise<{ width: number; height: number } | null> {
		for (const size of [PhotoSizes.small, PhotoSizes.big, PhotoSizes.original]) {
			const path = this.getPhotoImagePath(photo, size);

			try {
				await this.files.fileAccessible(path);
				const metadata = await sharp(path, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();
				if (!metadata.width || !metadata.height) continue;

				const swapAxes = typeof metadata.orientation === "number" && metadata.orientation >= 5;
				return {
					width: swapAxes ? metadata.height : metadata.width,
					height: swapAxes ? metadata.width : metadata.height,
				};
			} catch {
			}
		}

		return null;
	}

	async extractMetadata(buffer: Buffer): Promise<PhotoMetadata> {
		const image = sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS });
		const [metadata, stats] = await Promise.all([image.metadata(), image.stats()]);

		const bg =
			stats.channels.length >= 3
				? `rgb(${stats.channels
						.slice(0, 3)
						.map((channel) => Math.round(channel.mean))
						.join(",")})`
				: null;

		const swapAxes = typeof metadata.orientation === "number" && metadata.orientation >= 5;

		return {
			width: (swapAxes ? metadata.height : metadata.width) ?? null,
			height: (swapAxes ? metadata.width : metadata.height) ?? null,
			bg,
			timestamp: this.readCaptureDate(metadata.exif) ?? new Date(),
		};
	}

	async savePhotoFiles(albumId: number, photoId: number, ext: string, buffer: Buffer): Promise<void> {
		await this.files.saveFile(this.getImagePath(albumId, photoId, PhotoSizes.original, ext), buffer);

		for (const [name, size] of Object.entries(this.config.photos.sizes)) {
			const resized = await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS })
				.rotate()
				.resize(size.width, size.height, { fit: "inside" })
				.toBuffer();

			await this.files.saveFile(this.getImagePath(albumId, photoId, name as PhotoSizes, ext), resized);
		}
	}

	async deletePhotoFiles(photo: Photo): Promise<void> {
		const sizes: PhotoSizes[] = [PhotoSizes.original, ...(Object.keys(this.config.photos.sizes) as PhotoSizes[])];

		await Promise.all(
			sizes.map((size) => this.files.deleteFile(this.getPhotoImagePath(photo, size)).catch(() => {})),
		);
	}

	private readCaptureDate(exif?: Buffer): Date | null {
		if (!exif) return null;

		try {
			const tags = exifReader(exif);
			const date = tags.Photo?.DateTimeOriginal ?? tags.Image?.ModifyDate;
			return date instanceof Date ? date : null;
		} catch (err) {
			this.logger.warn(`Failed to read EXIF capture date: ${err}`);
			return null;
		}
	}
}
