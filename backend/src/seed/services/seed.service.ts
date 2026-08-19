import { Injectable, Logger } from "@nestjs/common";
import { DateTime } from "luxon";
import { HashService } from "src/auth/services/hash.service";
import { Config } from "src/config";
import { Album } from "src/models/albums/entities/album.entity";
import { Photo } from "src/models/albums/entities/photo.entity";
import { PhotosFilesService } from "src/models/albums/services/photos-files.service";
import { EventAttendee, EventAttendeeType } from "src/models/events/entities/event-attendee.entity";
import { EventExpense } from "src/models/events/entities/event-expense.entity";
import { Event } from "src/models/events/entities/event.entity";
import { Group } from "src/models/members/entities/group.entity";
import { MemberContact } from "src/models/members/entities/member-contact.entity";
import { Member } from "src/models/members/entities/member.entity";
import { User } from "src/models/users/entities/user.entity";
import { EntityManager } from "typeorm";
import { readFile } from "fs/promises";
import { extname, resolve } from "path";
import {
	SeedAlbums,
	SeedEventSchedules,
	SeedEvents,
	SeedGroups,
	SeedMembers,
	SeedPhoto,
	SeedUsers,
} from "../data/seed-data";

export const DatabaseEnvironments = {
	test: "test",
	production: "production",
} as const;

export const SeedPhotosDir = "assets/seed/photos";

export const SeedPasswordMissing =
	"Refusing to seed test data: set the SEED_PASSWORD environment variable to the password every seeded user gets.";

export function markTestDatabaseSql(database: string) {
	return `ALTER DATABASE "${database}" SET app.environment = '${DatabaseEnvironments.test}';`;
}

@Injectable()
export class SeedService {
	private readonly logger = new Logger(SeedService.name);

	constructor(
		private entityManager: EntityManager,
		private hashService: HashService,
		private config: Config,
		private photosFiles: PhotosFilesService,
	) {}

	async getDatabaseEnvironment(): Promise<{ database: string; environment: string | null }> {
		const [row] = await this.entityManager.query<{ database: string; environment: string | null }[]>(
			"SELECT current_database() AS database, current_setting('app.environment', true) AS environment",
		);

		return { database: row.database, environment: row.environment || null };
	}

	async assertTestDatabase(action: string, force = false) {
		const { database, environment } = await this.getDatabaseEnvironment();

		if (environment === DatabaseEnvironments.production) {
			throw new Error(
				`Refusing to ${action}: database '${database}' is marked as production (app.environment = '${DatabaseEnvironments.production}').`,
			);
		}

		if (environment !== DatabaseEnvironments.test && !force) {
			throw new Error(
				[
					`Refusing to ${action}: database '${database}' is not marked as a test database (app.environment = ${environment ?? "unset"}).`,
					`Either mark it as a test database:`,
					`    ${markTestDatabaseSql(database)}`,
					`or run the command with --force to do it anyway.`,
				].join("\n"),
			);
		}

		return database;
	}

	async seedOnStart() {
		if (!this.config.seed.password) {
			this.logger.error(`${SeedPasswordMissing} Skipping the seed.`);
			return;
		}

		const { database, environment } = await this.getDatabaseEnvironment();

		if (environment !== DatabaseEnvironments.test) {
			this.logger.error(
				`Database '${database}' is not marked as a test database (app.environment = ${environment ?? "unset"}), skipping the seed. Mark it as a test database: ${markTestDatabaseSql(database)}`,
			);
			return;
		}

		await this.seed();
	}

	async seed() {
		const password = this.config.seed.password;

		if (!password) throw new Error(SeedPasswordMissing);

		this.logger.log("Seeding test data...");

		await this.entityManager.transaction(async (t) => {
			const groupIds = await this.seedGroups(t);
			const memberIds = await this.seedMembers(t, groupIds);
			const userIds = await this.seedUsers(t, memberIds, password);
			await this.seedEvents(t, groupIds, memberIds);
			await this.seedAlbums(t, userIds);
		});

		this.logger.log("Test data seeded.");
	}

