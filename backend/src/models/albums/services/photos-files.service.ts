import { Injectable, Logger } from "@nestjs/common";
import archiver = require("archiver");
import { Response } from "express";
import { readFile } from "fs/promises";
import { extname, join } from "path";
import { Config } from "src/config";
import { contentDispositionFilename, sanitizeFilename } from "src/helpers/sanitizefilename";
import exifReader = require("exif-reader");
import sharp = require("sharp");
import { FilesService } from "src/models/files/services/files.service";
import { PhotoSizes } from "src/api/albums/dto/photo.dto";
import { Album } from "../entities/album.entity";
import { Photo } from "../entities/photo.entity";
import { FaceBox } from "../schema/detected-faces";
import { parsePhotoExif, PhotoExif } from "../schema/photo-exif";

const MAX_INPUT_PIXELS = 24000 * 24000;

const FACE_IMAGE_SIZE = 256;
const FACE_IMAGE_PADDING = 0.3;

export interface PhotoMetadata {
	width: number | null;
	height: number | null;
	bg: string | null;
	timestamp: Date;
	exif: PhotoExif | null;
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

	getPhotoDownloadName(photo: Photo): string {
		return sanitizeFilename(photo.name) || `${photo.id}${extname(photo.name)}`;
	}

	async sendAlbumArchive(res: Response, album: Album, photos: Photo[]): Promise<void> {
		const usedNames = new Set<string>();
		const files = photos.map((photo) => {
			let name = this.getPhotoDownloadName(photo);
			if (usedNames.has(name)) name = `${photo.id}_${name}`;
			usedNames.add(name);

			return { path: this.getPhotoImagePath(photo, PhotoSizes.original), name };
		});

		const filename = `${sanitizeFilename(album.name) || String(album.id)}.zip`;

		const archive = archiver("zip", { store: true });

		archive.on("warning", (err) => this.logger.warn(`Album ${album.id} ZIP warning: ${err.message}`));
		archive.on("error", (err) => {
			this.logger.error(`Album ${album.id} ZIP failed: ${err.message}`);
			res.destroy(err);
		});

		res.setHeader("Content-Type", "application/zip");
		res.setHeader("Content-Disposition", `attachment; ${contentDispositionFilename(filename)}`);

		archive.pipe(res);
		for (const file of files) archive.file(file.path, { name: file.name });

		await archive.finalize();
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
			exif: this.parseExif(metadata.exif),
		};
	}

	async readExif(photo: Photo): Promise<PhotoExif | null> {
		const path = this.getPhotoImagePath(photo, PhotoSizes.original);

		try {
			await this.files.fileAccessible(path);
		} catch {
			return null;
		}

		const metadata = await sharp(path, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();
		return this.parseExif(metadata.exif);
	}

	async hasPhotoFiles(albumId: number, photoId: number, ext: string, buffer: Buffer): Promise<boolean> {
		const original = await readFile(this.getImagePath(albumId, photoId, PhotoSizes.original, ext)).catch(
			() => null,
		);
		if (!original?.equals(buffer)) return false;

		const sizes = Object.keys(this.config.photos.sizes) as PhotoSizes[];
		const accessible = await Promise.all(
			sizes.map((size) =>
				this.files.fileAccessible(this.getImagePath(albumId, photoId, size, ext)).then(
					() => true,
					() => false,
				),
			),
		);
		return accessible.every(Boolean);
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

	private parseExif(exif?: Buffer): PhotoExif | null {
		try {
			return parsePhotoExif(exif);
		} catch (err) {
			this.logger.warn(`Failed to read EXIF: ${err}`);
			return null;
		}
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
