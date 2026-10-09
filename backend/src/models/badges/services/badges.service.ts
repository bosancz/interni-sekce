import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EventAttendee, EventAttendeeType } from "src/models/events/entities/event-attendee.entity";
import { Event, EventStates } from "src/models/events/entities/event.entity";
import { Member } from "src/models/members/entities/member.entity";
import { NotificationsService } from "src/models/notifications/services/notifications.service";
import { childrenPerEvent, EVENT_DAYS, FINISHED_EVENT_CONDITION } from "src/models/statistics/statistics.helpers";
import { DataSource, IsNull, Repository, SelectQueryBuilder } from "typeorm";
import { MemberBadge } from "../entities/member-badge.entity";
import { BadgeTypes, BadgeTypesMetadata } from "../schema/badge-types";

export const LONG_EVENT_DAYS = 7;

const PODIUM_RANK = 3;

type BadgeValues = Record<BadgeTypes, number>;

export interface EarnedBadge {
	memberId: number;
	badge: BadgeTypes;
	level: number;
}

export interface MemberBadgeLevel {
	level: number;
	threshold: number;
	earnedAt: Date | null;
	seenAt: Date | null;
}

export interface MemberBadgeProgress {
	badge: BadgeTypes;
	title: string;
	description: string;
	unit: string;
	icon: string;
	value: number;
	level: number;
	levels: MemberBadgeLevel[];
}

export function getBadgeLevel(badge: BadgeTypes, value: number): number {
	return BadgeTypesMetadata[badge].thresholds.filter((threshold) => value >= threshold).length;
}

export function getBadgeLevelTitle(badge: BadgeTypes, level: number): string {
	const metadata = BadgeTypesMetadata[badge];
	if (metadata.thresholds.length === 1) return metadata.title;
	return `${metadata.title} ${["I", "II", "III", "IV", "V", "VI"][level - 1] ?? level}`;
}

@Injectable()
export class BadgesService {
	private logger = new Logger(BadgesService.name);

	constructor(
		private dataSource: DataSource,
		@InjectRepository(MemberBadge) private memberBadges: Repository<MemberBadge>,
		@InjectRepository(Member) private members: Repository<Member>,
		private notificationsService: NotificationsService,
	) {}

	async evaluateAll(): Promise<{ members: number; badges: number }> {
		const earned = await this.evaluate();

		const byMember = new Map<number, EarnedBadge[]>();
		for (const badge of earned) byMember.set(badge.memberId, [...(byMember.get(badge.memberId) ?? []), badge]);

		for (const [memberId, badges] of byMember) {
			await this.notificationsService
				.onBadgesEarned(
					memberId,
					badges.map((badge) => ({
						title: getBadgeLevelTitle(badge.badge, badge.level),
						description: BadgeTypesMetadata[badge.badge].description,
					})),
				)
				.catch((err) => this.logger.error(`Failed to notify member ${memberId} about badges: ${err}`));
		}

		this.logger.log(`Awarded ${earned.length} badges to ${byMember.size} members.`);
		return { members: byMember.size, badges: earned.length };
	}

	async evaluate(memberId?: number): Promise<EarnedBadge[]> {
		const values = await this.getValues(memberId);

		const candidates: EarnedBadge[] = [];
		for (const [member, memberValues] of values) {
			for (const badge of Object.values(BadgeTypes)) {
				const level = getBadgeLevel(badge, memberValues[badge]);
				for (let l = 1; l <= level; l++) candidates.push({ memberId: member, badge, level: l });
			}
		}
		if (!candidates.length) return [];

		return this.dataSource.query(
			`INSERT INTO members_badges (member_id, badge, level)
			SELECT * FROM unnest($1::int[], $2::varchar[], $3::int[])
			ON CONFLICT (member_id, badge, level) DO NOTHING
			RETURNING member_id AS "memberId", badge, level`,
			[candidates.map((c) => c.memberId), candidates.map((c) => c.badge), candidates.map((c) => c.level)],
		);
	}

