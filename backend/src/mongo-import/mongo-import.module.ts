import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "src/auth/auth.module";
import { Album } from "src/models/albums/entities/album.entity";
import { AlbumsModelModule } from "src/models/albums/albums-model.module";
import { Photo } from "src/models/albums/entities/photo.entity";
import { Event } from "src/models/events/entities/event.entity";
import { EventsModelModule } from "src/models/events/events-model.module";
import { Member } from "src/models/members/entities/member.entity";
import { MembersModelModule } from "src/models/members/members-model.module";
import { User } from "src/models/users/entities/user.entity";
import { UsersModelModule } from "src/models/users/users-model.module";
import { ImportTitlePhotosCommand } from "./commands/import-title-photos.command";
import { StartImportCommand } from "./commands/import-mongo-data.command";
import { MongoImportService } from "./services/mongo-import.service";

@Module({
	imports: [
		// The Mongo connection is intentionally NOT established here: MongooseModule.forRootAsync
		// would connect at module init, which happens on every CLI startup regardless of the
		// command being run. MongoImportService opens (and closes) the connection lazily, so Mongo
		// is only contacted when the `mongo-import` command actually runs.
		TypeOrmModule.forFeature([Album, Photo, Event, Member, User]),

		AuthModule,

		EventsModelModule,
		MembersModelModule,
		AlbumsModelModule,
		UsersModelModule,
	],
	providers: [MongoImportService, StartImportCommand, ImportTitlePhotosCommand],
	exports: [StartImportCommand, ImportTitlePhotosCommand],
})
export class MongoImportModule {
	constructor() {}
}
