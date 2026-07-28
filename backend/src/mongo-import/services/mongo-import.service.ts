import { Injectable, Logger } from "@nestjs/common";
import { DateTime } from "luxon";
import mongoose, { Model } from "mongoose";
import { Config } from "src/config";
import { Album } from "src/models/albums/entities/album.entity";
import { Photo } from "src/models/albums/entities/photo.entity";
import { EventAttendee, EventAttendeeType } from "src/models/events/entities/event-attendee.entity";
import { EventExpense, EventExpenseTypes } from "src/models/events/entities/event-expense.entity";
import { Event, EventStates } from "src/models/events/entities/event.entity";
import { Group } from "src/models/members/entities/group.entity";
import { MemberContact } from "src/models/members/entities/member-contact.entity";
import { Member, MemberRanks, MemberRoles, MembershipStates } from "src/models/members/entities/member.entity";
import { PhotosRepository } from "src/models/albums/repositories/photos.repository";
import { User, UserRoles } from "src/models/users/entities/user.entity";
import { EntityManager, EntityTarget, In, ObjectLiteral } from "typeorm";
import { MongoMemberGroups } from "../data/member-groups";
import { MongoAlbum, MongoAlbumSchema } from "../models/album";
import { MongoEvent, MongoEventSchema } from "../models/event";
import { MongoMember, MongoMemberSchema } from "../models/member";
import { MongoPhoto, MongoPhotoSchema } from "../models/photo";
import { MongoUser, MongoUserSchema } from "../models/user";

@Injectable()
export class MongoImportService {
	private readonly logger = new Logger(MongoImportService.name);

	private readonly groupsIndex = new Map<string, number>();

	// Assigned lazily in importData() once the Mongo connection is established, so that no
	// connection is opened just by constructing this service at CLI startup.
	private albumsModel!: Model<MongoAlbum>;
	private photosModel!: Model<MongoPhoto>;
	private eventsModel!: Model<MongoEvent>;
	private membersModel!: Model<MongoMember>;
	private usersModel!: Model<MongoUser>;

	constructor(
		private entityManager: EntityManager,
		private config: Config,
		private photosRepository: PhotosRepository,
	) {}

	async importData() {
		this.logger.log(`Starting mongo import from ${this.config.mongoDb.uri}...`);

		// Connect to Mongo only now, when the import actually runs — not at module/CLI startup.
		const connection = await mongoose
			.createConnection(this.config.mongoDb.uri, { connectTimeoutMS: 1000 })
			.asPromise();

		this.albumsModel = connection.model(MongoAlbum.name, MongoAlbumSchema);
		this.photosModel = connection.model(MongoPhoto.name, MongoPhotoSchema);
		this.eventsModel = connection.model(MongoEvent.name, MongoEventSchema);
		this.membersModel = connection.model(MongoMember.name, MongoMemberSchema);
		this.usersModel = connection.model(MongoUser.name, MongoUserSchema);

		try {
			await this.entityManager.transaction(async (t) => {
				await this.init(t);

				const memberIds = await this.importMembers(t);

				const userIds = await this.importUsers(t, memberIds);

				const eventIds = await this.importEvents(t, memberIds);

				await this.importAlbums(t, userIds, eventIds);
			});
		} finally {
			await connection.close();
		}

		this.logger.log(`Mongo import finished.`);
	}

