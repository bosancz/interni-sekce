import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventAttendee } from "src/models/events/entities/event-attendee.entity";
import { Event } from "src/models/events/entities/event.entity";
import { EventsModelModule } from "src/models/events/events-model.module";
import { FilesModule } from "src/models/files/files.module";
import { CPVEventsController } from "./controllers/cpv-events.controller";
import { EventsAccountingController } from "./controllers/events-accounting.controller";
import { EventsAnnouncementController } from "./controllers/events-announcement.controller";
import { EventsAttendeesController } from "./controllers/events-attendees.controller";
import { EventsExpensesController } from "./controllers/events-expenses.controller";
import { EventsRegistrationsController } from "./controllers/events-registrations.controller";
import { EventsReportsController } from "./controllers/events-reports.controller";
import { EventsController } from "./controllers/events.controller";

@Module({
	imports: [TypeOrmModule.forFeature([Event, EventAttendee]), EventsModelModule, FilesModule],
	controllers: [
		EventsController,
		EventsAttendeesController,
		EventsExpensesController,
		CPVEventsController,
		EventsReportsController,
		EventsRegistrationsController,
		EventsAnnouncementController,
		EventsAccountingController,
	],
})
export class EventsModule {}
