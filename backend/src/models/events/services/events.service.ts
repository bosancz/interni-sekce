import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Member } from "src/models/members/entities/member.entity";
import { Brackets, FindOptionsSelect, ObjectLiteral, Repository } from "typeorm";
import { EventAttendee, EventAttendeeType } from "../entities/event-attendee.entity";
import { Event } from "../entities/event.entity";
import { EventWithLeaders } from "../schema/event-with-leaders";

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private eventsRepository: Repository<Event>,
    @InjectRepository(EventAttendee) private eventAttendeesRepository: Repository<EventAttendee>,
  ) {}

  async getEvents(options: { where?: string | Brackets | ObjectLiteral; leaders: true }): Promise<EventWithLeaders[]>;
  async getEvents(options: { where?: string | Brackets | ObjectLiteral }): Promise<Event[]>;
  async getEvents(
    options: { where?: string | Brackets | ObjectLiteral; select?: FindOptionsSelect<Event>; leaders?: boolean } = {},
  ) {
    const events = this.eventsRepository.createQueryBuilder("events");

    if (options.where) events.where(options.where);

    if (options.leaders) {
      events
        .leftJoin("events.attendees", "attendees", "attendees.type = 'leader'")
        .leftJoinAndSelect("attendees.member", "leaders");
    }

    return events.getMany();
  }

  async getEvent(id: number, options: { select?: FindOptionsSelect<Event>; leaders: true }): Promise<EventWithLeaders>;
  async getEvent(id: number, options: { select?: FindOptionsSelect<Event> }): Promise<Event>;
  async getEvent(id: number, options: { select?: FindOptionsSelect<Event>; leaders?: boolean } = {}) {
    const event = await this.eventsRepository.findOne({ where: { id }, select: options.select });
    if (!event) return null;

    if (options.leaders) {
      const leaders = await this.getEventLeaders(id);
      return { ...event, leaders };
    }

    return event;
  }

  async getEventLeaders(id: number): Promise<Member[]> {
    return this.eventAttendeesRepository
      .find({ where: { eventId: id, type: EventAttendeeType.leader }, relations: { member: true } })
      .then((res) => res.map((ea) => ea.member!));
  }

  async getEventAttendees(id: number): Promise<Member[]> {
    return this.eventAttendeesRepository
      .find({ where: { eventId: id }, relations: { member: true } })
      .then((res) => res.map((ea) => ea.member!));
  }

  async updateEvent(id: number, data: Partial<Event>) {
    return this.eventsRepository.save({ ...data, id });
  }

  async createEvent(data: Partial<Event>) {
    return this.eventsRepository.create(data);
  }
}