	/**
	 * Backfill *only* the album title-photo selection from Mongo onto the already-imported Postgres
	 * data — used when a full reimport is no longer possible because the data is live and has since
	 * been edited. The legacy selection lives in `album.titlePhotos` (older single `titlePhoto` as a
	 * fallback); each entry is a Mongo photo ObjectId, which maps onto the existing rows through
	 * `photos.srcId` (the legacy id kept at import time). Touches nothing but `title_photo_order`.
	 *
	 * By default albums that already have a selection are left untouched (so an editor's choice made
	 * in the app is never clobbered); pass `overwrite` to replace those too. Safe to re-run.
	 */
	async importTitlePhotosOnly(options: { overwrite?: boolean } = {}) {
		this.logger.log(`Starting title-photo backfill from ${this.config.mongoDb.uri}...`);

		const connection = await mongoose
			.createConnection(this.config.mongoDb.uri, { connectTimeoutMS: 1000 })
			.asPromise();

		this.albumsModel = connection.model(MongoAlbum.name, MongoAlbumSchema);

		let albumsSet = 0;
		let photosSet = 0;
		let skipped = 0;
		let unresolved = 0;

		try {
			const mongoAlbums = await this.albumsModel.find({}).lean();
			this.logger.debug(` - Found ${mongoAlbums.length} albums in mongo.`);

			for (const mongoAlbum of mongoAlbums) {
				// prefer the newer ordered array, fall back to the single legacy field
				const mongoTitleIds = mongoAlbum.titlePhotos?.length
					? mongoAlbum.titlePhotos
					: mongoAlbum.titlePhoto
						? [mongoAlbum.titlePhoto]
						: [];
				if (!mongoTitleIds.length) continue;

				// map the legacy photo ObjectIds onto the already-imported rows via photos.srcId
				const srcIds = mongoTitleIds.map((id) => id.toString());
				const existingPhotos = await this.entityManager.find(Photo, { where: { srcId: In(srcIds) } });
				const bySrcId = new Map(existingPhotos.map((photo) => [photo.srcId, photo]));

				// preserve the legacy order, dedupe, cap at three
				const ordered: Photo[] = [];
				for (const srcId of srcIds) {
					const photo = bySrcId.get(srcId);
					if (photo && !ordered.some((item) => item.id === photo.id)) ordered.push(photo);
					if (ordered.length === 3) break;
				}

				if (!ordered.length) {
					// the album referenced title photos, but none of them still exist in Postgres
					unresolved++;
					continue;
				}

				// the selection belongs to one album; ignore stray references to other albums' photos
				const albumId = ordered[0].albumId;
				const photoIds = ordered.filter((photo) => photo.albumId === albumId).map((photo) => photo.id);

				if (!options.overwrite) {
					const current = await this.photosRepository.getTitlePhotos(albumId);
					if (current.length) {
						skipped++;
						continue;
					}
				}

				await this.photosRepository.setTitlePhotos(albumId, photoIds);
				albumsSet++;
				photosSet += photoIds.length;
			}
		} finally {
			await connection.close();
		}

		this.logger.log(
			`Title-photo backfill finished: set ${photosSet} title photos across ${albumsSet} albums` +
				(skipped ? `, skipped ${skipped} with an existing selection` : "") +
				(unresolved ? `, ${unresolved} albums referenced photos no longer present` : "") +
				".",
		);
	}

	async init(t: EntityManager) {
		this.logger.debug("Preparing import...");

		await this.clearTable(t, Photo);
		await this.clearTable(t, Album);
		await this.clearTable(t, EventAttendee);
		await this.clearTable(t, EventExpense);
		// events_groups has no entity of its own (it is the @ManyToMany join table on Event), so it
		// is cleared by table name rather than through clearTable()
		await this.clearJoinTable(t, "events_groups");
		await this.clearTable(t, Event);
		await this.clearTable(t, MemberContact);
		await this.clearTable(t, Member);
		await this.clearTable(t, User);
		await this.clearTable(t, Group);
	}

	private async clearTable<T extends ObjectLiteral>(t: EntityManager, entity: EntityTarget<T>) {
		const deleteCount = await t.deleteAll(entity).then((res) => res.affected);
		this.logger.debug(` - Removed ${deleteCount} ${(<any>entity).name} entities in postgres.`);
	}

	private async clearJoinTable(t: EntityManager, tableName: string) {
		const deleteCount = await t
			.createQueryBuilder()
			.delete()
			.from(tableName)
			.execute()
			.then((res) => res.affected);
		this.logger.debug(` - Removed ${deleteCount} ${tableName} rows in postgres.`);
	}

