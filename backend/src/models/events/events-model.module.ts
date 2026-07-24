import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventAttendee } from "./entities/event-attendee.entity";
import { EventExpense } from "./entities/event-expense.entity";
import { Event } from "./entities/event.entity";
import { EventsRepository } from "./repositories/events.repository";
import { EventAccountingService } from "./services/event-accountig.service";
import { EventAnnouncementService } from "./services/event-announcement.service";
import { EventRegistrationService } from "./services/event-registration.service";

@Module({
	imports: [TypeOrmModule.forFeature([Event, EventExpense, EventAttendee])],
	providers: [EventsRepository, EventAccountingService, EventAnnouncementService, EventRegistrationService],
	exports: [EventsRepository, EventAccountingService, EventAnnouncementService, EventRegistrationService],
})
export class EventsModelModule {}
