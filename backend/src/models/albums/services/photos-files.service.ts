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
	 * Resolve the on-disk path for a photo entity. Files live in the same directories the old
	 * server used; photos imported from the old Mongo server keep their existing files, keyed
	 * by the original Mongo ObjectIds (album folder + file name), while natively uploaded
	 * photos are keyed by their numeric ids. The extension is derived from the photo's
	 * original name, exactly as the old server did.
	 */
	getPhotoImagePath(photo: Photo, size: PhotoSizes): string {
		const ext = extname(photo.name);
		const albumDir = photo.srcAlbumId ?? String(photo.albumId);
		const fileId = photo.srcId ?? String(photo.id);

		if (size === PhotoSizes.original) {
			return join(this.config.fs.photosDir, albumDir, `${fileId}${ext}`);
		}
		return join(this.config.fs.thumbnailsDir, albumDir, `${fileId}_${size}${ext}`);
	}

	/**
	 * Read the width/height of a photo's on-disk image as it is actually displayed (with any EXIF
	 * orientation applied), trying the served variants in the order the frontend prefers them.
	 * Returns null when no readable file exists for the photo. Used by the dimension-repair
	 * command to detect and fix stored dimensions that are transposed relative to what is served.
	 */
	async readServedDimensions(photo: Photo): Promise<{ width: number; height: number } | null> {
		for (const size of [PhotoSizes.small, PhotoSizes.big, PhotoSizes.original]) {
			const path = this.getPhotoImagePath(photo, size);

			try {
				await this.files.fileAccessible(path);
				const metadata = await sharp(path, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();
				if (!metadata.width || !metadata.height) continue;

				// orientations 5–8 rotate the image 90°, so the displayed axes are swapped
				const swapAxes = typeof metadata.orientation === "number" && metadata.orientation >= 5;
				return {
					width: swapAxes ? metadata.height : metadata.width,
					height: swapAxes ? metadata.width : metadata.height,
				};
			} catch {
				// missing or unreadable variant — fall through to the next size
			}
		}

		return null;
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

		// EXIF orientations 5–8 rotate the image by 90°, so its displayed dimensions are the
		// stored pixel dimensions swapped. The variants we serve are baked upright with .rotate(),
		// so the dimensions we persist must describe that upright image or the gallery lays the
		// photo out with a transposed aspect ratio and it appears distorted.
		const swapAxes = typeof metadata.orientation === "number" && metadata.orientation >= 5;

		return {
			width: (swapAxes ? metadata.height : metadata.width) ?? null,
			height: (swapAxes ? metadata.width : metadata.height) ?? null,
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
