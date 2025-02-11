import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { DateTime } from "luxon";
import { Model } from "mongoose";
import { Config } from "src/config";
import { Album } from "src/models/albums/entities/album.entity";
import { Photo } from "src/models/albums/entities/photo.entity";
import { EventAttendee, EventAttendeeType } from "src/models/events/entities/event-attendee.entity";
import { EventExpense, EventExpenseTypes } from "src/models/events/entities/event-expense.entity";
import { EventGroup } from "src/models/events/entities/event-group.entity";
import { Event, EventStates } from "src/models/events/entities/event.entity";
import { Group } from "src/models/members/entities/group.entity";
import { MemberContact } from "src/models/members/entities/member-contact.entity";
import { Member, MemberRanks, MemberRoles, MembershipStates } from "src/models/members/entities/member.entity";
import { User, UserRoles } from "src/models/users/entities/user.entity";
import { EntityManager, EntityTarget, ObjectLiteral } from "typeorm";
import { MongoMemberGroups } from "../data/member-groups";
import { MongoAlbum } from "../models/album";
import { MongoEvent } from "../models/event";
import { MongoMember } from "../models/member";
import { MongoPhoto } from "../models/photo";
import { MongoUser } from "../models/user";

@Injectable()
export class MongoImportService {
  private readonly logger = new Logger(MongoImportService.name);

  private readonly groupsIndex = new Map<string, number>();

  constructor(
    @InjectModel(MongoAlbum.name) private albumsModel: Model<MongoAlbum>,
    @InjectModel(MongoPhoto.name) private photosModel: Model<MongoPhoto>,
    @InjectModel(MongoEvent.name) private eventsModel: Model<MongoEvent>,
    @InjectModel(MongoMember.name) private membersModel: Model<MongoMember>,
    @InjectModel(MongoUser.name) private usersModel: Model<MongoUser>,
    private entityManager: EntityManager,
    private config: Config,
  ) {}

  async importData() {
    this.logger.log(`Starting mongo import from ${this.config.mongoDb.uri}...`);

    await this.entityManager.transaction(async (t) => {
      await this.init(t);

      const memberIds = await this.importMembers(t);

      const userIds = await this.importUsers(t, memberIds);

      const eventIds = await this.importEvents(t, memberIds);

      await this.importAlbums(t, userIds, eventIds);
    });

    this.logger.log(`Mongo import finished.`);
  }

  async init(t: EntityManager) {
    this.logger.debug("Preparing import...");

    await this.clearTable(t, Photo);
    await this.clearTable(t, Album);
    await this.clearTable(t, EventAttendee);
    await this.clearTable(t, EventExpense);
    await this.clearTable(t, EventGroup);
    await this.clearTable(t, Event);
    await this.clearTable(t, MemberContact);
    await this.clearTable(t, Member);
    await this.clearTable(t, User);
    await this.clearTable(t, Group);
  }

  private async clearTable<T extends ObjectLiteral>(t: EntityManager, entity: EntityTarget<T>) {
    const deleteCount = await t.delete(entity, {}).then((res) => res.affected);
    this.logger.debug(` - Removed ${deleteCount} ${(<any>entity).name} entities in postgres.`);
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
      const groupId = mongoMember.group ? await this.getGroupId(t, mongoMember.group) : await this.getGroupId(t, "KP");

      const membership =
        mongoMember.membership && mongoMember.membership in membershipTransform
          ? membershipTransform[mongoMember.membership]
          : MembershipStates.clen;

      const role =
        mongoMember.role && mongoMember.role in roleTransform ? roleTransform[mongoMember.role] : MemberRoles.dite;

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
          title: "Otec",
          mobile: mongoMember.contacts?.father,
        };

        await t.save(MemberContact, contactData);
      }

      if (mongoMember.contacts?.mother) {
        const contactData: Omit<MemberContact, "id"> = {
          memberId: member.id,
          title: "Matka",
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
        mongoEvent.groups?.filter((g) => g !== "V").map((g) => this.getGroupId(t, g).then((id) => ({ id }) as Group)) ??
          [],
      );

      const eventData: Omit<Event, "id" | "setLeaders" | "groupsIds"> = {
        name: mongoEvent.name,
        status,
        statusNote: mongoEvent.statusNote ?? null,
        place: mongoEvent.place ?? null,
        description: mongoEvent.description ?? null,
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
            type: (mongoExpense.type && mongoTypeToPostgresType[mongoExpense.type]) || EventExpenseTypes.other,
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
      };

      const album = await t.save(Album, albumData);

      albumIds[mongoAlbum._id.toString()] = album.id;

      c++;
    }

    this.logger.debug(` - Imported ${c} albums.`);

    const mongoPhotos = await this.photosModel.find({}).lean();
    this.logger.debug(` - Found ${mongoPhotos.length} photos in mongo.`);

    c = 0;

    for (let mongoPhoto of mongoPhotos) {
      const albumId = albumIds[mongoPhoto.album.toString()];

      // wrongly deleted albums (photos deleted, but records stay in DB)
      if (!albumId) continue;

      const photoData: Omit<Photo, "id"> = {
        albumId,
        bg: mongoPhoto.bg ?? null,
        caption: mongoPhoto.caption ?? null,
        name: mongoPhoto.name ?? "",
        tags: mongoPhoto.tags ?? null,
        timestamp: mongoPhoto.date ?? new Date(),
        title: mongoPhoto.title ?? null,
        uploadedById: mongoPhoto.uploadedBy ? userIds[mongoPhoto.uploadedBy.toString()] : null,
        width: mongoPhoto.sizes?.original.width ?? null,
        height: mongoPhoto.sizes?.original.height ?? null,
      };

      await t.save(Photo, photoData);

      c++;
    }

    this.logger.debug(` - Imported ${c} photos.`);
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
