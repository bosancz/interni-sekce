import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificationsModelModule } from "src/models/notifications/notifications-model.module";
import { EventAttendee } from "../events/entities/event-attendee.entity";
import { Event } from "../events/entities/event.entity";
import { Member } from "../members/entities/member.entity";
import { BadgesEvaluateCommand } from "./commands/badges-evaluate.command";
import { MemberBadge } from "./entities/member-badge.entity";
import { BadgesService } from "./services/badges.service";

@Module({
	imports: [TypeOrmModule.forFeature([MemberBadge, Member, Event, EventAttendee]), NotificationsModelModule],
	providers: [BadgesService, BadgesEvaluateCommand],
	exports: [BadgesService],
})
export class BadgesModelModule {}
