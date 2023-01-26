import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { DateTime } from "luxon";
import { Model } from "mongoose";
import { Album } from "src/models/albums/entities/album.entity";
import { Photo } from "src/models/albums/entities/photo.entity";
import { Event, EventStatus } from "src/models/events/entities/event.entity";
import { Group } from "src/models/members/entities/group.entity";
import { Member, MemberRank, MemberRole, MembershipStatus } from "src/models/members/entities/member.entity";
import { EntityManager } from "typeorm";
import { MongoAlbum } from "../models/album";
import { MongoEvent } from "../models/event";
import { MongoMember } from "../models/member";
import { MongoPhoto } from "../models/photo";

@Injectable()
export class MongoImportService {
  logger = new Logger(MongoImportService.name);

  constructor(
    @InjectModel(MongoAlbum.name) private albumsModel: Model<MongoAlbum>,
    @InjectModel(MongoPhoto.name) private photosModel: Model<MongoPhoto>,
    @InjectModel(MongoEvent.name) private eventsModel: Model<MongoEvent>,
    @InjectModel(MongoMember.name) private membersModel: Model<MongoMember>,
    private entityManager: EntityManager,
  ) {}

  async importData() {
    console.log("Mongo import started.");

    await this.entityManager.transaction(async (t) => {
      const memberIds = await this.importMembers(t);

      const eventIds = await this.importEvents(t, memberIds);

      await this.importAlbums(t, memberIds, eventIds);
    });
  }

  async importMembers(t: EntityManager) {
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
      };

      const event = await t.save(Event, eventData);

      eventIds[mongoEvent._id.toString()] = event.id;

      c++;
    }

    console.debug(` - Imported ${c} events.`);

    return eventIds;
  }

  async importAlbums(t: EntityManager, memberIds: Record<string, number>, eventIds: Record<string, number>) {
    console.debug("Importing albums...");

    const albumIds: Record<string, number> = {};

    const photosDeleteCount = await t.delete(Photo, {}).then((res) => res.affected);
    console.debug(` - Removed ${photosDeleteCount} photos in postgres.`);

    const deleteCount = await t.delete(Album, {}).then((res) => res.affected);
    console.debug(` - Removed ${deleteCount} albums in postgres.`);

    const mongoAlbums = await this.albumsModel.find({}).populate("event").lean();
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
        eventId: mongoAlbum.event ? eventIds[mongoAlbum.event._id.toString()] : null,
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
        uploadedById: mongoPhoto.uploadedBy ? memberIds[mongoPhoto.uploadedBy.toString()] : null,
        width: mongoPhoto.sizes?.original.width ?? null,
        height: mongoPhoto.sizes?.original.height ?? null,
      };

      await t.save(Photo, photoData);

      c++;
    }

    console.debug(` - Imported ${c} photos.`);
  }
}
