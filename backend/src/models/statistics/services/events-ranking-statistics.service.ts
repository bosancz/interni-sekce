import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EventAttendee, EventAttendeeType } from "src/models/events/entities/event-attendee.entity";
import { Event, EventStates } from "src/models/events/entities/event.entity";
import { Member } from "src/models/members/entities/member.entity";
import { Repository } from "typeorm";
import {
	childrenPerEvent,
	EVENT_DAYS,
	EVENT_YEAR_CONDITION,
	FINISHED_EVENT_CONDITION,
	getEventYearRange,
	getTotalChildDays,
	setRanks,
} from "../statistics.helpers";

export interface TopEvent {
	eventId: number;
	name: string;
	dateFrom: string;
	dateTill: string;
	days: number;
	childrenCount: number;
	childDays: number;
	leaders: string[];
	rank: number;
}

export interface TopEventsStatistics {
	year: number;
	childDays: number;
	firstYear: number;
	lastYear: number;
	events: TopEvent[];
}

@Injectable()
export class EventsRankingStatisticsService {
	constructor(
		@InjectRepository(Event) private eventsRepository: Repository<Event>,
		@InjectRepository(EventAttendee) private eventAttendeesRepository: Repository<EventAttendee>,
	) {}

	async getTopEventsStatistics(year: number, limit: number): Promise<TopEventsStatistics> {
		const [childDays, ranking, { firstYear, lastYear }] = await Promise.all([
			getTotalChildDays(this.eventsRepository, year),
			this.getRankedEvents(year, limit),
			getEventYearRange(this.eventsRepository),
		]);

		const leaders = await this.getEventsLeaders(ranking.map((event) => event.eventId));

		const events = ranking.map((event) => ({ ...event, leaders: leaders.get(event.eventId) ?? [] }));

		return { year, childDays, firstYear, lastYear, events };
	}

	private async getRankedEvents(year: number, limit: number): Promise<Omit<TopEvent, "leaders">[]> {
		const childDays = `ec.children_count * ${EVENT_DAYS}`;

		const rows = await this.eventsRepository
			.createQueryBuilder("e")
			.select("e.id", "eventId")
			.addSelect("e.name", "name")
			.addSelect("TO_CHAR(e.date_from, 'YYYY-MM-DD')", "dateFrom")
			.addSelect("TO_CHAR(e.date_till, 'YYYY-MM-DD')", "dateTill")
			.addSelect(EVENT_DAYS, "days")
			.addSelect("ec.children_count", "childrenCount")
			.addSelect(childDays, "childDays")
			.innerJoin((qb) => childrenPerEvent(qb), "ec", "ec.event_id = e.id")
			.where(FINISHED_EVENT_CONDITION, { cancelledStatus: EventStates.cancelled })
			.andWhere(EVENT_YEAR_CONDITION, { year })
			.orderBy(childDays, "DESC")
			.addOrderBy("e.date_from", "ASC")
			.limit(limit)
			.getRawMany<{
				eventId: number;
				name: string;
				dateFrom: string;
				dateTill: string;
				days: string;
				childrenCount: string;
				childDays: string;
			}>();

		return setRanks(
			rows.map((row) => ({
				...row,
				days: Number(row.days),
				childrenCount: Number(row.childrenCount),
				childDays: Number(row.childDays),
			})),
			(row) => row.childDays,
		);
	}

	private async getEventsLeaders(eventIds: number[]): Promise<Map<number, string[]>> {
		if (!eventIds.length) return new Map();

		const rows = await this.eventAttendeesRepository
			.createQueryBuilder("la")
			.select("la.event_id", "eventId")
			.addSelect("m.nickname", "nickname")
			.innerJoin(Member, "m", "m.id = la.memberId AND m.deletedAt IS NULL")
			.where("la.type = :leaderType", { leaderType: EventAttendeeType.leader })
			.andWhere("la.eventId IN (:...eventIds)", { eventIds })
			.orderBy("m.nickname", "ASC")
			.getRawMany<{ eventId: number; nickname: string }>();

		const leaders = new Map<number, string[]>();
		for (const row of rows) {
			const list = leaders.get(row.eventId) ?? [];
			list.push(row.nickname);
			leaders.set(row.eventId, list);
		}

		return leaders;
	}
}
