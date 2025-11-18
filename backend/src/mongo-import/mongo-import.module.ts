import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "src/auth/auth.module";
import { Config } from "src/config";
import { AlbumsModelModule } from "src/models/albums/albums-model.module";
import { Album } from "src/models/albums/entities/album.entity";
import { Photo } from "src/models/albums/entities/photo.entity";
import { Event } from "src/models/events/entities/event.entity";
import { EventsModelModule } from "src/models/events/events-model.module";
import { Member } from "src/models/members/entities/member.entity";
import { MembersModelModule } from "src/models/members/members-model.module";
import { User } from "src/models/users/entities/user.entity";
import { UsersModelModule } from "src/models/users/users-model.module";
import { StartImportCommand } from "./commands/import-mongo-data.command";
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
		MongooseModule.forRootAsync({
			inject: [Config],
			useFactory: (config: Config) => ({ uri: config.mongoDb.uri, connectTimeoutMS: 1000 }),
		}),
		TypeOrmModule.forFeature([Album, Photo, Event, Member, User]),

		AuthModule,

		EventsModelModule,
		MembersModelModule,
		AlbumsModelModule,
		UsersModelModule,
	],
	providers: [MongoImportService, StartImportCommand],
	exports: [StartImportCommand],
})
export class MongoImportModule {
	constructor() {}
}
