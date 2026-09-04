import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EventAttendee, EventAttendeeType } from "src/models/events/entities/event-attendee.entity";
import { Event, EventStates } from "src/models/events/entities/event.entity";
import { Member } from "src/models/members/entities/member.entity";
import { Repository } from "typeorm";
import {
	CHILD_PARAMS,
	childCondition,
	EVENT_DAYS,
	EVENT_YEAR_CONDITION,
	FINISHED_EVENT_CONDITION,
	getEventYearRange,
	getTotalChildDays,
	setRanks,
} from "../statistics.helpers";

export interface TopChild {
	memberId: number;
	nickname: string;
	firstName: string | null;
	lastName: string | null;
	groupId: number;
	days: number;
	eventsCount: number;
	rank: number;
}

export interface ChildEvent {
	eventId: number;
	name: string;
	dateFrom: string;
	dateTill: string;
	days: number;
}

export interface TopChildrenStatistics {
	year: number;
	childDays: number;
	firstYear: number;
	lastYear: number;
	children: TopChild[];
}

@Injectable()
export class ChildrenStatisticsService {
	constructor(
		@InjectRepository(Event) private eventsRepository: Repository<Event>,
		@InjectRepository(EventAttendee) private eventAttendeesRepository: Repository<EventAttendee>,
	) {}

	async getTopChildrenStatistics(year: number, limit: number): Promise<TopChildrenStatistics> {
		const [childDays, children, { firstYear, lastYear }] = await Promise.all([
			getTotalChildDays(this.eventsRepository, year),
			this.getRankedChildren(year, limit),
			getEventYearRange(this.eventsRepository),
		]);

		return { year, childDays, firstYear, lastYear, children };
	}

	private async getRankedChildren(year: number, limit: number): Promise<TopChild[]> {
		const days = `SUM(${EVENT_DAYS})`;

		const rows = await this.eventAttendeesRepository
			.createQueryBuilder("ca")
			.select("m.id", "memberId")
			.addSelect("m.nickname", "nickname")
			.addSelect("m.first_name", "firstName")
			.addSelect("m.last_name", "lastName")
			.addSelect("m.group_id", "groupId")
			.addSelect(days, "days")
			.addSelect("COUNT(*)", "eventsCount")
			.innerJoin(Member, "m", "m.id = ca.memberId AND m.deletedAt IS NULL")
			.innerJoin(Event, "e", `e.id = ca.eventId AND ${FINISHED_EVENT_CONDITION}`, {
				cancelledStatus: EventStates.cancelled,
			})
			.where("ca.type = :attendeeType", { attendeeType: EventAttendeeType.attendee })
			.andWhere(childCondition("m", "e"), CHILD_PARAMS)
			.andWhere(EVENT_YEAR_CONDITION, { year })
			.groupBy("m.id")
			.orderBy(days, "DESC")
			.addOrderBy("COUNT(*)", "ASC")
			.addOrderBy("m.nickname", "ASC")
			.limit(limit)
			.getRawMany<Omit<TopChild, "days" | "eventsCount" | "rank"> & { days: string; eventsCount: string }>();

		return setRanks(
			rows.map((row) => ({
				...row,
				days: Number(row.days),
				eventsCount: Number(row.eventsCount),
			})),
			(row) => row.days,
		);
	}

	async getChildEvents(memberId: number, year: number): Promise<ChildEvent[]> {
		const rows = await this.eventAttendeesRepository
			.createQueryBuilder("ca")
			.select("e.id", "eventId")
			.addSelect("e.name", "name")
			.addSelect("TO_CHAR(e.date_from, 'YYYY-MM-DD')", "dateFrom")
			.addSelect("TO_CHAR(e.date_till, 'YYYY-MM-DD')", "dateTill")
			.addSelect(EVENT_DAYS, "days")
			.innerJoin(Event, "e", `e.id = ca.eventId AND ${FINISHED_EVENT_CONDITION}`, {
				cancelledStatus: EventStates.cancelled,
			})
			.where("ca.type = :attendeeType", { attendeeType: EventAttendeeType.attendee })
			.andWhere("ca.memberId = :memberId", { memberId })
			.andWhere(EVENT_YEAR_CONDITION, { year })
			.orderBy(EVENT_DAYS, "DESC")
			.addOrderBy("e.date_from", "DESC")
			.getRawMany<Omit<ChildEvent, "days"> & { days: string }>();

		return rows.map((row) => ({ ...row, days: Number(row.days) }));
	}
}
