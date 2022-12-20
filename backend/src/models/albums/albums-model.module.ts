import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Album } from "./entities/album.entity";
import { Photo } from "./entities/photo.entity";
import { AlbumsService } from "./services/albums.service";

@Module({
  imports: [TypeOrmModule.forFeature([Album, Photo])],
  providers: [AlbumsService],
  exports: [AlbumsService],
})
export class AlbumsModelModule {}
