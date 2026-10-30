import { Injectable, NotFoundException } from "@nestjs/common";
import { join } from "path";
import { Config } from "src/config";
import { PhotoSizes } from "src/api/albums/dto/photo.dto";
import { Album, AlbumStatus } from "src/models/albums/entities/album.entity";
import { Photo } from "src/models/albums/entities/photo.entity";
import { AlbumsRepository } from "src/models/albums/repositories/albums.repository";
import { PhotosRepository } from "src/models/albums/repositories/photos.repository";
import { PhotosFilesService } from "src/models/albums/services/photos-files.service";
import { Event, EventStates } from "src/models/events/entities/event.entity";
import { getEventChroniclePath } from "src/models/events/helpers/event-chronicle";
import { EventsRepository } from "src/models/events/repositories/events.repository";
import { FilesService } from "src/models/files/services/files.service";
import { BoardMembersRepository } from "src/models/members/repositories/board-members.repository";
import { GroupsRepository } from "src/models/members/repositories/groups.repository";
import { DataSource } from "typeorm";

@Injectable()
export class PublicV2Service {
	constructor(
		private readonly config: Config,
		private readonly dataSource: DataSource,
		private readonly events: EventsRepository,
		private readonly albums: AlbumsRepository,
		private readonly photos: PhotosRepository,
		private readonly photosFiles: PhotosFilesService,
		private readonly files: FilesService,
		private readonly groups: GroupsRepository,
		private readonly boardMembers: BoardMembersRepository,
	) {}

	private get baseUrl() {
		return `${this.config.app.baseUrl}/api/public/v2`;
	}

	async getProgram(options: { limit?: number; dateFrom?: string; dateTill?: string }) {
		const [events, groups] = await Promise.all([this.events.getPublicProgram(options), this.groups.getGroups()]);
		const groupNames = new Map(groups.map((group) => [group.id, group.shortName]));

		return events.map((event) => ({
			id: event.id,
			status: event.status,
			name: event.name,
			type: event.type,
			description: event.description,
			dateFrom: event.dateFrom,
			dateTill: event.dateTill,
			timeFrom: event.timeFrom,
			timeTill: event.timeTill,
			meetingStart: event.meetingPlaceStart,
			meetingEnd: event.meetingPlaceEnd,
			publishedAt: event.publishedAt,
			cancelledAt: event.cancelledAt,
			groups: this.groupNames(event, groupNames),
			leadersEvent: event.leadersEvent,
			leaders: (event.leaders ?? []).map((member) => ({
				id: member.id,
				nickname: member.nickname,
				mobile: member.mobile ?? null,
			})),
			registrationUrl: event.hasRegistration ? `${this.baseUrl}/program/${event.id}/registration` : null,
		}));
	}

	async getRegistrationFile(eventId: number): Promise<{ path: string; filename: string }> {
		const event = await this.events.getEvent(eventId);
		const visible = event?.status === EventStates.public || event?.status === EventStates.cancelled;
		if (!event || !visible || !event.hasRegistration) throw new NotFoundException();

		const folder = join(this.config.fs.eventsDir, event.srcId ?? String(event.id));

		let matches: string[];
		try {
			matches = await this.files.getFilesByPrefx(folder, "prihlaska");
			if (matches.length === 0) matches = await this.files.getFilesByPrefx(folder, "registration");
		} catch {
			throw new NotFoundException("Registration not found");
		}
		if (matches.length !== 1) throw new NotFoundException("Registration not found");

		return { path: join(folder, matches[0]), filename: matches[0] };
	}