	async getMemberBadges(memberId: number | null): Promise<MemberBadgeProgress[]> {
		const [values, earned] =
			memberId !== null
				? await Promise.all([this.getValues(memberId), this.memberBadges.find({ where: { memberId } })])
				: [new Map<number, BadgeValues>(), []];

		const memberValues = memberId !== null ? values.get(memberId) : undefined;

		return Object.values(BadgeTypes).map((badge) => {
			const metadata = BadgeTypesMetadata[badge];
			const value = memberValues?.[badge] ?? 0;

			const levels = metadata.thresholds.map((threshold, index) => {
				const row = earned.find((item) => item.badge === badge && item.level === index + 1);
				return { level: index + 1, threshold, earnedAt: row?.earnedAt ?? null, seenAt: row?.seenAt ?? null };
			});

			return {
				badge,
				title: metadata.title,
				description: metadata.description,
				unit: metadata.unit,
				icon: metadata.icon,
				value,
				level: levels.filter((level) => level.earnedAt).length,
				levels,
			};
		});
	}

	async markSeen(memberId: number): Promise<void> {
		await this.memberBadges.update({ memberId, seenAt: IsNull() }, { seenAt: new Date() });
	}

	private async getValues(memberId?: number): Promise<Map<number, BadgeValues>> {
		const members = await this.members.find({
			where: memberId !== undefined ? { id: memberId } : {},
			select: { id: true },
		});

		const values = new Map<number, BadgeValues>(
			members.map((member) => [
				member.id,
				Object.fromEntries(Object.values(BadgeTypes).map((badge) => [badge, 0])) as BadgeValues,
			]),
		);

		const set = (rows: { memberId: number }[], map: (row: any) => Partial<BadgeValues>) => {
			for (const row of rows) {
				const memberValues = values.get(Number(row.memberId));
				if (!memberValues) continue;
				for (const [badge, value] of Object.entries(map(row)))
					memberValues[badge as BadgeTypes] = Number(value);
			}
		};

		const [attendance, leading, leaderRanks, topEvents, photos] = await Promise.all([
			this.getAttendance(memberId),
			this.getLeading(memberId),
			this.getLeaderRanks(memberId),
			this.getTopEvents(memberId),
			this.getPhotos(memberId),
		]);

		set(attendance, (row) => ({
			firstEvent: row.events,
			eventsAttended: row.events,
			daysOnEvents: row.days,
			longEvents: row.longEvents,
			seasons: row.seasons,
		}));
		set(leading, (row) => ({ firstLed: row.events, eventsLed: row.events, childDays: row.childDays }));
		set(leaderRanks, (row) => ({ topLeader: row.firstPlaces, podium: row.podiums }));
		set(topEvents, (row) => ({ topEvent: row.events }));
		set(photos, (row) => ({ photos: row.photos }));

		return values;
	}

	private finishedAttendance(memberId?: number): SelectQueryBuilder<EventAttendee> {
		const qb = this.dataSource
			.getRepository(EventAttendee)
			.createQueryBuilder("a")
			.innerJoin(Member, "m", "m.id = a.memberId AND m.deletedAt IS NULL")
			.innerJoin(Event, "e", `e.id = a.eventId AND ${FINISHED_EVENT_CONDITION}`, {
				cancelledStatus: EventStates.cancelled,
			});

		if (memberId !== undefined) qb.andWhere("a.memberId = :memberId", { memberId });

		return qb;
	}

	private getAttendance(memberId?: number) {
		return this.finishedAttendance(memberId)
			.select("a.member_id", "memberId")
			.addSelect("COUNT(*)", "events")
			.addSelect(`SUM(${EVENT_DAYS})`, "days")
			.addSelect(`COUNT(*) FILTER (WHERE ${EVENT_DAYS} >= :longEventDays)`, "longEvents")
			.addSelect("COUNT(DISTINCT EXTRACT(YEAR FROM e.date_from))", "seasons")
			.setParameter("longEventDays", LONG_EVENT_DAYS)
			.groupBy("a.member_id")
			.getRawMany();
	}

