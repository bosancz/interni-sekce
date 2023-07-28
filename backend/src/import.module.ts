import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { AuthModule } from "src/auth/auth.module";
import { Config } from "src/config";
import { AlbumsModelModule } from "src/models/albums/albums-model.module";
import { EventsModelModule } from "src/models/events/events-model.module";
import { MembersModelModule } from "src/models/members/members-model.module";
import { StatisticsModelModule } from "src/models/statistics/statistics-model.module";
import { UsersModelModule } from "src/models/users/users-model.module";
import { MongoMigrationModule } from "src/mongo-migration/mongo-migration.module";

const typeOrmOptions: TypeOrmModuleOptions = {
  ...Config.db,
  autoLoadEntities: true,
};
@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmOptions),
    MongooseModule.forRoot(Config.mongoDb.uri),

    AuthModule,

    EventsModelModule,
    MembersModelModule,
    AlbumsModelModule,
    UsersModelModule,
    MongoMigrationModule,
    StatisticsModelModule,
  ],
  controllers: [],
  providers: [],
})
export class ImportModule {}