	async importUsers(t: EntityManager, memberIds: Record<string, number>) {
		this.logger.debug("Importing users...");

		const userIds: Record<string, number> = {};

		const mongoUsers = await this.usersModel.find({}).lean();
		this.logger.debug(` - Found ${mongoUsers.length} users in mongo.`);

		let c = 0;

		for (let mongoUser of mongoUsers) {
			if (!mongoUser.login) continue;

			const userData: Omit<User, "id"> = {
				memberId: mongoUser.member ? memberIds[mongoUser.member.toString()] : null,
				login: mongoUser.login,
				password: mongoUser.password ?? null,
				email: mongoUser.email ?? null,
				roles: this.getUserRoles(mongoUser),
				loginCode: null,
				loginCodeExp: null,
			};

			const user = await t.save(User, userData);

			userIds[mongoUser._id.toString()] = user.id;

			c++;
		}

		this.logger.debug(` - Imported ${c} users.`);

		return userIds;
	}
	async importMembers(t: EntityManager) {
		this.logger.debug("Importing members...");

		const memberIds: Record<string, number> = {};

		const mongoMembers = await this.membersModel.find({}).lean();
		this.logger.debug(` - Found ${mongoMembers.length} members in mongo.`);

		let c = 0;

		const roleTransform: { [role: string]: MemberRoles } = {
			vedoucí: MemberRoles.vedouci,
			dítě: MemberRoles.dite,
			instruktor: MemberRoles.instruktor,
		};

		const membershipTransform: { [membership: string]: MembershipStates } = {
			člen: MembershipStates.clen,
			clen: MembershipStates.clen,
			nečlen: MembershipStates.neclen,
			neclen: MembershipStates.neclen,
			pozastaveno: MembershipStates.pozastaveno,
		};

		for (let mongoMember of mongoMembers) {
			const groupId = mongoMember.group
				? await this.getGroupId(t, mongoMember.group)
				: await this.getGroupId(t, "KP");

			const membership =
				mongoMember.membership && mongoMember.membership in membershipTransform
					? membershipTransform[mongoMember.membership]
					: MembershipStates.clen;

			const role =
				mongoMember.role && mongoMember.role in roleTransform
					? roleTransform[mongoMember.role]
					: MemberRoles.dite;

			const memberData: Omit<Member, "id"> = {
				function: mongoMember.function ?? null,
				groupId,
				active: mongoMember.inactive === false ? true : false,
				membership,
				role,
				rank: Object.values(MemberRanks).includes(<any>mongoMember.rank) ? <MemberRanks>mongoMember.rank : null,
				nickname: mongoMember.nickname ?? mongoMember.name?.first ?? "???",
				firstName: mongoMember.name?.first ?? null,
				lastName: mongoMember.name?.last ?? null,
				birthday: mongoMember.birthday ? DateTime.fromJSDate(mongoMember.birthday).toISODate() : null,
				addressStreet: mongoMember.address?.street ?? null,
				addressStreetNo: mongoMember.address?.streetNo ?? null,
				addressCity: mongoMember.address?.city ?? null,
				addressPostalCode: mongoMember.address?.postalCode ?? null,
				addressCountry: mongoMember.address?.country ?? null,
				mobile: mongoMember.contacts?.mobile ?? null,
				email: mongoMember.contacts?.email ?? null,
			};

			const member = await t.save(Member, memberData);

			memberIds[mongoMember._id.toString()] = member.id;

			if (mongoMember.contacts?.father) {
				const contactData: Omit<MemberContact, "id"> = {
					memberId: member.id,
					relationship: "Otec",
					mobile: mongoMember.contacts?.father,
				};

				await t.save(MemberContact, contactData);
			}

			if (mongoMember.contacts?.mother) {
				const contactData: Omit<MemberContact, "id"> = {
					memberId: member.id,
					relationship: "Matka",
					mobile: mongoMember.contacts?.mother,
				};

				await t.save(MemberContact, contactData);
			}

			c++;
		}

		this.logger.debug(` - Imported ${c} members.`);

		return memberIds;
	}

