import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Album } from "./entities/album.entity";
import { PhotoFace } from "./entities/photo-face.entity";
import { Photo } from "./entities/photo.entity";
import { AlbumsMetadataService } from "./services/albums-metadata.service";
import { AlbumsService } from "./services/albums.service";
import { PhotoFacesService } from "./services/photo-faces.service";
import { PhotosService } from "./services/photos.service";

@Module({
  imports: [TypeOrmModule.forFeature([Album, Photo, PhotoFace])],
  providers: [AlbumsService, AlbumsMetadataService, PhotoFacesService, PhotosService],
  exports: [AlbumsService, PhotosService],
})
export class AlbumsModelModule {}