	async getJournal(options: { sort?: "dateFrom" | "publishedAt"; limit?: number; offset?: number }) {
		const sort = options.sort === "publishedAt" ? `"publishedAt"` : `"dateFrom"`;

		return this.dataSource.query(
			`SELECT r.id AS "reportId",
				a.id AS "albumId",
				COALESCE(r.name, a.name) AS "name",
				COALESCE(r.date_from, a.date_from)::text AS "dateFrom",
				COALESCE(r.date_till, a.date_till)::text AS "dateTill",
				COALESCE(r.report_published_at, a.date_published) AS "publishedAt",
				COALESCE(btrim(r.public_report), '') <> '' AS "summary",
				r.chronicle_file_name IS NOT NULL AS "chronicle",
				CASE WHEN p.id IS NULL THEN NULL ELSE json_build_object(
					'id', p.id,
					'width', p.width,
					'height', p.height,
					'bg', p.bg,
					'urls', json_build_object(
						'small', $3::text || '/photos/' || p.id || '/small',
						'big', $3::text || '/photos/' || p.id || '/big',
						'original', $3::text || '/photos/' || p.id || '/original'
					)
				) END AS "photo"
			FROM (
				SELECT * FROM events
				WHERE status = 'public' AND report_published_at IS NOT NULL AND deleted_at IS NULL
			) r
			FULL OUTER JOIN (
				SELECT * FROM albums WHERE status = 'public' AND deleted_at IS NULL
			) a ON a.event_id = r.id
			LEFT JOIN LATERAL (
				SELECT id, bg, width, height FROM photos
				WHERE album_id = a.id
				ORDER BY title_photo DESC, "order" ASC NULLS LAST, "timestamp" ASC
				LIMIT 1
			) p ON true
			ORDER BY ${sort} DESC NULLS LAST, r.id DESC NULLS LAST, a.id DESC
			LIMIT $1 OFFSET $2`,
			[options.limit ?? null, options.offset ?? 0, this.baseUrl],
		);
	}

	async getReport(eventId: number) {
		const [event, groups] = await Promise.all([this.events.getPublicReport(eventId), this.groups.getGroups()]);
		if (!event) throw new NotFoundException();

		return {
			id: event.id,
			name: event.name,
			type: event.type,
			dateFrom: event.dateFrom,
			dateTill: event.dateTill,
			groups: this.groupNames(event, new Map(groups.map((group) => [group.id, group.shortName]))),
			leadersEvent: event.leadersEvent,
			leaders: (event.leaders ?? []).map((member) => ({ id: member.id, nickname: member.nickname })),
			summary: event.publicReport,
			publishedAt: event.reportPublishedAt,
			river: event.river,
			waterKm: event.waterKm,
			chronicle: event.chronicleFileName
				? {
						fileName: event.chronicleFileName,
						size: event.chronicleSize,
						updatedAt: event.chronicleUpdatedAt,
						url: `${this.baseUrl}/reports/${event.id}/chronicle`,
					}
				: null,
			albumId: event.album?.id ?? null,
		};
	}

	async getReportChronicleFile(eventId: number): Promise<{ path: string; filename: string }> {
		const event = await this.events.getPublicReport(eventId);
		if (!event?.chronicleFileName) throw new NotFoundException();

		return { path: getEventChroniclePath(this.config.fs.eventsDir, event), filename: event.chronicleFileName };
	}

	async getRecentAlbums(limit?: number) {
		const { defaultLimit, maxLimit } = this.config.publicApi.recentAlbums;
		const albums = await this.albums.getAlbums({
			status: [AlbumStatus.public],
			limit: Math.min(limit ?? defaultLimit, maxLimit),
			sort: "datePublished",
			order: "DESC",
		});
		const coverPhotos = await this.photos.getCoverPhotosByAlbums(albums.map((album) => album.id));

		return albums.map((album) => this.serializeAlbum(album, coverPhotos.get(album.id)));
	}

	async getAlbum(albumId: number) {
		const album = await this.getPublicAlbum(albumId);
		const coverPhotos = await this.photos.getCoverPhotosByAlbums([album.id]);

		return {
			...this.serializeAlbum(album, coverPhotos.get(album.id)),
			description: album.description ?? null,
			downloadUrl: `${this.baseUrl}/albums/${album.id}/download`,
		};
	}

	async getAlbumPhotos(albumId: number) {
		const album = await this.getPublicAlbum(albumId);
		const photos = await this.photos.getPhotos({ album: album.id });

		return photos.map((photo) => ({
			...this.serializePhoto(photo),
			caption: photo.caption ?? null,
			takenAt: photo.timestamp,
		}));
	}

