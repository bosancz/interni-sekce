import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WriteAlbumsMetadataCommand } from "./commands/write-album-metadata.command";
import { Album } from "./entities/album.entity";
import { Photo } from "./entities/photo.entity";
import { AlbumsMetadataService } from "./services/albums-metadata.service";
import { AlbumsService } from "./services/albums.service";

@Module({
  imports: [TypeOrmModule.forFeature([Album, Photo])],
  providers: [AlbumsService, AlbumsMetadataService, WriteAlbumsMetadataCommand],
  exports: [AlbumsService, WriteAlbumsMetadataCommand],
})
export class AlbumsModelModule {}