	async importEvents(t: EntityManager, memberIds: Record<string, number>) {
		this.logger.debug("Importing events...");

		const eventIds: Record<string, number> = {};

		const mongoEvents = await this.eventsModel.find({}).lean();
		this.logger.debug(` - Found ${mongoEvents.length} events in mongo.`);

		let c = 0;

		for (let mongoEvent of mongoEvents) {
			if (!mongoEvent.dateFrom || !mongoEvent.dateTill) continue;

			let status = <any>mongoEvent.status ?? EventStates.draft;
			if (status === "rejected") status = EventStates.pending;

			const groups = await Promise.all(
				mongoEvent.groups
					?.filter((g) => g !== "V")
					.map((g) => this.getGroupId(t, g).then((id) => ({ id }) as Group)) ?? [],
			);

			const eventData: Omit<Event, "id" | "setLeaders" | "groupsIds"> = {
				name: mongoEvent.name,
				status,
				statusNote: mongoEvent.statusNote ?? null,
				place: mongoEvent.place ?? null,
				placeGeometry: null,
				description: mongoEvent.description ?? null,
				price: null,
				itemList: null,
				dateFrom: DateTime.fromJSDate(mongoEvent.dateFrom).toISODate()!,
				dateTill: DateTime.fromJSDate(mongoEvent.dateTill).toISODate()!,
				timeFrom: mongoEvent.timeFrom ?? null,
				timeTill: mongoEvent.timeTill ?? null,
				meetingPlaceStart: mongoEvent.meeting?.start ?? null,
				meetingPlaceEnd: mongoEvent.meeting?.end ?? null,
				type: mongoEvent.subtype ?? null,
				waterKm: null,
				river: null,
				leadersEvent: mongoEvent.groups?.includes("V") || false,
				// The legacy registration PDF is not moved or copied; keep the original Mongo ObjectId
				// (srcId) so the backend can serve it straight from the legacy on-disk layout, and flag
				// the event when the old record referenced a registration file.
				hasRegistration: !!mongoEvent.registration,
				report: null,
				srcId: mongoEvent._id.toString(),
				groups,
			};

			const event = await t.save(Event, eventData);

			eventIds[mongoEvent._id.toString()] = event.id;

			const mongoTypeToPostgresType: { [mongoType: string]: EventExpenseTypes } = {
				Potraviny: EventExpenseTypes.food,
				Doprava: EventExpenseTypes.transport,
				Materiál: EventExpenseTypes.material,
			};

			if (mongoEvent.expenses) {
				let i = 0;
				for (let mongoExpense of mongoEvent.expenses) {
					i++;

					const expenseData: Omit<EventExpense, "id"> = {
						receiptNumber: mongoExpense.id ?? `X${i}`,
						eventId: event.id,
						description: mongoExpense.description ?? "",
						amount: mongoExpense.amount ?? 0,
						type:
							(mongoExpense.type && mongoTypeToPostgresType[mongoExpense.type]) ||
							EventExpenseTypes.other,
					};

					await t.insert(EventExpense, expenseData);
				}
			}

			if (mongoEvent.attendees) {
				for (let mongoAttendee of mongoEvent.attendees) {
					const memberId = mongoAttendee ? memberIds[mongoAttendee.toString()] : null;

					if (!memberId) continue;

					const attendeeData: EventAttendee = {
						eventId: event.id,
						memberId,
						type: EventAttendeeType.attendee,
					};

					await t.save(EventAttendee, attendeeData);
				}
			}

			if (mongoEvent.leaders) {
				for (let mongoLeader of mongoEvent.leaders) {
					const memberId = mongoLeader ? memberIds[mongoLeader.toString()] : null;

					if (!memberId) continue;

					const attendeeData: EventAttendee = {
						eventId: event.id,
						memberId,
						type: EventAttendeeType.leader,
					};

					await t.save(EventAttendee, attendeeData);
				}
			}

			c++;
		}

		this.logger.debug(` - Imported ${c} events.`);

		return eventIds;
	}

	async importAlbums(t: EntityManager, userIds: Record<string, number>, eventIds: Record<string, number>) {
		this.logger.debug("Importing albums...");

		const albumIds: Record<string, number> = {};

		const mongoAlbums = await this.albumsModel.find({}).lean();
		this.logger.debug(` - Found ${mongoAlbums.length} albums in mongo.`);

		let c = 0;
		for (let mongoAlbum of mongoAlbums) {
			const albumData: Omit<Album, "id"> = {
				dateFrom: mongoAlbum.dateFrom ? DateTime.fromJSDate(mongoAlbum.dateFrom).toISODate() : null,
				dateTill: mongoAlbum.dateTill ? DateTime.fromJSDate(mongoAlbum.dateTill).toISODate() : null,
				datePublished: mongoAlbum.datePublished ?? DateTime.local().toISO(),
				description: mongoAlbum.description ?? "",
				name: mongoAlbum.name,
				status: <any>mongoAlbum.status,
				eventId: mongoAlbum.event ? eventIds[mongoAlbum.event.toString()] : null,
				createdById: null,
			};

			const album = await t.save(Album, albumData);

			albumIds[mongoAlbum._id.toString()] = album.id;

			c++;
		}

		this.logger.debug(` - Imported ${c} albums.`);

		const mongoPhotos = await this.photosModel.find({}).lean();
		this.logger.debug(` - Found ${mongoPhotos.length} photos in mongo.`);

		c = 0;

		// mongo photo ObjectId -> imported postgres photo id, so the album title-photo selection
		// (which references photos by their Mongo id) can be resolved after all photos are imported
		const photoIds: Record<string, number> = {};

		for (let mongoPhoto of mongoPhotos) {
			const albumId = albumIds[mongoPhoto.album.toString()];

			// wrongly deleted albums (photos deleted, but records stay in DB)
			if (!albumId) continue;

			// The old server stored the original's raw pixel dimensions, which for EXIF-rotated
			// photos are transposed relative to how the image is displayed. The thumbnails it
			// serves are baked upright, so their orientation is the source of truth: transpose
			// the original dimensions when it disagrees, otherwise the gallery lays the photo out
			// with the wrong aspect ratio and it appears distorted.
			let width = mongoPhoto.sizes?.original.width ?? null;
			let height = mongoPhoto.sizes?.original.height ?? null;
			const thumb = mongoPhoto.sizes?.small ?? mongoPhoto.sizes?.big;
			if (width && height && thumb?.width && thumb?.height && width >= height !== thumb.width >= thumb.height) {
				[width, height] = [height, width];
			}

			const photoData: Omit<Photo, "id"> = {
				albumId,
				bg: mongoPhoto.bg ?? null,
				caption: mongoPhoto.caption ?? null,
				name: mongoPhoto.name ?? "",
				tags: mongoPhoto.tags ?? null,
				timestamp: mongoPhoto.date ?? new Date(),
				order: null, // imported photos fall back to timestamp ordering
				titlePhotoOrder: null, // title-photo selection is applied in a later pass (see importTitlePhotos)
				title: mongoPhoto.title ?? null,
				uploadedById: mongoPhoto.uploadedBy ? userIds[mongoPhoto.uploadedBy.toString()] : null,
				width,
				height,
				// Keep the original Mongo ObjectIds so the backend can serve the existing image
				// files straight from the legacy on-disk layout (they are not moved or copied).
				srcAlbumId: mongoPhoto.album.toString(),
				srcId: mongoPhoto._id.toString(),
			};

			const photo = await t.save(Photo, photoData);

			photoIds[mongoPhoto._id.toString()] = photo.id;

			c++;
		}

		this.logger.debug(` - Imported ${c} photos.`);

		await this.importTitlePhotos(t, mongoAlbums, albumIds, photoIds);
	}

