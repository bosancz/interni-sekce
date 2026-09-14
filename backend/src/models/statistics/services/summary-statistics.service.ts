import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EventAttendee, EventAttendeeType } from "src/models/events/entities/event-attendee.entity";
import { Event, EventStates } from "src/models/events/entities/event.entity";
import { Member } from "src/models/members/entities/member.entity";
import { Repository } from "typeorm";
import {
	CHILD_PARAMS,
	childCondition,
	EVENT_YEAR_CONDITION,
	FINISHED_EVENT_CONDITION,
	getEventYearRange,
	getTotalChildDays,
} from "../statistics.helpers";

export interface SummaryStatistics {
	year: number;
	activeChildren: number;
	activeLeaders: number;
	childDays: number;
	firstYear: number;
	lastYear: number;
}

@Injectable()
export class SummaryStatisticsService {
	constructor(
		@InjectRepository(Event) private eventsRepository: Repository<Event>,
		@InjectRepository(EventAttendee) private eventAttendeesRepository: Repository<EventAttendee>,
	) {}

	async getSummaryStatistics(year: number): Promise<SummaryStatistics> {
		const [activeChildren, activeLeaders, childDays, { firstYear, lastYear }] = await Promise.all([
			this.getActiveChildren(year),
			this.getActiveLeaders(year),
			getTotalChildDays(this.eventsRepository, year),
			getEventYearRange(this.eventsRepository),
		]);

		return { year, activeChildren, activeLeaders, childDays, firstYear, lastYear };
	}

	private async getActiveChildren(year: number): Promise<number> {
		const row = await this.countAttendees(year, EventAttendeeType.attendee)
			.andWhere(childCondition("m", "e"), CHILD_PARAMS)
			.getRawOne<{ count: string }>();

		return Number(row?.count ?? 0);
	}

	private async getActiveLeaders(year: number): Promise<number> {
		const row = await this.countAttendees(year, EventAttendeeType.leader).getRawOne<{ count: string }>();

		return Number(row?.count ?? 0);
	}

	private countAttendees(year: number, type: EventAttendeeType) {
		return this.eventAttendeesRepository
			.createQueryBuilder("ea")
			.select("COUNT(DISTINCT m.id)", "count")
			.innerJoin(Member, "m", "m.id = ea.memberId AND m.deletedAt IS NULL")
			.innerJoin(Event, "e", `e.id = ea.eventId AND ${FINISHED_EVENT_CONDITION}`, {
				cancelledStatus: EventStates.cancelled,
			})
			.where("ea.type = :attendeeType", { attendeeType: type })
			.andWhere(EVENT_YEAR_CONDITION, { year });
	}
}
