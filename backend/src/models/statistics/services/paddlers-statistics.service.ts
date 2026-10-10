import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EventAttendee } from "src/models/events/entities/event-attendee.entity";
import { Event, EventStates } from "src/models/events/entities/event.entity";
import { Member } from "src/models/members/entities/member.entity";
import { Repository } from "typeorm";
import {
	CHILD_PARAMS,
	childCondition,
	EVENT_YEAR_CONDITION,
	FINISHED_EVENT_CONDITION,
	getEventYearRange,
	setRanks,
} from "../statistics.helpers";

const WATER_EVENT_CONDITION = "e.water_km > 0";

const RIVERS_COUNT = "COUNT(DISTINCT NULLIF(LOWER(TRIM(e.river)), ''))";

export interface PaddlersSummary {
	year: number;
	riversCount: number;
	eventsCount: number;
	waterKm: number;
	firstYear: number;
	lastYear: number;
}

export interface Paddler {
	memberId: number;
	nickname: string;
	firstName: string | null;
	lastName: string | null;
	groupId: number;
	waterKm: number;
	eventsCount: number;
	riversCount: number;
	rank: number;
}

export interface PaddlersRanking {
	year: number;
	firstYear: number;
	lastYear: number;
	children: Paddler[];
	leaders: Paddler[];
}

@Injectable()
export class PaddlersStatisticsService {
	constructor(
		@InjectRepository(Event) private eventsRepository: Repository<Event>,
		@InjectRepository(EventAttendee) private eventAttendeesRepository: Repository<EventAttendee>,
	) {}

	async getPaddlersSummary(year: number): Promise<PaddlersSummary> {
		const [row, { firstYear, lastYear }] = await Promise.all([
			this.eventsRepository
				.createQueryBuilder("e")
				.select(RIVERS_COUNT, "riversCount")
				.addSelect("COUNT(*)", "eventsCount")
				.addSelect("COALESCE(SUM(e.water_km), 0)", "waterKm")
				.where(FINISHED_EVENT_CONDITION, { cancelledStatus: EventStates.cancelled })
				.andWhere(EVENT_YEAR_CONDITION, { year })
				.andWhere(WATER_EVENT_CONDITION)
				.getRawOne<{ riversCount: string; eventsCount: string; waterKm: string }>(),
			getEventYearRange(this.eventsRepository),
		]);

		return {
			year,
			riversCount: Number(row?.riversCount ?? 0),
			eventsCount: Number(row?.eventsCount ?? 0),
			waterKm: Number(row?.waterKm ?? 0),
			firstYear,
			lastYear,
		};
	}

	async getPaddlersRanking(year: number): Promise<PaddlersRanking> {
		const [children, leaders, { firstYear, lastYear }] = await Promise.all([
			this.getRankedPaddlers(year, true),
			this.getRankedPaddlers(year, false),
			getEventYearRange(this.eventsRepository),
		]);

		return { year, firstYear, lastYear, children, leaders };
	}

	private async getRankedPaddlers(year: number, children: boolean): Promise<Paddler[]> {
		const waterKm = "SUM(e.water_km)";

		const rows = await this.eventAttendeesRepository
			.createQueryBuilder("ea")
			.select("m.id", "memberId")
			.addSelect("m.nickname", "nickname")
			.addSelect("m.first_name", "firstName")
			.addSelect("m.last_name", "lastName")
			.addSelect("m.group_id", "groupId")
			.addSelect(waterKm, "waterKm")
			.addSelect("COUNT(*)", "eventsCount")
			.addSelect(RIVERS_COUNT, "riversCount")
			.innerJoin(Member, "m", "m.id = ea.memberId AND m.deletedAt IS NULL")
			.innerJoin(Event, "e", `e.id = ea.eventId AND ${FINISHED_EVENT_CONDITION}`, {
				cancelledStatus: EventStates.cancelled,
			})
			.where(EVENT_YEAR_CONDITION, { year })
			.andWhere(WATER_EVENT_CONDITION)
			.andWhere(children ? childCondition("m", "e") : `NOT ${childCondition("m", "e")}`, CHILD_PARAMS)
			.groupBy("m.id")
			.orderBy(waterKm, "DESC")
			.addOrderBy("COUNT(*)", "ASC")
			.addOrderBy("m.nickname", "ASC")
			.getRawMany<
				Omit<Paddler, "waterKm" | "eventsCount" | "riversCount" | "rank"> & {
					waterKm: string;
					eventsCount: string;
					riversCount: string;
				}
			>();

		return setRanks(
			rows.map((row) => ({
				...row,
				waterKm: Number(row.waterKm),
				eventsCount: Number(row.eventsCount),
				riversCount: Number(row.riversCount),
			})),
			(row) => row.waterKm,
		);
	}
}
