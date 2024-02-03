import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Album } from "./entities/album.entity";
import { PhotoFace } from "./entities/photo-face.entity";
import { Photo } from "./entities/photo.entity";
import { AlbumsRepository } from "./repositories/albums.repository";
import { PhotosRepository } from "./repositories/photos.repository";
import { AlbumsMetadataService } from "./services/albums-metadata.service";
import { PhotoFacesService } from "./services/photo-faces.service";

@Module({
  imports: [TypeOrmModule.forFeature([Album, Photo, PhotoFace])],
  providers: [AlbumsRepository, AlbumsMetadataService, PhotoFacesService, PhotosRepository],
  exports: [AlbumsRepository, PhotosRepository],
})
export class AlbumsModelModule {}
