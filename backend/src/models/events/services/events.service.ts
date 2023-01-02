import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsSelect, Repository } from "typeorm";
import { EventAttendee, EventAttendeeType } from "../entities/event-attendee.entity";
import { Event } from "../entities/event.entity";

const eventFields = [
  "id",
  "albumId",
  "name",
  "status",
  "statusNote",
  "place",
  "description",
  "dateFrom",
  "dateTill",
  "timeFrom",
  "timeTill",
  "meetingPlaceStart",
  "meetingPlaceEnd",
  "type",
  "water_km",
  "river",
  "deletedAt",
];

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private eventsRepository: Repository<Event>,
    @InjectRepository(EventAttendee) private eventAttendeesRepository: Repository<EventAttendee>,
  ) {}

  async getEvents(options: { select?: (keyof Event)[]; leaders?: boolean } = {}) {
    let query = this.eventsRepository.createQueryBuilder("events");

    if (options.select) {
      query.select(options.select.map((f) => `events.${f}`));
    }

    if (options.leaders) {
      query
        .leftJoinAndMapMany("events.leadersAttendees", "events.attendees", "attendees", "attendees.type = 'leader'")
        .leftJoinAndMapOne("attendees.member", "attendees.member", "leaders");
    }

    const events = await query.getMany();

    if (options.leaders) {
      events.forEach((e) => {
        e.leaders = e.leadersAttendees?.map((ea) => ea.member!);
        delete e.leadersAttendees;
      });
    }
    return events;
  }

  async getEvent(id: number, options: { select?: FindOptionsSelect<Event>; leaders?: boolean } = {}) {
    const event = await this.eventsRepository.findOne({ where: { id }, select: options.select });
    if (!event) return null;

    event.leaders = await this.getEventLeaders(id);

    return event;
  }

  async updateEvent(id: number, data: Partial<Event>) {
    return this.eventsRepository.save({ ...data, id });
  }

  async createEvent(data: Partial<Event>) {
    return this.eventsRepository.save(data);
  }

  async deleteEvent(id: number) {
    this.eventsRepository.softRemove({ id });
  }

  async getEventLeaders(id: number) {
    return this.eventAttendeesRepository
      .find({
        where: { eventId: id, type: EventAttendeeType.leader },
        relations: { member: true },
      })
      .then((res) => res.map((ea) => ea.member!));
  }

  async getEventAttendees(id: number) {
    return this.eventAttendeesRepository.find({ where: { eventId: id }, relations: { member: true, event: true } });
  }

  async getEventAttendee(eventId: number, memberId: number) {
    return this.eventAttendeesRepository.findOne({
      where: { eventId, memberId },
      relations: { member: true, event: true },
    });
  }

  async updateEventAttendee(data: EventAttendee) {
    this.eventAttendeesRepository.save(data);
  }

  async deleteEventAttendee(eventId: number, memberId: number) {
    await this.eventAttendeesRepository.delete({ eventId, memberId });
  }
}
