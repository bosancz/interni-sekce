import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { DateTime } from "luxon";
import { Model } from "mongoose";
import { Album } from "src/models/albums/entities/album.entity";
import { Photo } from "src/models/albums/entities/photo.entity";
import { EventAttendee, EventAttendeeType } from "src/models/events/entities/event-attendee.entity";
import { EventExpense } from "src/models/events/entities/event-expense.entity";
import { EventGroup } from "src/models/events/entities/event-group.entity";
import { Event, EventStatus } from "src/models/events/entities/event.entity";
import { Group } from "src/models/members/entities/group.entity";
import { MemberContact, MemberContactType } from "src/models/members/entities/member-contacts.entity";
import { Member, MemberRank, MemberRole, MembershipStatus } from "src/models/members/entities/member.entity";
import { User, UserRoles } from "src/models/users/entities/user.entity";
import { EntityManager } from "typeorm";
import { MongoAlbum } from "../models/album";
import { MongoEvent } from "../models/event";
import { MongoMember } from "../models/member";
import { MongoPhoto } from "../models/photo";
import { MongoUser } from "../models/user";

@Injectable()
export class MongoImportService {
  logger = new Logger(MongoImportService.name);

  constructor(
    @InjectModel(MongoAlbum.name) private albumsModel: Model<MongoAlbum>,
    @InjectModel(MongoPhoto.name) private photosModel: Model<MongoPhoto>,
    @InjectModel(MongoEvent.name) private eventsModel: Model<MongoEvent>,
    @InjectModel(MongoMember.name) private membersModel: Model<MongoMember>,
    @InjectModel(MongoUser.name) private usersModel: Model<MongoUser>,
    private entityManager: EntityManager,
  ) {}

  async importData() {
    console.log("Mongo import started.");

    await this.entityManager.transaction(async (t) => {
      const memberIds = await this.importMembers(t);

      const userIds = await this.importUsers(t, memberIds);

      const eventIds = await this.importEvents(t, memberIds);

      await this.importAlbums(t, userIds, eventIds);
    });
  }

  async importUsers(t: EntityManager, memberIds: Record<string, number>) {
    console.debug("Importing users...");

    const userIds: Record<string, number> = {};

    const deleteCount = await t.delete(User, {}).then((res) => res.affected);
    console.debug(` - Removed ${deleteCount} users in postgres.`);

    const mongoUsers = await this.usersModel.find({}).lean();
    console.debug(` - Found ${mongoUsers.length} users in mongo.`);

    let c = 0;
    const groups: string[] = [];

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

    console.debug(` - Imported ${c} users.`);

    return userIds;
  }
  async importMembers(t: EntityManager) {
    console.debug("Importing members...");

    const memberIds: Record<string, number> = {};

    const deleteCount = await t.delete(Member, {}).then((res) => res.affected);
    console.debug(` - Removed ${deleteCount} members in postgres.`);

    const mongoMembers = await this.membersModel.find({}).lean();
    console.debug(` - Found ${mongoMembers.length} members in mongo.`);

    let c = 0;
    const groups: string[] = [];

    for (let mongoMember of mongoMembers) {
      if (!groups.includes(mongoMember.group)) {
        await t.save(Group, { id: mongoMember.group, active: true, name: mongoMember.group });
      }

      const memberData: Omit<Member, "id"> = {
        function: mongoMember.function ?? null,
        groupId: mongoMember.group ?? null,
        active: mongoMember.inactive === false ? true : false,
        membership: Object.values(MembershipStatus).includes(<any>mongoMember.membership)
          ? <MembershipStatus>mongoMember.membership
          : MembershipStatus.clen,
        role: Object.values(MemberRole).includes(<any>mongoMember.role) ? <MemberRole>mongoMember.role : null,
        rank: Object.values(MemberRank).includes(<any>mongoMember.rank) ? <MemberRank>mongoMember.rank : null,
        nickname: mongoMember.nickname ?? null,
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
          type: MemberContactType.mobile,
          contact: mongoMember.contacts?.father,
        };

        await t.save(MemberContact, contactData);
      }

      if (mongoMember.contacts?.mother) {
        const contactData: Omit<MemberContact, "id"> = {
          memberId: member.id,
          title: "Matka",
          type: MemberContactType.mobile,
          contact: mongoMember.contacts?.mother,
        };

        await t.save(MemberContact, contactData);
      }

      c++;
    }

    console.debug(` - Imported ${c} members.`);

