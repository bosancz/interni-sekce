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

export interface TopLeader {
	memberId: number;
	nickname: string;
	firstName: string | null;
	lastName: string | null;
	groupId: number;
	childDays: number;
	eventsCount: number;
	rank: number;
}

export type MyRanking = Omit<TopLeader, "rank"> & { rank: number | null };

export interface LeaderEvent {
	eventId: number;
	name: string;
	dateFrom: string;
	dateTill: string;
	childDays: number;
}

export interface LeadersStatistics {
	year: number;
	childDays: number;
	firstYear: number;
	lastYear: number;
	leaders: TopLeader[];
	me?: MyRanking;
}

@Injectable()
export class LeadersStatisticsService {
	constructor(
		@InjectRepository(EventAttendee) private eventAttendeesRepository: Repository<EventAttendee>,
		@InjectRepository(Event) private eventsRepository: Repository<Event>,
		@InjectRepository(Member) private membersRepository: Repository<Member>,
	) {}

	async getLeadersStatistics(year: number, limit: number, memberId?: number): Promise<LeadersStatistics> {
		const [childDays, ranking, { firstYear, lastYear }] = await Promise.all([
			getTotalChildDays(this.eventsRepository, year),
			this.getRankedLeaders(year),
			getEventYearRange(this.eventsRepository),
		]);

		const leaders = ranking.slice(0, limit);
		const me = memberId !== undefined ? await this.getMyRanking(ranking, memberId) : undefined;

		return { year, childDays, firstYear, lastYear, leaders, me };
	}

	private async getMyRanking(ranking: TopLeader[], memberId: number): Promise<MyRanking | undefined> {
		const ranked = ranking.find((leader) => leader.memberId === memberId);
		if (ranked) return ranked;

		const member = await this.membersRepository.findOne({
			where: { id: memberId },
			select: { id: true, nickname: true, firstName: true, lastName: true, groupId: true },
		});
		if (!member) return undefined;

		return {
			memberId: member.id,
			nickname: member.nickname,
			firstName: member.firstName ?? null,
			lastName: member.lastName ?? null,
			groupId: member.groupId,
			childDays: 0,
			eventsCount: 0,
			rank: null,
		};
	}

	private async getRankedLeaders(year: number): Promise<TopLeader[]> {
		const childDays = `SUM(ec.children_count * ${EVENT_DAYS})`;

		const rows = await this.eventAttendeesRepository
			.createQueryBuilder("la")
			.select("m.id", "memberId")
			.addSelect("m.nickname", "nickname")
			.addSelect("m.first_name", "firstName")
			.addSelect("m.last_name", "lastName")
			.addSelect("m.group_id", "groupId")
			.addSelect(childDays, "childDays")
			.addSelect("COUNT(*)", "eventsCount")
			.innerJoin(Member, "m", "m.id = la.memberId AND m.deletedAt IS NULL")
			.innerJoin(Event, "e", `e.id = la.eventId AND ${FINISHED_EVENT_CONDITION}`, {
				cancelledStatus: EventStates.cancelled,
			})
			.innerJoin((qb) => childrenPerEvent(qb), "ec", "ec.event_id = la.event_id")
			.where("la.type = :leaderType", { leaderType: EventAttendeeType.leader })
			.andWhere(EVENT_YEAR_CONDITION, { year })
			.groupBy("m.id")
			.orderBy(childDays, "DESC")
			.addOrderBy("COUNT(*)", "ASC")
			.addOrderBy("m.nickname", "ASC")
			.getRawMany<
				Omit<TopLeader, "childDays" | "eventsCount" | "rank"> & { childDays: string; eventsCount: string }
			>();

		return setRanks(
			rows.map((row) => ({
				...row,
				childDays: Number(row.childDays),
				eventsCount: Number(row.eventsCount),
			})),
			(row) => row.childDays,
		);
	}

	async getLeaderEvents(memberId: number, year: number): Promise<LeaderEvent[]> {
		const childDays = `ec.children_count * ${EVENT_DAYS}`;

		const rows = await this.eventAttendeesRepository
			.createQueryBuilder("la")
			.select("e.id", "eventId")
			.addSelect("e.name", "name")
			.addSelect("TO_CHAR(e.date_from, 'YYYY-MM-DD')", "dateFrom")
			.addSelect("TO_CHAR(e.date_till, 'YYYY-MM-DD')", "dateTill")
			.addSelect(childDays, "childDays")
			.innerJoin(Event, "e", `e.id = la.eventId AND ${FINISHED_EVENT_CONDITION}`, {
				cancelledStatus: EventStates.cancelled,
			})
			.innerJoin((qb) => childrenPerEvent(qb), "ec", "ec.event_id = la.event_id")
			.where("la.type = :leaderType", { leaderType: EventAttendeeType.leader })
			.andWhere("la.memberId = :memberId", { memberId })
			.andWhere(EVENT_YEAR_CONDITION, { year })
			.orderBy(childDays, "DESC")
			.addOrderBy("e.date_from", "DESC")
			.getRawMany<Omit<LeaderEvent, "childDays"> & { childDays: string }>();

		return rows.map((row) => ({ ...row, childDays: Number(row.childDays) }));
	}
}
