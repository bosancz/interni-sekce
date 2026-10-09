import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, MoreThan, Repository } from "typeorm";
import { Photo } from "../entities/photo.entity";
import { PhotosRepository } from "../repositories/photos.repository";
import { PhotosFilesService } from "./photos-files.service";

@Injectable()
export class PhotosMaintenanceService {
	private readonly logger = new Logger(PhotosMaintenanceService.name);

	constructor(
		@InjectRepository(Photo) private photos: Repository<Photo>,
		private photosFiles: PhotosFilesService,
		private photosRepository: PhotosRepository,
	) {}

	async loadExif(options: { all?: boolean } = {}): Promise<void> {
		const where = options.all ? {} : { exif: IsNull() };
		const total = await this.photos.count({ where });
		this.logger.log(`Reading EXIF of ${total} photos...`);

		const batchSize = 500;
		let lastId = 0;
		let checked = 0;
		let loaded = 0;
		let missing = 0;

		while (true) {
			const batch = await this.photos.find({
				where: { ...where, id: MoreThan(lastId) },
				order: { id: "ASC" },
				take: batchSize,
			});
			if (!batch.length) break;

			for (const photo of batch) {
				lastId = photo.id;
				checked++;

				const exif = await this.photosRepository.loadPhotoExif(photo).catch((err) => {
					this.logger.warn(`Failed to read EXIF of photo ${photo.id}: ${err}`);
					return null;
				});
				if (exif) loaded++;
				else missing++;
			}

			this.logger.debug(` - ${checked}/${total} read...`);
		}

		this.logger.log(`Done. Read ${checked} photos, stored EXIF of ${loaded}, ${missing} had no readable file.`);
	}

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

				if (!photo.width || !photo.height) continue;

				const served = await this.photosFiles.readServedDimensions(photo);
				if (!served) {
					missing++;
					continue;
				}

				const storedLandscape = photo.width >= photo.height;
				const servedLandscape = served.width >= served.height;
				if (storedLandscape === servedLandscape) continue;

				await this.photos.update(photo.id, { width: photo.height, height: photo.width });
				fixed++;
			}

			this.logger.debug(` - ${Math.min(offset + batchSize, total)}/${total} checked, ${fixed} fixed so far...`);
		}

		this.logger.log(`Done. Checked ${checked} photos, fixed ${fixed}, ${missing} had no readable file.`);
	}
}
