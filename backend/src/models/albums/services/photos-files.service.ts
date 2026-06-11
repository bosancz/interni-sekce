import { Injectable, Logger } from "@nestjs/common";
import { join } from "path";
import { Config } from "src/config";
import exifReader = require("exif-reader");
import sharp = require("sharp");
import { FilesService } from "src/models/files/services/files.service";
import { PhotoSizes } from "src/api/albums/dto/photo.dto";

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

	/** Whether the given (lowercased, dot-less) extension is an accepted image type. */
	isAllowedType(ext: string): boolean {
		return this.config.photos.allowedTypes.includes(ext);
	}

	/** Resolve only if the file exists and is readable. */
	async fileExists(path: string): Promise<void> {
		return this.files.fileAccessible(path);
	}

	/** Path to a photo file on disk for the given size. `ext` includes the leading dot. */
	getImagePath(albumId: number, photoId: number, size: PhotoSizes, ext: string): string {
		if (size === PhotoSizes.original) {
			return join(this.config.fs.photosDir, String(albumId), `${photoId}${ext}`);
		}
		return join(this.config.fs.thumbnailsDir, String(albumId), `${photoId}_${size}${ext}`);
	}

	/** Read image dimensions, dominant background color and capture date from the buffer. */
	async extractMetadata(buffer: Buffer): Promise<PhotoMetadata> {
		const image = sharp(buffer);
		const [metadata, stats] = await Promise.all([image.metadata(), image.stats()]);

		const bg =
			stats.channels.length >= 3
				? `rgb(${stats.channels
						.slice(0, 3)
						.map((channel) => Math.round(channel.mean))
						.join(",")})`
				: null;

		return {
			width: metadata.width ?? null,
			height: metadata.height ?? null,
			bg,
			timestamp: this.readCaptureDate(metadata.exif) ?? new Date(),
		};
	}

	/** Write the original file and all configured resized variants to disk. */
	async savePhotoFiles(albumId: number, photoId: number, ext: string, buffer: Buffer): Promise<void> {
		await this.files.saveFile(this.getImagePath(albumId, photoId, PhotoSizes.original, ext), buffer);

		for (const [name, size] of Object.entries(this.config.photos.sizes)) {
			const resized = await sharp(buffer)
				.rotate()
				.resize(size.width, size.height, { fit: "inside" })
				.withMetadata()
				.toBuffer();

			await this.files.saveFile(this.getImagePath(albumId, photoId, name as PhotoSizes, ext), resized);
		}
	}

	/** Remove the original file and all resized variants from disk. Missing files are ignored. */
	async deletePhotoFiles(albumId: number, photoId: number, ext: string): Promise<void> {
		const sizes: PhotoSizes[] = [PhotoSizes.original, ...(Object.keys(this.config.photos.sizes) as PhotoSizes[])];

		await Promise.all(
			sizes.map((size) =>
				this.files.deleteFile(this.getImagePath(albumId, photoId, size, ext)).catch(() => {}),
			),
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
