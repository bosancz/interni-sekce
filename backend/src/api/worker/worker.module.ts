import { Module } from "@nestjs/common";
import { AlbumsModelModule } from "src/models/albums/albums-model.module";
import { FaceDetectionController } from "./controllers/face-detection.controller";
import { PhotoCategoriesController } from "./controllers/photo-categories.controller";
import { PhotoContentController } from "./controllers/photo-content.controller";
import { WorkersController } from "./controllers/workers.controller";

@Module({
	imports: [AlbumsModelModule],
	controllers: [WorkersController, FaceDetectionController, PhotoContentController, PhotoCategoriesController],
})
export class WorkerModule {}
