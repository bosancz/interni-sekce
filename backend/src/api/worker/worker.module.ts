import { Module } from "@nestjs/common";
import { AlbumsModelModule } from "src/models/albums/albums-model.module";
import { FaceDetectionController } from "./controllers/face-detection.controller";
import { WorkersController } from "./controllers/workers.controller";

@Module({
	imports: [AlbumsModelModule],
	controllers: [WorkersController, FaceDetectionController],
})
export class WorkerModule {}
