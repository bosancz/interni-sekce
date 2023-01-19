import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Album } from "src/models/albums/entities/album.entity";
import { Photo } from "src/models/albums/entities/photo.entity";
import { ImportMongoDataCommand } from "./commands/import-mongo-data.command";
import { MongoAlbum, MongoAlbumSchema } from "./models/album";
import { MongoImportService } from "./services/mongo-import.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MongoAlbum.name, schema: MongoAlbumSchema }]),
    TypeOrmModule.forFeature([Album, Photo]),
  ],
  providers: [MongoImportService, ImportMongoDataCommand],
  exports: [ImportMongoDataCommand],
})
export class MongoMigrationModule {
  constructor() {}
}
