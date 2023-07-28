import { Module } from "@nestjs/common";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { AuthModule } from "src/auth/auth.module";
import { Config } from "src/config";
import { UsersModelModule } from "src/models/users/users-model.module";
import { AlbumsModelModule } from "./models/albums/albums-model.module";

const typeOrmOptions: TypeOrmModuleOptions = {
  ...Config.db,
  autoLoadEntities: true,
};

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmOptions), AuthModule, UsersModelModule, AlbumsModelModule],
  controllers: [],
  providers: [],
})
export class CliModule {}
