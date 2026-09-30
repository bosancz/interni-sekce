import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AlbumsModelModule } from "src/models/albums/albums-model.module";
import { Album } from "src/models/albums/entities/album.entity";
import { MembersModelModule } from "src/models/members/members-model.module";
import { AlbumsController } from "./controllers/albums.controller";
import { PhotoFacesController } from "./controllers/photo-faces.controller";
import { PhotosController } from "./controllers/photos.controller";

@Module({
	imports: [AlbumsModelModule, MembersModelModule, TypeOrmModule.forFeature([Album])],
	controllers: [AlbumsController, PhotosController, PhotoFacesController],
})
export class AlbumsModule {}
