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
import { StartImportCommand } from "./commands/import-mongo-data.command";
import { MongoImportService } from "./services/mongo-import.service";

@Module({
	imports: [
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
