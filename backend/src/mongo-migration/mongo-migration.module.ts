import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Album } from "src/models/albums/entities/album.entity";
import { Photo } from "src/models/albums/entities/photo.entity";
import { Event } from "src/models/events/entities/event.entity";
import { Member } from "src/models/members/entities/member.entity";
import { User } from "src/models/users/entities/user.entity";
import { ImportMongoDataCommand } from "./commands/import-mongo-data.command";
import { MongoAlbum, MongoAlbumSchema } from "./models/album";
import { MongoEvent, MongoEventSchema } from "./models/event";
import { MongoMember, MongoMemberSchema } from "./models/member";
import { MongoPhoto, MongoPhotoSchema } from "./models/photo";
import { MongoUser, MongoUserSchema } from "./models/user";
import { MongoImportService } from "./services/mongo-import.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MongoAlbum.name, schema: MongoAlbumSchema },
      { name: MongoPhoto.name, schema: MongoPhotoSchema },
      { name: MongoEvent.name, schema: MongoEventSchema },
      { name: MongoMember.name, schema: MongoMemberSchema },
      { name: MongoUser.name, schema: MongoUserSchema },
    ]),
    TypeOrmModule.forFeature([Album, Photo, Event, Member, User]),
  ],
  providers: [MongoImportService, ImportMongoDataCommand],
  exports: [ImportMongoDataCommand],
})
export class MongoMigrationModule {
  constructor() {}
}