	private async seedGroups(t: EntityManager) {
		const groupIds = new Map<string, number>();

		for (const seedGroup of SeedGroups) {
			const existing = await t.findOne(Group, { where: { shortName: seedGroup.shortName } });

			const group = await t.save(Group, {
				...(existing ? { id: existing.id } : {}),
				shortName: seedGroup.shortName,
				name: seedGroup.name,
				color: seedGroup.color,
				darkColor: seedGroup.color,
				active: seedGroup.active,
			});

			groupIds.set(seedGroup.shortName, group.id);
		}

		this.logger.debug(` - Seeded ${groupIds.size} groups.`);

		return groupIds;
	}

	private async seedMembers(t: EntityManager, groupIds: Map<string, number>) {
		const memberIds = new Map<string, number>();

		for (const seedMember of SeedMembers) {
			const groupId = groupIds.get(seedMember.group);
			if (!groupId) throw new Error(`Unknown group '${seedMember.group}' for member '${seedMember.nickname}'.`);

			const existing = await t.findOne(Member, { where: { nickname: seedMember.nickname } });

			const member = await t.save(Member, {
				...(existing ? { id: existing.id } : {}),
				groupId,
				nickname: seedMember.nickname,
				role: seedMember.role,
				rank: seedMember.rank ?? null,
				function: seedMember.function ?? null,
				active: seedMember.active ?? true,
				membership: seedMember.membership ?? undefined,
				firstName: seedMember.firstName ?? null,
				lastName: seedMember.lastName ?? null,
				birthday: seedMember.birthday ?? null,
				mobile: seedMember.mobile ?? null,
				email: seedMember.email ?? null,
				addressStreet: seedMember.addressStreet ?? null,
				addressStreetNo: seedMember.addressStreetNo ?? null,
				addressCity: seedMember.addressCity ?? null,
				addressPostalCode: seedMember.addressPostalCode ?? null,
				addressCountry: seedMember.addressCity ? "Česká republika" : null,
				knownProblems: seedMember.knownProblems ?? null,
				allergies: seedMember.allergies ?? null,
			});

			memberIds.set(seedMember.nickname, member.id);

			await t.delete(MemberContact, { memberId: member.id });

			for (const seedContact of seedMember.contacts ?? []) {
				await t.insert(MemberContact, { memberId: member.id, ...seedContact });
			}
		}

		this.logger.debug(` - Seeded ${memberIds.size} members.`);

		return memberIds;
	}

	private async seedUsers(t: EntityManager, memberIds: Map<string, number>, password: string) {
		const userIds = new Map<string, number>();
		const passwordHash = await this.hashService.generateHash(password);

		for (const seedUser of SeedUsers) {
			const login = seedUser.login.toLocaleLowerCase();

			const existing = await t.findOne(User, { where: { login } });

			const user = await t.save(User, {
				...(existing ? { id: existing.id } : {}),
				login,
				email: seedUser.email,
				password: passwordHash,
				roles: seedUser.roles,
				memberId: memberIds.get(seedUser.member) ?? null,
				loginCode: null,
				loginCodeExp: null,
			});

			userIds.set(seedUser.login, user.id);
		}

		this.logger.warn(
			` - Seeded ${userIds.size} test users (${[...userIds.keys()].join(", ")}), all with the password from SEED_PASSWORD.`,
		);

		return userIds;
	}

