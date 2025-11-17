import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventAttendee } from "src/models/events/entities/event-attendee.entity";
import { Event } from "src/models/events/entities/event.entity";
import { EventsModelModule } from "src/models/events/events-model.module";
import { CPVEventsController } from "./controllers/cpv-events.controller";
import { EventsAttendeesController } from "./controllers/events-attendees.controller";
import { EventsExpensesController } from "./controllers/events-expenses.controller";
import { EventsRegistrationsController } from "./controllers/events-registrations.controller";
import { EventsReportsController } from "./controllers/events-reports.controller";
import { EventsController } from "./controllers/events.controller";
import { EventsAnnouncementController } from "./controllers/events-announcement.controller"
import { EventAnnouncementService } from "./providers/event-announcement.service";
import { EventsAccountingController } from "./controllers/events-accounting.controller"
import { EventAccountingService } from "./providers/event-accountig.service";

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventAttendee]), EventsModelModule],
  controllers: [
    EventsController,
    EventsAttendeesController,
    EventsExpensesController,
    CPVEventsController,
    EventsReportsController,
    EventsRegistrationsController,
    EventsAnnouncementController,
    EventsAccountingController
  ],
  providers: [EventAnnouncementService, EventAccountingService],
})
export class EventsModule {}
