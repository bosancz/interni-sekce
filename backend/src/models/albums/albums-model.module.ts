import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FilesModule } from "src/models/files/files.module";
import { NotificationsModelModule } from "src/models/notifications/notifications-model.module";
import { SettingsModelModule } from "src/models/settings/settings-model.module";
import { WORKER_TASK_QUEUE, WorkerTasks } from "src/models/worker/worker-queues";
import { CleanAlbumsMetadataCommand } from "./commands/clean-album-metadata.command";
import { FacesMatchCommand } from "./commands/faces-match.command";
import { FacesNotifyCommand } from "./commands/faces-notify.command";
import { FixPhotoDimensionsCommand } from "./commands/fix-photo-dimensions.command";
import { PhotosExifCommand } from "./commands/photos-exif.command";
import { WriteAlbumsMetadataCommand } from "./commands/write-album-metadata.command";
import { Album } from "./entities/album.entity";
import { PhotoCategory } from "./entities/photo-category.entity";
import { PhotoEmbedding } from "./entities/photo-embedding.entity";
import { PhotoFace } from "./entities/photo-face.entity";
import { Photo } from "./entities/photo.entity";
import { AlbumsRepository } from "./repositories/albums.repository";
import { PhotosRepository } from "./repositories/photos.repository";
import { AlbumsMetadataService } from "./services/albums-metadata.service";
import { PhotoCategoriesService } from "./services/photo-categories.service";
import { PhotoEmbeddingsService } from "./services/photo-embeddings.service";
import { FaceMatchingWorkerService } from "./services/face-matching-worker.service";
import { PhotoFacesMatchingService } from "./services/photo-faces-matching.service";
import { PhotoFacesNotificationsService } from "./services/photo-faces-notifications.service";
import { PhotoFacesService } from "./services/photo-faces.service";
import { PhotosFilesService } from "./services/photos-files.service";
import { PhotosMaintenanceService } from "./services/photos-maintenance.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([Album, Photo, PhotoFace, PhotoEmbedding, PhotoCategory]),
		FilesModule,
		NotificationsModelModule,
		SettingsModelModule,
		BullModule.registerQueue({ name: WORKER_TASK_QUEUE(WorkerTasks.matchFaces) }),
	],
	providers: [
		AlbumsRepository,
		AlbumsMetadataService,
		PhotoCategoriesService,
		PhotoEmbeddingsService,
		PhotoFacesService,
		FaceMatchingWorkerService,
		PhotoFacesMatchingService,
		PhotoFacesNotificationsService,
		PhotosRepository,
		PhotosFilesService,
		PhotosMaintenanceService,
		WriteAlbumsMetadataCommand,
		CleanAlbumsMetadataCommand,
		FixPhotoDimensionsCommand,
		PhotosExifCommand,
		FacesMatchCommand,
		FacesNotifyCommand,
	],
	exports: [
		AlbumsRepository,
		PhotosRepository,
		PhotosFilesService,
		PhotoCategoriesService,
		PhotoEmbeddingsService,
		PhotoFacesService,
		PhotoFacesMatchingService,
		PhotoFacesNotificationsService,
	],
})
export class AlbumsModelModule {}