	private async seedEvents(t: EntityManager, groupIds: Map<string, number>, memberIds: Map<string, number>) {
		const today = DateTime.local().startOf("day");

		for (const seedEvent of SeedEvents) {
			const { dateFrom, dateTill } = this.eventDates(today, seedEvent.schedule, seedEvent.weeks);

			const existing = await t.findOne(Event, { where: { name: seedEvent.name } });

			const event = await t.save(Event, {
				...(existing ? { id: existing.id } : {}),
				name: seedEvent.name,
				type: seedEvent.type,
				status: seedEvent.status,
				statusNote: null,
				place: seedEvent.place,
				placeGeometry: null,
				description: seedEvent.description,
				price: seedEvent.price ?? null,
				itemList: seedEvent.itemList ?? null,
				dateFrom: dateFrom.toISODate()!,
				dateTill: dateTill.toISODate()!,
				timeFrom: seedEvent.timeFrom ?? null,
				timeTill: seedEvent.timeTill ?? null,
				meetingPlaceStart: seedEvent.meetingPlaceStart ?? null,
				meetingPlaceEnd: seedEvent.meetingPlaceEnd ?? null,
				waterKm: seedEvent.waterKm ?? null,
				river: seedEvent.river ?? null,
				leadersEvent: seedEvent.leadersEvent ?? false,
				hasRegistration: seedEvent.hasRegistration ?? false,
				report: null,
				srcId: null,
				groups: seedEvent.groups.map((shortName) => {
					const id = groupIds.get(shortName);
					if (!id) throw new Error(`Unknown group '${shortName}' for event '${seedEvent.name}'.`);
					return { id } as Group;
				}),
			});

			await t.delete(EventAttendee, { eventId: event.id });
			await t.delete(EventExpense, { eventId: event.id });

			const attendees: [string[], EventAttendeeType][] = [
				[seedEvent.leaders, EventAttendeeType.leader],
				[seedEvent.attendees, EventAttendeeType.attendee],
			];

			for (const [nicknames, type] of attendees) {
				for (const nickname of nicknames) {
					const memberId = memberIds.get(nickname);
					if (!memberId) throw new Error(`Unknown member '${nickname}' for event '${seedEvent.name}'.`);

					await t.insert(EventAttendee, { eventId: event.id, memberId, type });
				}
			}

			for (const seedExpense of seedEvent.expenses ?? []) {
				await t.insert(EventExpense, { eventId: event.id, ...seedExpense });
			}
		}

		this.logger.debug(` - Seeded ${SeedEvents.length} events.`);
	}

	private eventDates(today: DateTime, schedule: SeedEventSchedules, weeks: number) {
		const saturday = today.plus({ days: (6 - today.weekday + 7) % 7 || 7 }).plus({ weeks });

		switch (schedule) {
			case SeedEventSchedules.longWeekend:
				return { dateFrom: saturday.minus({ days: 1 }), dateTill: saturday.plus({ days: 1 }) };
			case SeedEventSchedules.week:
				return { dateFrom: saturday, dateTill: saturday.plus({ days: 7 }) };
			default:
				return { dateFrom: saturday, dateTill: saturday.plus({ days: 1 }) };
		}
	}

	private async seedAlbums(t: EntityManager, userIds: Map<string, number>) {
		const today = DateTime.local().startOf("day");
		const createdById = userIds.values().next().value ?? null;

		for (const seedAlbum of SeedAlbums) {
			const dateFrom = today.plus({ days: seedAlbum.dayOffset });
			const dateTill = dateFrom.plus({ days: seedAlbum.days - 1 });

			const existing = await t.findOne(Album, { where: { name: seedAlbum.name } });

			const album = await t.save(Album, {
				...(existing ? { id: existing.id } : {}),
				name: seedAlbum.name,
				description: seedAlbum.description,
				status: seedAlbum.status,
				dateFrom: dateFrom.toISODate()!,
				dateTill: dateTill.toISODate()!,
				datePublished: DateTime.local().toISO(),
				eventId: null,
				createdById,
			});

			await this.seedPhotos(t, album.id, seedAlbum.photos, dateFrom, createdById);
		}

		this.logger.debug(
			` - Seeded ${SeedAlbums.length} albums with ${SeedAlbums.reduce((count, album) => count + album.photos.length, 0)} photos.`,
		);
	}

	private async seedPhotos(
		t: EntityManager,
		albumId: number,
		seedPhotos: SeedPhoto[],
		dateFrom: DateTime,
		uploadedById: number | null,
	) {
		for (const [index, seedPhoto] of seedPhotos.entries()) {
			const buffer = await readFile(resolve(SeedPhotosDir, seedPhoto.name));
			const metadata = await this.photosFiles.extractMetadata(buffer);

			const existing = await t.findOne(Photo, { where: { albumId, name: seedPhoto.name } });

			const photo = await t.save(Photo, {
				...(existing ? { id: existing.id } : {}),
				albumId,
				name: seedPhoto.name,
				title: seedPhoto.title,
				caption: seedPhoto.caption,
				tags: seedPhoto.tags,
				order: index,
				timestamp: dateFrom.plus({ days: index }).toJSDate(),
				width: metadata.width,
				height: metadata.height,
				bg: metadata.bg,
				uploadedById,
				srcAlbumId: null,
				srcId: null,
			});

			await this.photosFiles.savePhotoFiles(albumId, photo.id, extname(seedPhoto.name), buffer);
		}
	}
}
