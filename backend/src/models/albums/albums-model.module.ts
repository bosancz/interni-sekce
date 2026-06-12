import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FilesModule } from "src/models/files/files.module";
import { WriteAlbumsMetadataCommand } from "./commands/write-album-metadata.command";
import { Album } from "./entities/album.entity";
import { PhotoFace } from "./entities/photo-face.entity";
import { Photo } from "./entities/photo.entity";
import { AlbumsRepository } from "./repositories/albums.repository";
import { PhotosRepository } from "./repositories/photos.repository";
import { AlbumsMetadataService } from "./services/albums-metadata.service";
import { PhotoFacesService } from "./services/photo-faces.service";
import { PhotosFilesService } from "./services/photos-files.service";

@Module({
	imports: [TypeOrmModule.forFeature([Album, Photo, PhotoFace]), FilesModule],
	providers: [
		AlbumsRepository,
		AlbumsMetadataService,
		PhotoFacesService,
		PhotosRepository,
		PhotosFilesService,
		WriteAlbumsMetadataCommand,
	],
	exports: [AlbumsRepository, PhotosRepository, PhotosFilesService],
})
export class AlbumsModelModule {}