	/**
	 * Reinstate the legacy album preview selection: the old records kept up to three chosen photos
	 * per album in `titlePhotos` (with an older single `titlePhoto` as fallback). Map those Mongo
	 * photo ids to their imported rows and write their 1-based position into `titlePhotoOrder`, so
	 * the public website shows the same preview thumbnails again.
	 */
	private async importTitlePhotos(
		t: EntityManager,
		mongoAlbums: MongoAlbum[],
		albumIds: Record<string, number>,
		photoIds: Record<string, number>,
	) {
		this.logger.debug("Importing album title photos...");

		let c = 0;

		for (const mongoAlbum of mongoAlbums) {
			const albumId = albumIds[mongoAlbum._id.toString()];
			if (!albumId) continue;

			// prefer the newer ordered array, fall back to the single legacy field
			const mongoTitleIds = mongoAlbum.titlePhotos?.length
				? mongoAlbum.titlePhotos
				: mongoAlbum.titlePhoto
					? [mongoAlbum.titlePhoto]
					: [];

			// resolve to imported photo ids, drop unknown/missing ones, dedupe, cap at three
			const titlePhotoIds: number[] = [];
			for (const mongoTitleId of mongoTitleIds) {
				const photoId = photoIds[mongoTitleId.toString()];
				if (photoId && !titlePhotoIds.includes(photoId)) titlePhotoIds.push(photoId);
				if (titlePhotoIds.length === 3) break;
			}

			for (const [index, photoId] of titlePhotoIds.entries()) {
				// the album guard ignores a stray selection that points at another album's photo
				await t.update(Photo, { id: photoId, albumId }, { titlePhotoOrder: index + 1 });
				c++;
			}
		}

		this.logger.debug(` - Imported ${c} album title photos.`);
	}

	private async getGroupId(t: EntityManager, oldGroupId: string) {
		if (this.groupsIndex.has(oldGroupId)) return this.groupsIndex.get(oldGroupId)!;

		const oldGroupData =
			oldGroupId in MongoMemberGroups ? MongoMemberGroups[<keyof typeof MongoMemberGroups>oldGroupId] : null;

		const groupData: Partial<Group> = {
			shortName: oldGroupId,
			active: oldGroupData?.active ?? true,
			name: oldGroupData?.name ?? oldGroupId,
			color: oldGroupData?.color,
			darkColor: oldGroupData?.color,
		};

		const group = await t.save(Group, groupData);
		this.groupsIndex.set(oldGroupId, group.id);

		return group.id;
	}

	private getUserRoles(mongoUser: MongoUser): UserRoles[] {
		const roles: UserRoles[] = [];
		if (mongoUser.roles?.includes("admin")) roles.push(UserRoles.admin);
		if (mongoUser.roles?.includes("spravce")) roles.push(UserRoles.admin);
		if (mongoUser.roles?.includes("program")) roles.push(UserRoles.program);
		if (mongoUser.roles?.includes("revizor")) roles.push(UserRoles.revizor);

		return roles;
	}
}
