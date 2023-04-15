import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventAttendee } from "src/models/events/entities/event-attendee.entity";
import { Event } from "src/models/events/entities/event.entity";
import { EventsModelModule } from "src/models/events/events-model.module";
import { CPVEventsController } from "./controllers/cpv-events.controller";
import { EventsAttendeesController } from "./controllers/events-attendees.controller";
import { EventsController } from "./controllers/events.controller";
import { EventsReportsController } from './controllers/events-reports.controller';
import { EventsRegistrationsController } from './controllers/events-registrations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventAttendee]), EventsModelModule],
  controllers: [EventsController, EventsAttendeesController, CPVEventsController, EventsReportsController, EventsRegistrationsController],
})
export class EventsModule {}
