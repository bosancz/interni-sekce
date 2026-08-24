import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "src/auth/auth.module";
import { AlbumsModelModule } from "src/models/albums/albums-model.module";
import { Album } from "src/models/albums/entities/album.entity";
import { Photo } from "src/models/albums/entities/photo.entity";
import { EventAttendee } from "src/models/events/entities/event-attendee.entity";
import { EventExpense } from "src/models/events/entities/event-expense.entity";
import { Event } from "src/models/events/entities/event.entity";
import { Group } from "src/models/members/entities/group.entity";
import { MemberContact } from "src/models/members/entities/member-contact.entity";
import { Member } from "src/models/members/entities/member.entity";
import { User } from "src/models/users/entities/user.entity";
import { ResetDbCommand } from "./commands/reset-db.command";
import { SeedCommand } from "./commands/seed.command";
import { SeedService } from "./services/seed.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([Album, Photo, Event, EventAttendee, EventExpense, Group, Member, MemberContact, User]),
		AuthModule,
		AlbumsModelModule,
	],
	providers: [SeedService, SeedCommand, ResetDbCommand],
	exports: [SeedCommand, ResetDbCommand],
})
export class SeedModule {}
