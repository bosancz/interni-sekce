import { Module } from "@nestjs/common";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { AuthModule } from "src/auth/auth.module";
import { Config } from "src/config";
import { AlbumsMetadataService } from "src/models/albums/services/albums-metadata.service";
import { UsersModelModule } from "src/models/users/users-model.module";
import { MongoImportModule } from "src/mongo-import/mongo-import.module";
import { AlbumsModelModule } from "../models/albums/albums-model.module";
import { CreateAdminCommand } from "./commands/create-admin.command";
import { WriteAlbumsMetadataCommand } from "./commands/write-album-metadata.command";

const typeOrmOptions: TypeOrmModuleOptions = {
  ...Config.db,
  autoLoadEntities: true,
};

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmOptions), AuthModule, UsersModelModule, AlbumsModelModule, MongoImportModule],
  controllers: [],
  providers: [CreateAdminCommand, WriteAlbumsMetadataCommand, AlbumsMetadataService],
  exports: [CreateAdminCommand, WriteAlbumsMetadataCommand],
})
export class CliModule {}
