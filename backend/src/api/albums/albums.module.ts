import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AlbumsModelModule } from "src/models/albums/albums-model.module";
import { Album } from "src/models/albums/entities/album.entity";
import { AlbumsController } from "./controllers/albums.controller";
import { PhotosController } from "./controllers/photos.controller";

@Module({
  imports: [AlbumsModelModule, TypeOrmModule.forFeature([Album])],
  controllers: [AlbumsController, PhotosController],
})
export class AlbumsModule {}
