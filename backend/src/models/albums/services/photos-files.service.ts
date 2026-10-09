import { Injectable, Logger } from "@nestjs/common";
import { extname, join } from "path";
import { Config } from "src/config";
import exifReader = require("exif-reader");
import sharp = require("sharp");
import { FilesService } from "src/models/files/services/files.service";
import { PhotoSizes } from "src/api/albums/dto/photo.dto";
import { Photo } from "../entities/photo.entity";
import { FaceBox } from "../schema/detected-faces";

const MAX_INPUT_PIXELS = 24000 * 24000;

const FACE_IMAGE_SIZE = 256;
const FACE_IMAGE_PADDING = 0.3;

export interface PhotoMetadata {
	width: number | null;
	height: number | null;
	timestamp: Date;
}

export type PhotoThumbnailSize = Exclude<PhotoSizes, PhotoSizes.original>;

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
			} catch {}
		}

		return null;
	}

	async extractMetadata(buffer: Buffer): Promise<PhotoMetadata> {
		const metadata = await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();

		const swapAxes = typeof metadata.orientation === "number" && metadata.orientation >= 5;

		return {
			width: (swapAxes ? metadata.height : metadata.width) ?? null,
			height: (swapAxes ? metadata.width : metadata.height) ?? null,
			timestamp: this.readCaptureDate(metadata.exif) ?? new Date(),
		};
	}

	get thumbnailSizes(): PhotoThumbnailSize[] {
		return Object.keys(this.config.photos.sizes) as PhotoThumbnailSize[];
	}

	async saveOriginal(photo: Photo, buffer: Buffer): Promise<void> {
		await this.files.saveFile(this.getPhotoImagePath(photo, PhotoSizes.original), buffer);
	}

	async createThumbnails(photo: Photo, input?: Buffer): Promise<{ bg: string | null }> {
		const source = input ?? this.getPhotoImagePath(photo, PhotoSizes.original);
		const sizes = Object.entries(this.config.photos.sizes).sort(
			([, a], [, b]) => b.width * b.height - a.width * a.height,
		);

		let smallest: Buffer | null = null;

		for (const [name, size] of sizes) {
			const resized = await sharp(source, { limitInputPixels: MAX_INPUT_PIXELS })
				.rotate()
				.resize(size.width, size.height, { fit: "inside" })
				.toBuffer();

			await this.files.saveFile(this.getPhotoImagePath(photo, name as PhotoSizes), resized);
			smallest = resized;
		}

		return { bg: smallest ? await this.getBackground(smallest) : null };
	}

	async saveThumbnails(photo: Photo, thumbnails: Partial<Record<PhotoThumbnailSize, Buffer>>): Promise<void> {
		for (const size of this.thumbnailSizes) {
			const buffer = thumbnails[size];
			if (!buffer) throw new Error(`Missing ${size} thumbnail of photo ${photo.id}.`);
			await this.files.saveFile(this.getPhotoImagePath(photo, size), buffer);
		}
	}

	private async getBackground(image: Buffer): Promise<string | null> {
		const stats = await sharp(image).removeAlpha().toColourspace("srgb").stats();
		if (stats.channels.length < 3) return null;

		return `rgb(${stats.channels
			.slice(0, 3)
			.map((channel) => Math.round(channel.mean))
			.join(",")})`;
	}

	async deletePhotoFiles(photo: Photo): Promise<void> {
		const sizes: PhotoSizes[] = [PhotoSizes.original, ...(Object.keys(this.config.photos.sizes) as PhotoSizes[])];

		await Promise.all(
			sizes.map((size) => this.files.deleteFile(this.getPhotoImagePath(photo, size)).catch(() => {})),
		);
	}

	getFaceImagePath(faceId: number): string {
		return join(this.config.fs.thumbnailsDir, "faces", `${faceId}.jpg`);
	}

	async getFaceImage(photo: Photo, faceId: number, box: FaceBox): Promise<string> {
		const path = this.getFaceImagePath(faceId);

		try {
			await this.files.fileAccessible(path);
			return path;
		} catch {}

		const image = await this.cropFace(photo, box, {
			size: FACE_IMAGE_SIZE,
			padding: FACE_IMAGE_PADDING,
			sizes: [PhotoSizes.big, PhotoSizes.original],
		});
		await this.files.saveFile(path, image);

		return path;
	}

	async deleteFaceImage(faceId: number): Promise<void> {
		await this.files.deleteFile(this.getFaceImagePath(faceId)).catch(() => {});
	}

	async cropFace(
		photo: Photo,
		box: FaceBox,
		options: { size: number; padding: number; sizes: PhotoSizes[] },
	): Promise<Buffer> {
		for (const size of options.sizes) {
			const path = this.getPhotoImagePath(photo, size);

			try {
				await this.files.fileAccessible(path);
			} catch {
				continue;
			}

			const oriented = await sharp(path, { limitInputPixels: MAX_INPUT_PIXELS })
				.rotate()
				.toBuffer({ resolveWithObject: true });

			const { width, height } = oriented.info;
			const side = Math.round(
				Math.min(Math.max(box.width * width, box.height * height) * (1 + 2 * options.padding), width, height),
			);
			const centerX = (box.x + box.width / 2) * width;
			const centerY = (box.y + box.height / 2) * height;
			const left = Math.round(Math.min(Math.max(centerX - side / 2, 0), width - side));
			const top = Math.round(Math.min(Math.max(centerY - side / 2, 0), height - side));

			return sharp(oriented.data)
				.extract({ left, top, width: Math.max(side, 1), height: Math.max(side, 1) })
				.resize(options.size, options.size, { fit: "cover" })
				.jpeg({ quality: 85 })
				.toBuffer();
		}

		throw new Error(`No image file found for photo ${photo.id}.`);
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
