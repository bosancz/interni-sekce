import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MailModelModule } from "../mail/mail-model.module";
import { EventAttendee } from "./entities/event-attendee.entity";
import { EventExpense } from "./entities/event-expense.entity";
import { Event } from "./entities/event.entity";
import { EventsRepository } from "./repositories/events.repository";
import { EventAccountingService } from "./services/event-accountig.service";
import { EventAnnouncementService } from "./services/event-announcement.service";
import { EventRegistrationService } from "./services/event-registration.service";
import { EventsProgramPdfService } from "./services/events-program-pdf.service";

@Module({
	imports: [TypeOrmModule.forFeature([Event, EventExpense, EventAttendee]), MailModelModule],
	providers: [
		EventsRepository,
		EventAccountingService,
		EventAnnouncementService,
		EventRegistrationService,
		EventsProgramPdfService,
	],
	exports: [
		EventsRepository,
		EventAccountingService,
		EventAnnouncementService,
		EventRegistrationService,
		EventsProgramPdfService,
	],
})
export class EventsModelModule {}