	private getLeading(memberId?: number) {
		return this.finishedAttendance(memberId)
			.select("a.member_id", "memberId")
			.addSelect("COUNT(*)", "events")
			.addSelect(`COALESCE(SUM(ec.children_count * ${EVENT_DAYS}), 0)`, "childDays")
			.leftJoin((qb) => childrenPerEvent(qb), "ec", "ec.event_id = a.event_id")
			.andWhere("a.type = :leaderType", { leaderType: EventAttendeeType.leader })
			.groupBy("a.member_id")
			.getRawMany();
	}

	private async getLeaderRanks(memberId?: number) {
		const childDays = `SUM(ec.children_count * ${EVENT_DAYS})`;

		const ranking = this.finishedAttendance()
			.select("a.member_id", "member_id")
			.addSelect(`RANK() OVER (PARTITION BY EXTRACT(YEAR FROM e.date_from) ORDER BY ${childDays} DESC)`, "rank")
			.innerJoin((qb) => childrenPerEvent(qb), "ec", "ec.event_id = a.event_id")
			.andWhere("a.type = :leaderType", { leaderType: EventAttendeeType.leader })
			.groupBy("a.member_id")
			.addGroupBy("EXTRACT(YEAR FROM e.date_from)");

		const qb = this.dataSource
			.createQueryBuilder()
			.select("r.member_id", "memberId")
			.addSelect("COUNT(*) FILTER (WHERE r.rank = 1)", "firstPlaces")
			.addSelect("COUNT(*) FILTER (WHERE r.rank <= :podiumRank)", "podiums")
			.from(`(${ranking.getQuery()})`, "r")
			.setParameters({ ...ranking.getParameters(), podiumRank: PODIUM_RANK })
			.groupBy("r.member_id");

		if (memberId !== undefined) qb.where("r.member_id = :memberId", { memberId });

		return qb.getRawMany();
	}

	private async getTopEvents(memberId?: number) {
		const ranking = this.dataSource
			.getRepository(Event)
			.createQueryBuilder("e")
			.select("e.id", "event_id")
			.addSelect(
				`RANK() OVER (PARTITION BY EXTRACT(YEAR FROM e.date_from) ORDER BY ec.children_count * ${EVENT_DAYS} DESC)`,
				"rank",
			)
			.innerJoin((qb) => childrenPerEvent(qb), "ec", "ec.event_id = e.id")
			.where(FINISHED_EVENT_CONDITION, { cancelledStatus: EventStates.cancelled });

		const qb = this.dataSource
			.createQueryBuilder()
			.select("la.member_id", "memberId")
			.addSelect("COUNT(*)", "events")
			.from(`(${ranking.getQuery()})`, "r")
			.innerJoin("events_attendees", "la", "la.event_id = r.event_id AND la.type = :leaderType")
			.where("r.rank = 1")
			.setParameters({ ...ranking.getParameters(), leaderType: EventAttendeeType.leader })
			.groupBy("la.member_id");

		if (memberId !== undefined) qb.andWhere("la.member_id = :memberId", { memberId });

		return qb.getRawMany();
	}

	private getPhotos(memberId?: number): Promise<{ memberId: number; photos: string }[]> {
		return this.dataSource.query(
			`SELECT f.member_id AS "memberId", COUNT(DISTINCT f.photo_id) AS "photos"
			FROM photo_faces f
			JOIN photos p ON p.id = f.photo_id
			JOIN albums a ON a.id = p.album_id AND a.deleted_at IS NULL
			WHERE f.member_id IS NOT NULL AND ($1::int IS NULL OR f.member_id = $1)
			GROUP BY f.member_id`,
			[memberId ?? null],
		);
	}
}