    return memberIds;
  }

  async importEvents(t: EntityManager, memberIds: Record<string, number>) {
    console.debug("Importing events...");

    const eventIds: Record<string, number> = {};

    const deleteCount = await t.delete(Event, {}).then((res) => res.affected);
    console.debug(` - Removed ${deleteCount} events in postgres.`);

    const mongoEvents = await this.eventsModel.find({}).lean();
    console.debug(` - Found ${mongoEvents.length} events in mongo.`);

    let c = 0;
    for (let mongoEvent of mongoEvents) {
      if (!mongoEvent.dateFrom || !mongoEvent.dateTill) continue;

      const eventData: Omit<Event, "id"> = {
        name: mongoEvent.name,
        status: <any>mongoEvent.status ?? EventStatus.draft,
        statusNote: mongoEvent.statusNote ?? null,
        place: mongoEvent.place ?? null,
        description: mongoEvent.description ?? null,
        dateFrom: DateTime.fromJSDate(mongoEvent.dateFrom).toISODate(),
        dateTill: DateTime.fromJSDate(mongoEvent.dateTill).toISODate(),
        timeFrom: mongoEvent.timeFrom ?? null,
        timeTill: mongoEvent.timeTill ?? null,
        meetingPlaceStart: mongoEvent.meeting?.start ?? null,
        meetingPlaceEnd: mongoEvent.meeting?.end ?? null,
        type: mongoEvent.subtype ?? null,
        water_km: null,
        river: null,
        leadersEvent: mongoEvent.groups?.includes("V") || false,
      };

      const event = await t.save(Event, eventData);

      eventIds[mongoEvent._id.toString()] = event.id;

      if (mongoEvent.expenses) {
        for (let mongoExpense of mongoEvent.expenses) {
          const expenseData: Omit<EventExpense, "id"> = {
            eventId: event.id,
            description: mongoExpense.description ?? "",
            amount: mongoExpense.amount ?? 0,
            type: mongoExpense.type ?? "Ostatní",
          };

          await t.save(EventExpense, expenseData);
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

      if (mongoEvent.groups) {
        for (let mongoEventGroup of mongoEvent.groups) {
          if (mongoEventGroup === "V") continue;

          const eventGroupData: EventGroup = {
            eventId: event.id,
            groupId: mongoEventGroup,
          };

          await t.save(EventGroup, eventGroupData);
        }
      }

      c++;
    }

    console.debug(` - Imported ${c} events.`);

    return eventIds;
  }

  async importAlbums(t: EntityManager, userIds: Record<string, number>, eventIds: Record<string, number>) {
    console.debug("Importing albums...");

    const albumIds: Record<string, number> = {};

    const photosDeleteCount = await t.delete(Photo, {}).then((res) => res.affected);
    console.debug(` - Removed ${photosDeleteCount} photos in postgres.`);

    const deleteCount = await t.delete(Album, {}).then((res) => res.affected);
    console.debug(` - Removed ${deleteCount} albums in postgres.`);

    const mongoAlbums = await this.albumsModel.find({}).lean();
    console.debug(` - Found ${mongoAlbums.length} albums in mongo.`);

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

    console.debug(` - Imported ${c} albums.`);

    const mongoPhotos = await this.photosModel.find({}).lean();
    console.debug(` - Found ${mongoPhotos.length} photos in mongo.`);

    c = 0;

    for (let mongoPhoto of mongoPhotos) {
      const albumId = albumIds[mongoPhoto.album.toString()];

      // wrongly deleted albums (photos deleted, but records stay in DB)
      if (!albumId) continue;

      const photoData: Omit<Photo, "id"> = {
        albumId,
        bg: mongoPhoto.bg ?? null,
        caption: mongoPhoto.caption ?? null,
        name: mongoPhoto.name ?? null,
        tags: mongoPhoto.tags ?? null,
        timestamp: mongoPhoto.date ?? null,
        title: mongoPhoto.title ?? null,
        uploadedById: mongoPhoto.uploadedBy ? userIds[mongoPhoto.uploadedBy.toString()] : null,
        width: mongoPhoto.sizes?.original.width ?? null,
        height: mongoPhoto.sizes?.original.height ?? null,
      };

      await t.save(Photo, photoData);

      c++;
    }

    console.debug(` - Imported ${c} photos.`);
  }

  private getUserRoles(mongoUser: MongoUser): UserRoles[] {
    const roles: UserRoles[] = [];
    if (mongoUser.roles?.includes("admin")) roles.push(UserRoles.admin);
    if (mongoUser.roles?.includes("spravce")) roles.push(UserRoles.program);
    if (mongoUser.roles?.includes("revizor")) roles.push(UserRoles.revizor);
    return roles;
  }
}
