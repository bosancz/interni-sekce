import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EventAttendee, EventAttendeeType } from "src/models/events/entities/event-attendee.entity";
import { Event, EventStates } from "src/models/events/entities/event.entity";
import { Member, MemberRoles } from "src/models/members/entities/member.entity";
import { ObjectLiteral, Repository, SelectQueryBuilder } from "typeorm";

/**
 * Age at which an attendee stops counting as a child. Members have no role history — only their
 * current `role` — so whether somebody was a child *at the time of the event* is derived from their
 * birthday and the event's start date instead.
 */
const CHILD_AGE_LIMIT = 15;

/** Both dates are inclusive, so a same-day event lasts one day. Expects the event alias to be `e`. */
const EVENT_DAYS = "(e.date_till - e.date_from + 1)";

/** Only events that already happened are ranked — future ones have nothing to show yet. */
const FINISHED_EVENT_CONDITION = "e.deletedAt IS NULL AND e.status != :cancelledStatus AND e.dateTill <= CURRENT_DATE";

const EVENT_YEAR_CONDITION = "EXTRACT(YEAR FROM e.dateFrom) = :year";

export interface TopLeader {
	memberId: number;
	nickname: string;
	firstName: string | null;
	lastName: string | null;
	groupId: number;
	/** "Dětodny" — children × days, summed over the events the member led. The ranking score. */
	childDays: number;
	/** How many events that score comes from. */
	eventsCount: number;
}

export interface LeadersStatistics {
	year: number;
	/** Dětodny of *every* event of the year, each event counted once — not once per leader. */
	childDays: number;
	/** Oldest and newest year with a finished event, so the year switcher knows where to stop. */
	firstYear: number;
	lastYear: number;
	leaders: TopLeader[];
}

@Injectable()
export class LeadersStatisticsService {
	constructor(
		@InjectRepository(EventAttendee) private eventAttendeesRepository: Repository<EventAttendee>,
		@InjectRepository(Event) private eventsRepository: Repository<Event>,
	) {}

	/**
	 * Everything the dashboard's leaders block shows for one year: the year's total dětodny, the
	 * best leaders in it, and the range of years that have any data at all.
	 */
	async getLeadersStatistics(year: number, limit: number): Promise<LeadersStatistics> {
		const [childDays, leaders, { firstYear, lastYear }] = await Promise.all([
			this.getChildDays(year),
			this.getTopLeaders(year, limit),
			this.getYearRange(),
		]);

		return { year, childDays, firstYear, lastYear, leaders };
	}

	/**
	 * Ranks leaders by the "dětodny" they collected in the given year: every event is worth its
	 * number of child attendees multiplied by how many days it lasted, so a two-day event with three
	 * children scores 6. Every leader of an event gets the full score, so co-leaders each score the
	 * whole event.
	 */
	private async getTopLeaders(year: number, limit: number): Promise<TopLeader[]> {
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
			// fewest events for the same score first, then alphabetically — so the order never
			// depends on how the database happens to return the rows
			.addOrderBy("COUNT(*)", "ASC")
			.addOrderBy("m.nickname", "ASC")
			.limit(limit)
			.getRawMany<Omit<TopLeader, "childDays" | "eventsCount"> & { childDays: string; eventsCount: string }>();

		// SUM()/COUNT() come back as strings (Postgres bigint/numeric)
		return rows.map((row) => ({
			...row,
			childDays: Number(row.childDays),
			eventsCount: Number(row.eventsCount),
		}));
	}

	/**
	 * Dětodny of the whole year — summed over *events*, so an event with two leaders still counts
	 * once, unlike the per-leader scores of the ranking.
	 */
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

	/** Years that have a finished event, falling back to the current year on an empty database. */
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

	/**
	 * Children per event, counted once per event — the day multiplier is applied by the callers.
	 * An attendee counts as a child when they were under {@link CHILD_AGE_LIMIT} on the day the
	 * event started; members whose birthday is unknown fall back to their current role.
	 */
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
