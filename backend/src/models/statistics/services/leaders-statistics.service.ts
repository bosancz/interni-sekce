import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EventAttendee, EventAttendeeType } from "src/models/events/entities/event-attendee.entity";
import { Event, EventStates } from "src/models/events/entities/event.entity";
import { Member, MemberRoles } from "src/models/members/entities/member.entity";
import { Repository } from "typeorm";

/**
 * Age at which an attendee stops counting as a child. Members have no role history — only their
 * current `role` — so whether somebody was a child *at the time of the event* is derived from their
 * birthday and the event's start date instead.
 */
const CHILD_AGE_LIMIT = 15;

export interface TopLeader {
	memberId: number;
	nickname: string;
	firstName: string | null;
	lastName: string | null;
	groupId: number;
	/** "Dětodny" — children × days, summed over the events the member led. The ranking score. */
	childDays: number;
	/** How many children that score comes from (each event's children counted once). */
	childrenCount: number;
	/** How many events that score comes from. */
	eventsCount: number;
}

@Injectable()
export class LeadersStatisticsService {
	constructor(@InjectRepository(EventAttendee) private eventAttendeesRepository: Repository<EventAttendee>) {}

	/**
	 * Ranks leaders by the "dětodny" they collected **this year**: every event is worth its number
	 * of child attendees multiplied by how many days it lasted, so a two-day event with three
	 * children scores 6. Every leader of an event gets the full score, so co-leaders each score the
	 * whole event.
	 *
	 * Only finished, non-cancelled events of the current calendar year count, and an attendee counts
	 * as a child when they were under {@link CHILD_AGE_LIMIT} on the day the event started (members
	 * whose birthday is unknown fall back to their current role).
	 */
	async getTopLeaders(limit: number): Promise<TopLeader[]> {
		// both dates are inclusive, so a same-day event lasts one day
		const eventDays = "(e.date_till - e.date_from + 1)";
		const childDays = `SUM(ec.children_count * ${eventDays})`;

		const rows = await this.eventAttendeesRepository
			.createQueryBuilder("la")
			.select("m.id", "memberId")
			.addSelect("m.nickname", "nickname")
			.addSelect("m.first_name", "firstName")
			.addSelect("m.last_name", "lastName")
			.addSelect("m.group_id", "groupId")
			.addSelect(childDays, "childDays")
			.addSelect("SUM(ec.children_count)", "childrenCount")
			.addSelect("COUNT(*)", "eventsCount")
			.innerJoin(Member, "m", "m.id = la.memberId AND m.deletedAt IS NULL")
			.innerJoin(Event, "e", "e.id = la.eventId AND e.deletedAt IS NULL")
			// children per event, counted once per event — the day multiplier is applied above
			.innerJoin(
				(qb) =>
					qb
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
						.groupBy("ca.event_id"),
				"ec",
				"ec.event_id = la.event_id",
			)
			.where("la.type = :leaderType", { leaderType: EventAttendeeType.leader })
			.andWhere("e.status != :cancelledStatus", { cancelledStatus: EventStates.cancelled })
			.andWhere("e.dateTill <= CURRENT_DATE")
			.andWhere("EXTRACT(YEAR FROM e.dateFrom) = EXTRACT(YEAR FROM CURRENT_DATE)")
			.groupBy("m.id")
			.orderBy(childDays, "DESC")
			// fewest events for the same score first, then alphabetically — so the order never
			// depends on how the database happens to return the rows
			.addOrderBy("COUNT(*)", "ASC")
			.addOrderBy("m.nickname", "ASC")
			.limit(limit)
			.getRawMany<{
				memberId: number;
				nickname: string;
				firstName: string | null;
				lastName: string | null;
				groupId: number;
				childDays: string;
				childrenCount: string;
				eventsCount: string;
			}>();

		// SUM()/COUNT() come back as strings (Postgres bigint/numeric)
		return rows.map((row) => ({
			...row,
			childDays: Number(row.childDays),
			childrenCount: Number(row.childrenCount),
			eventsCount: Number(row.eventsCount),
		}));
	}
}