	async getAlbumDownload(albumId: number): Promise<{ album: Album; photos: Photo[] }> {
		const album = await this.getPublicAlbum(albumId);
		const photos = await this.photos.getPhotos({ album: album.id });
		if (!photos.length) throw new NotFoundException("Album has no downloadable photos.");

		return { album, photos };
	}

	async getPhotoImagePath(photoId: number, size: PhotoSizes): Promise<{ path: string; name: string }> {
		if (!Object.values(PhotoSizes).includes(size)) throw new NotFoundException("Unknown image size.");

		const photo = await this.photos.getPhoto(photoId);
		if (!photo) throw new NotFoundException();
		await this.getPublicAlbum(photo.albumId);

		return { path: this.photosFiles.getPhotoImagePath(photo, size), name: photo.name };
	}

	async getGroups() {
		const groups = await this.groups.getPublicGroups();

		return groups.map((group) => ({
			id: group.id,
			shortName: group.shortName,
			name: group.name,
			color: group.color,
			darkColor: group.darkColor,
			children: group.children,
			meetingDay: group.meetingDay,
			leader: group.leader
				? {
						id: group.leader.id,
						nickname: group.leader.nickname,
						firstName: group.leader.firstName ?? null,
						lastName: group.leader.lastName ?? null,
						email: group.leader.email ?? null,
						mobile: group.leader.mobile ?? null,
						profilePhotoUrl: group.leader.profilePhotoUpdatedAt
							? `${this.baseUrl}/groups/${group.id}/leader/profile-photo?v=${group.leader.profilePhotoUpdatedAt.getTime()}`
							: null,
					}
				: null,
		}));
	}

	async getGroupLeaderProfilePhotoPath(groupId: number): Promise<string> {
		const groups = await this.groups.getPublicGroups();
		const leader = groups.find((group) => group.id === groupId)?.leader;
		if (!leader?.profilePhotoUpdatedAt) throw new NotFoundException();

		return join(this.config.fs.membersDir, String(leader.id), "profile_photo.jpg");
	}

	async getBoardMembers() {
		const boardMembers = await this.boardMembers.getBoardMembers({ contacts: true });

		return boardMembers.map(({ function: role, member }) => ({
			memberId: member!.id,
			function: role,
			nickname: member!.nickname,
			firstName: member!.firstName ?? null,
			lastName: member!.lastName ?? null,
			email: member!.email ?? null,
			mobile: member!.mobile ?? null,
			profilePhotoUrl: member!.profilePhotoUpdatedAt
				? `${this.baseUrl}/board-members/${member!.id}/profile-photo?v=${member!.profilePhotoUpdatedAt.getTime()}`
				: null,
		}));
	}

	async getBoardMemberProfilePhotoPath(memberId: number): Promise<string> {
		const boardMembers = await this.boardMembers.getBoardMembers();
		const member = boardMembers.find((boardMember) => boardMember.memberId === memberId)?.member;
		if (!member?.profilePhotoUpdatedAt) throw new NotFoundException();

		return join(this.config.fs.membersDir, String(member.id), "profile_photo.jpg");
	}

	private async getPublicAlbum(albumId: number) {
		const album = await this.albums.getAlbum(albumId);
		if (!album || album.status !== AlbumStatus.public) throw new NotFoundException();
		return album;
	}

	private groupNames(event: Event, groupNames: Map<number, string>) {
		return (event.groupsIds ?? []).map((id) => groupNames.get(id)).filter((name): name is string => !!name);
	}

	private serializeAlbum(album: Album, coverPhoto: Photo | undefined) {
		return {
			id: album.id,
			name: album.name,
			dateFrom: album.dateFrom,
			dateTill: album.dateTill,
			publishedAt: album.datePublished,
			coverPhoto: coverPhoto ? this.serializePhoto(coverPhoto) : null,
		};
	}

	private serializePhoto(photo: Photo) {
		const url = `${this.baseUrl}/photos/${photo.id}`;

		return {
			id: photo.id,
			width: photo.width,
			height: photo.height,
			bg: photo.bg ?? null,
			urls: {
				small: `${url}/${PhotoSizes.small}`,
				big: `${url}/${PhotoSizes.big}`,
				original: `${url}/${PhotoSizes.original}`,
			},
		};
	}
}
