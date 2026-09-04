import { EventAttendee, EventAttendeeType } from "src/models/events/entities/event-attendee.entity";
import { Event, EventStates } from "src/models/events/entities/event.entity";
import { Member, MemberRoles } from "src/models/members/entities/member.entity";
import { ObjectLiteral, Repository, SelectQueryBuilder } from "typeorm";

export const CHILD_AGE_LIMIT = 15;

export const EVENT_DAYS = "(e.date_till - e.date_from + 1)";

export const FINISHED_EVENT_CONDITION =
	"e.deletedAt IS NULL AND e.status != :cancelledStatus AND e.dateTill <= CURRENT_DATE";

export const EVENT_YEAR_CONDITION = "EXTRACT(YEAR FROM e.dateFrom) = :year";

export const CHILD_PARAMS = { childAgeLimit: CHILD_AGE_LIMIT, childRole: MemberRoles.dite };

export function childCondition(memberAlias: string, eventAlias: string): string {
	return (
		`((${memberAlias}.birthday IS NOT NULL` +
		` AND ${memberAlias}.birthday + make_interval(years => :childAgeLimit) > ${eventAlias}.dateFrom)` +
		` OR (${memberAlias}.birthday IS NULL AND ${memberAlias}.role = :childRole))`
	);
}

export function childrenPerEvent(qb: SelectQueryBuilder<ObjectLiteral>) {
	return qb
		.select("ca.event_id", "event_id")
		.addSelect("COUNT(*)", "children_count")
		.from(EventAttendee, "ca")
		.innerJoin(Member, "cm", "cm.id = ca.memberId AND cm.deletedAt IS NULL")
		.innerJoin(Event, "ce", "ce.id = ca.eventId")
		.where("ca.type = :attendeeType", { attendeeType: EventAttendeeType.attendee })
		.andWhere(childCondition("cm", "ce"), CHILD_PARAMS)
		.groupBy("ca.event_id");
}

export function setRanks<T>(rows: T[], score: (row: T) => number): (T & { rank: number })[] {
	let rank = 0;
	let previousScore: number | undefined = undefined;

	return rows.map((row, index) => {
		if (score(row) !== previousScore) {
			rank = index + 1;
			previousScore = score(row);
		}

		return { ...row, rank };
	});
}

export async function getEventYearRange(events: Repository<Event>): Promise<{ firstYear: number; lastYear: number }> {
	const row = await events
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

export async function getTotalChildDays(events: Repository<Event>, year: number): Promise<number> {
	const row = await events
		.createQueryBuilder("e")
		.select(`COALESCE(SUM(ec.children_count * ${EVENT_DAYS}), 0)`, "childDays")
		.innerJoin((qb) => childrenPerEvent(qb), "ec", "ec.event_id = e.id")
		.where(FINISHED_EVENT_CONDITION, { cancelledStatus: EventStates.cancelled })
		.andWhere(EVENT_YEAR_CONDITION, { year })
		.getRawOne<{ childDays: string }>();

	return Number(row?.childDays ?? 0);
}
