import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Photo } from "../entities/photo.entity";
import { PhotosFilesService } from "./photos-files.service";

@Injectable()
export class PhotosMaintenanceService {
	private readonly logger = new Logger(PhotosMaintenanceService.name);

	constructor(
		@InjectRepository(Photo) private photos: Repository<Photo>,
		private photosFiles: PhotosFilesService,
	) {}

	/**
	 * Repair photos whose stored width/height are transposed relative to how the image is actually
	 * served — EXIF-rotated originals imported from the old server, whose served thumbnail is baked
	 * upright while the stored dimensions describe the un-rotated image. The gallery then lays them
	 * out with the wrong aspect ratio and they appear distorted.
	 *
	 * The served file on disk is the source of truth: for each photo we read its displayed
	 * dimensions and swap the stored ones when the orientation disagrees. Only width/height are
	 * updated, so this never clobbers other (now live) data, and it is idempotent — a second run
	 * finds nothing left to swap. This is the in-place alternative to re-running the mongo import.
	 */
	async fixTransposedDimensions(): Promise<void> {
		const total = await this.photos.count();
		this.logger.log(`Checking ${total} photos for transposed dimensions...`);

		const batchSize = 500;
		let checked = 0;
		let fixed = 0;
		let missing = 0;

		for (let offset = 0; offset < total; offset += batchSize) {
			const batch = await this.photos.find({ order: { id: "ASC" }, skip: offset, take: batchSize });

			for (const photo of batch) {
				checked++;

				// without stored dimensions there is nothing to transpose (the gallery falls back to 3:2)
				if (!photo.width || !photo.height) continue;

				const served = await this.photosFiles.readServedDimensions(photo);
				if (!served) {
					missing++;
					continue;
				}

				const storedLandscape = photo.width >= photo.height;
				const servedLandscape = served.width >= served.height;
				if (storedLandscape === servedLandscape) continue;

				// keep the original resolution numbers, only correct their orientation
				await this.photos.update(photo.id, { width: photo.height, height: photo.width });
				fixed++;
			}

			this.logger.debug(` - ${Math.min(offset + batchSize, total)}/${total} checked, ${fixed} fixed so far...`);
		}

		this.logger.log(`Done. Checked ${checked} photos, fixed ${fixed}, ${missing} had no readable file.`);
	}
}
