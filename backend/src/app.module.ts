import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MulterModule } from "@nestjs/platform-express";
import { ServeStaticModule } from "@nestjs/serve-static";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import * as path from "path";
import { AccessControlModule } from "./access-control/access-control.module";
import { AccountModule } from "./api/account/account.module";
import { AlbumsModule } from "./api/albums/albums.module";
import { EventsModule } from "./api/events/events.module";
import { MembersModule } from "./api/members/members.module";
import { PublicModule } from "./api/public/public.module";
import { RootModule } from "./api/root/root.module";
import { StatisticsModule } from "./api/statistics/statistics.module";
import { UsersController } from "./api/users/controllers/users.controller";
import { AuthModule } from "./auth/auth.module";
import { Config } from "./config";
import { AlbumsModelModule } from "./models/albums/albums-model.module";
import { GoogleModelModule } from "./models/google/google-model.module";
import { MailService } from "./models/mail/services/mail.service";
import { MembersModelModule } from "./models/members/members-model.module";
import { StatisticsModelModule } from "./models/statistics/statistics-model.module";
import { UsersModelModule } from "./models/users/users-model.module";
import { MongoMigrationModule } from "./mongo-migration/mongo-migration.module";

const typeOrmOptions: TypeOrmModuleOptions = {
  ...Config.db,
  autoLoadEntities: true,
};

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, "../../frontend/dist"),
    }),
    TypeOrmModule.forRoot(typeOrmOptions),
    MongooseModule.forRoot(Config.mongoDb.uri),
    MulterModule.register({
      dest: "/tmp/uploads",
      limits: {
        fileSize: 1024 * 1024 * 100, // 100 MB
      },
    }),
    EventsModule,
    EventsModule,
    PublicModule,
    MembersModule,
    AuthModule,
    MembersModelModule,
    AlbumsModelModule,
    UsersModelModule,
    AlbumsModule,
    MongoMigrationModule,
    AccessControlModule,
    AccountModule,
    StatisticsModule,
    RootModule,
    StatisticsModelModule,
    GoogleModelModule,
  ],
  controllers: [UsersController],
  providers: [MailService],
})
export class AppModule {}
