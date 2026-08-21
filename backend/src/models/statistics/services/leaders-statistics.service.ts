import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EventAttendee, EventAttendeeType } from "src/models/events/entities/event-attendee.entity";
import { Event, EventStates } from "src/models/events/entities/event.entity";
import { Member, MemberRoles } from "src/models/members/entities/member.entity";
import { ObjectLiteral, Repository, SelectQueryBuilder } from "typeorm";

const CHILD_AGE_LIMIT = 15;

const EVENT_DAYS = "(e.date_till - e.date_from + 1)";

const FINISHED_EVENT_CONDITION = "e.deletedAt IS NULL AND e.status != :cancelledStatus AND e.dateTill <= CURRENT_DATE";

const EVENT_YEAR_CONDITION = "EXTRACT(YEAR FROM e.dateFrom) = :year";

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
			this.getChildDays(year),
			this.getRankedLeaders(year),
			this.getYearRange(),
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
			.innerJoin((qb) => this.childrenPerEvent(qb), "ec", "ec.event_id = la.event_id")
			.where("la.type = :leaderType", { leaderType: EventAttendeeType.leader })
			.andWhere(EVENT_YEAR_CONDITION, { year })
			.groupBy("m.id")
			.orderBy(childDays, "DESC")
			.addOrderBy("COUNT(*)", "ASC")
			.addOrderBy("m.nickname", "ASC")
			.getRawMany<
				Omit<TopLeader, "childDays" | "eventsCount" | "rank"> & { childDays: string; eventsCount: string }
			>();

		return this.setRanks(
			rows.map((row) => ({
				...row,
				childDays: Number(row.childDays),
				eventsCount: Number(row.eventsCount),
			})),
		);
	}

	private setRanks(leaders: Omit<TopLeader, "rank">[]): TopLeader[] {
		let rank = 0;
		let previousChildDays: number | undefined = undefined;

		return leaders.map((leader, index) => {
			if (leader.childDays !== previousChildDays) {
				rank = index + 1;
				previousChildDays = leader.childDays;
			}

			return { ...leader, rank };
		});
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
			.innerJoin((qb) => this.childrenPerEvent(qb), "ec", "ec.event_id = la.event_id")
			.where("la.type = :leaderType", { leaderType: EventAttendeeType.leader })
			.andWhere("la.memberId = :memberId", { memberId })
			.andWhere(EVENT_YEAR_CONDITION, { year })
			.orderBy(childDays, "DESC")
			.addOrderBy("e.date_from", "DESC")
			.getRawMany<Omit<LeaderEvent, "childDays"> & { childDays: string }>();

		return rows.map((row) => ({ ...row, childDays: Number(row.childDays) }));
	}

	private async getChildDays(year: number): Promise<number> {
		const row = await this.eventsRepository
			.createQueryBuilder("e")
			.select(`COALESCE(SUM(ec.children_count * ${EVENT_DAYS}), 0)`, "childDays")
			.innerJoin((qb) => this.childrenPerEvent(qb), "ec", "ec.event_id = e.id")
			.where(FINISHED_EVENT_CONDITION, { cancelledStatus: EventStates.cancelled })
			.andWhere(EVENT_YEAR_CONDITION, { year })
			.getRawOne<{ childDays: string }>();

		return Number(row?.childDays ?? 0);
	}

	private async getYearRange(): Promise<{ firstYear: number; lastYear: number }> {
		const row = await this.eventsRepository
			.createQueryBuilder("e")
			.select("MIN(EXTRACT(YEAR FROM e.date_from))", "firstYear")
			.addSelect("MAX(EXTRACT(YEAR FROM e.date_from))", "lastYear")
			.where(FINISHED_EVENT_CONDITION, { cancelledStatus: EventStates.cancelled })
			.getRawOne<{ firstYear: string | null; lastYear: string | null }>();

		const currentYear = new Date().getFullYear();

		return {
			firstYear: row?.firstYear ? Number(row.firstYear) : currentYear,
			lastYear: row?.lastYear ? Number(row.lastYear) : currentYear,
		};
	}

	private childrenPerEvent(qb: SelectQueryBuilder<ObjectLiteral>) {
		return qb
			.select("ca.event_id", "event_id")
			.addSelect("COUNT(*)", "children_count")
			.from(EventAttendee, "ca")
			.innerJoin(Member, "cm", "cm.id = ca.memberId AND cm.deletedAt IS NULL")
			.innerJoin(Event, "ce", "ce.id = ca.eventId")
			.where("ca.type = :attendeeType", { attendeeType: EventAttendeeType.attendee })
			.andWhere(
				"((cm.birthday IS NOT NULL AND cm.birthday + make_interval(years => :childAgeLimit) > ce.dateFrom)" +
					" OR (cm.birthday IS NULL AND cm.role = :childRole))",
				{ childAgeLimit: CHILD_AGE_LIMIT, childRole: MemberRoles.dite },
			)
			.groupBy("ca.event_id");
	}
}
