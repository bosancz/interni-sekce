import { Injectable, Logger } from "@nestjs/common";
import { extname, join } from "path";
import { Config } from "src/config";
import exifReader = require("exif-reader");
import sharp = require("sharp");
import { FilesService } from "src/models/files/services/files.service";
import { PhotoSizes } from "src/api/albums/dto/photo.dto";
import { Photo } from "../entities/photo.entity";

// Cap decoded image size to guard against decompression-bomb uploads (roughly 24k x 24k).
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

	/**
	 * Resolve the on-disk path for a photo entity, honoring the legacy layout for photos
	 * imported from the old Mongo server. Those files were never moved (there are gigabytes
	 * of them); they stay keyed by Mongo ObjectId in the legacy directories, whereas natively
	 * uploaded photos use the numeric-id layout. The file extension is derived from the
	 * photo's original name, exactly as the old server did.
	 */
	getPhotoImagePath(photo: Photo, size: PhotoSizes): string {
		const ext = extname(photo.name);

		if (photo.srcAlbumId && photo.srcId) {
			if (size === PhotoSizes.original) {
				return join(this.config.fs.legacyPhotosDir, photo.srcAlbumId, `${photo.srcId}${ext}`);
			}
			return join(this.config.fs.legacyThumbsDir, photo.srcAlbumId, `${photo.srcId}_${size}${ext}`);
		}

		return this.getImagePath(photo.albumId, photo.id, size, ext);
	}

	/** Read image dimensions, dominant background color and capture date from the buffer. */
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
			const resized = await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS })
				.rotate()
				.resize(size.width, size.height, { fit: "inside" })
				// intentionally drop EXIF (incl. GPS) from the derived variants that are served to clients
				.toBuffer();

			await this.files.saveFile(this.getImagePath(albumId, photoId, name as PhotoSizes, ext), resized);
		}
	}

	/** Remove the original file and all resized variants from disk. Missing files are ignored. */
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
