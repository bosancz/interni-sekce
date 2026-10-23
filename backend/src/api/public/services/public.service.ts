import { Injectable, NotFoundException } from "@nestjs/common";
import { join } from "path";
import { Config } from "src/config";
import { Album, AlbumStatus } from "src/models/albums/entities/album.entity";
import { Photo } from "src/models/albums/entities/photo.entity";
import { AlbumsRepository } from "src/models/albums/repositories/albums.repository";
import { PhotosRepository } from "src/models/albums/repositories/photos.repository";
import { Event, EventStates } from "src/models/events/entities/event.entity";
import { EventsRepository } from "src/models/events/repositories/events.repository";
import { FilesService } from "src/models/files/services/files.service";
import { BoardMember } from "src/models/members/entities/board-member.entity";
import { Group } from "src/models/members/entities/group.entity";
import { BoardMembersRepository } from "src/models/members/repositories/board-members.repository";
import { GroupsRepository } from "src/models/members/repositories/groups.repository";

const PREVIEW_PHOTOS_COUNT = 8;

@Injectable()
export class PublicService {
	constructor(
		private readonly config: Config,
		private readonly events: EventsRepository,
		private readonly albums: AlbumsRepository,
		private readonly photos: PhotosRepository,
		private readonly files: FilesService,
		private readonly groups: GroupsRepository,
		private readonly boardMembers: BoardMembersRepository,
	) {}

	private get apiBase() {
		return `${this.config.app.baseUrl}/api`;
	}

	async getRegistrationFile(eventId: number): Promise<{ path: string; filename: string }> {
		const event = await this.events.getEvent(eventId);
		if (!event || !this.isPubliclyVisible(event) || !event.hasRegistration) throw new NotFoundException();

		const folder = join(this.config.fs.eventsDir, event.srcId ?? String(event.id));

		let matches: string[];
		try {
			matches = await this.files.getFilesByPrefx(folder, "prihlaska");
			if (matches.length === 0) {
				matches = await this.files.getFilesByPrefx(folder, "registration");
			}
		} catch {
			throw new NotFoundException("Registration not found");
		}
		if (matches.length !== 1) throw new NotFoundException("Registration not found");

		return { path: join(folder, matches[0]), filename: matches[0] };
	}

	async getAlbumDownload(albumId: number): Promise<{ album: Album; photos: Photo[] }> {
		const album = await this.albums.getAlbum(albumId);
		if (!album || album.status !== AlbumStatus.public) throw new NotFoundException();

		const photos = await this.photos.getPhotos({ album: album.id });
		if (!photos.length) throw new NotFoundException("Album has no downloadable photos.");

		return { album, photos };
	}

	private isPubliclyVisible(event: Event): boolean {
		return event.status === EventStates.public || event.status === EventStates.cancelled;
	}

	async getProgram(options: { limit?: number; dateFrom?: string; dateTill?: string }) {
		const [events, groups] = await Promise.all([this.events.getPublicProgram(options), this.groups.getGroups()]);

		const groupNameById = new Map(groups.map((g) => [g.id, g.shortName]));

		return events.map((event) => this.serializeEvent(event, groupNameById));
	}

	private serializeEvent(event: Event, groupNameById: Map<number, string>) {
		const groups = (event.groupsIds ?? [])
			.map((id) => groupNameById.get(id))
			.filter((name): name is string => !!name);

		return {
			_id: String(event.id),
			status: event.status,
			publishedAt: event.publishedAt,
			cancelledAt: event.cancelledAt,
			name: event.name,
			type: event.type,
			description: event.description,
			dateFrom: event.dateFrom,
			dateTill: event.dateTill,
			timeFrom: event.timeFrom,
			timeTill: event.timeTill,
			groups,
			leadersEvent: event.leadersEvent,
			meeting: {
				start: event.meetingPlaceStart,
				end: event.meetingPlaceEnd,
			},
			leaders: (event.leaders ?? []).map((member) => ({
				_id: String(member.id),
				nickname: member.nickname,
				contacts: { mobile: member.mobile ?? null },
			})),
			_links: {
				registration: {
					href: `${this.apiBase}/public/program/${event.id}/registration`,
					method: "GET",
					allowed: { GET: !!event.hasRegistration },
				},
			},
		};
	}

	async getReports(options: { limit?: number; offset?: number }) {
		const [events, groups] = await Promise.all([this.events.getPublicReports(options), this.groups.getGroups()]);

		const groupNameById = new Map(groups.map((g) => [g.id, g.shortName]));
		const coverPhotos = await this.photos.getCoverPhotosByAlbums(
			events.flatMap((event) => (event.album ? [event.album.id] : [])),
		);

		return events.map((event) => this.serializeReport(event, groupNameById, coverPhotos));
	}

	async getReport(id: number) {
		const [event, groups] = await Promise.all([this.events.getPublicReport(id), this.groups.getGroups()]);
		if (!event) throw new NotFoundException();

		const coverPhotos = await this.photos.getCoverPhotosByAlbums(event.album ? [event.album.id] : []);

		return this.serializeReport(event, new Map(groups.map((g) => [g.id, g.shortName])), coverPhotos);
	}

	private serializeReport(event: Event, groupNameById: Map<number, string>, coverPhotos: Map<number, Photo>) {
		const titlePhoto = event.album ? coverPhotos.get(event.album.id) : undefined;

		return {
			_id: String(event.id),
			name: event.name,
			type: event.type,
			dateFrom: event.dateFrom,
			dateTill: event.dateTill,
			groups: (event.groupsIds ?? []).map((id) => groupNameById.get(id)).filter((name): name is string => !!name),
			leadersEvent: event.leadersEvent,
			leaders: (event.leaders ?? []).map((member) => ({ _id: String(member.id), nickname: member.nickname })),
			report: event.report,
			reportPublishedAt: event.reportPublishedAt,
			river: event.river,
			waterKm: event.waterKm,
			album: event.album
				? {
						_id: String(event.album.id),
						name: event.album.name,
						titlePhoto: titlePhoto ? this.serializePhoto(titlePhoto) : null,
					}
				: null,
			_links: {
				self: { href: `${this.apiBase}/public/reports/${event.id}`, method: "GET", allowed: { GET: true } },
				album: event.album
					? {
							href: `${this.apiBase}/public/gallery/${event.album.id}`,
							method: "GET",
							allowed: { GET: true },
						}
					: undefined,
			},
		};
	}

	async getGroups() {
		const groups = await this.groups.getPublicGroups();
		return groups.map((group) => this.serializeGroup(group));
	}

	async getGroupLeaderProfilePhotoPath(groupId: number): Promise<string> {
		const groups = await this.groups.getPublicGroups();
		const leader = groups.find((group) => group.id === groupId)?.leader;
		if (!leader?.profilePhotoUpdatedAt) throw new NotFoundException();

		return join(this.config.fs.membersDir, String(leader.id), "profile_photo.jpg");
	}

	private serializeGroup(group: Group) {
		const leader = group.leader;

		return {
			_id: String(group.id),
			shortName: group.shortName,
			name: group.name,
			color: group.color,
			darkColor: group.darkColor,
			children: group.children,
			meetingDay: group.meetingDay,
			leader: leader
				? {
						_id: String(leader.id),
						nickname: leader.nickname,
						firstName: leader.firstName ?? null,
						lastName: leader.lastName ?? null,
						email: leader.email ?? null,
						mobile: leader.mobile ?? null,
						profilePhoto: leader.profilePhotoUpdatedAt
							? `${this.apiBase}/public/groups/${group.id}/leader/profile-photo?v=${leader.profilePhotoUpdatedAt.getTime()}`
							: null,
					}
				: null,
		};
	}

	async getBoardMembers() {
		const boardMembers = await this.boardMembers.getBoardMembers({ contacts: true });
		return boardMembers.map((boardMember) => this.serializeBoardMember(boardMember));
	}

	async getBoardMemberProfilePhotoPath(memberId: number): Promise<string> {
		const boardMembers = await this.boardMembers.getBoardMembers();
		const member = boardMembers.find((boardMember) => boardMember.memberId === memberId)?.member;
		if (!member?.profilePhotoUpdatedAt) throw new NotFoundException();

		return join(this.config.fs.membersDir, String(member.id), "profile_photo.jpg");
	}

	private serializeBoardMember(boardMember: BoardMember) {
		const member = boardMember.member!;

		return {
			_id: String(member.id),
			function: boardMember.function,
			nickname: member.nickname,
			firstName: member.firstName ?? null,
			lastName: member.lastName ?? null,
			email: member.email ?? null,
			mobile: member.mobile ?? null,
			profilePhoto: member.profilePhotoUpdatedAt
				? `${this.apiBase}/public/board-members/${member.id}/profile-photo?v=${member.profilePhotoUpdatedAt.getTime()}`
				: null,
		};
	}

	async getGallery() {
		const albums = await this.albums.getAlbums({ status: [AlbumStatus.public], limit: 1000 });
		const titlePhotoByAlbum = await this.photos.getTitlePhotosByAlbums(albums.map((album) => album.id));
		return albums.map((album) => this.serializeAlbum(album, { titlePhoto: titlePhotoByAlbum.get(album.id) }));
	}

	async getRecentGallery(limit = 5) {
		const albums = await this.albums.getAlbums({
			status: [AlbumStatus.public],
			limit: Math.min(limit, 10),
			sort: "datePublished",
			order: "DESC",
		});

		return Promise.all(albums.map((album) => this.serializeAlbumPreview(album)));
	}

	async getAlbum(id: number) {
		const album = await this.getPublicAlbum(id);

		const [photos, titlePhoto] = await Promise.all([
			this.photos.getPhotos({ album: album.id }),
			this.photos.getTitlePhoto(album.id),
		]);

		return this.serializeAlbum(album, { photos, titlePhoto });
	}

	async getAlbumPreview(id: number) {
		return this.serializeAlbumPreview(await this.getPublicAlbum(id));
	}

	private async getPublicAlbum(id: number) {
		const album = await this.albums.getAlbum(id);
		if (!album || album.status !== AlbumStatus.public) throw new NotFoundException();
		return album;
	}

	private async serializeAlbumPreview(album: Album) {
		const titlePhoto =
			(await this.photos.getTitlePhoto(album.id)) ??
			(await this.photos.getPhotos({ album: album.id, limit: 1 }))[0] ??
			null;
		const previewPhotos = await this.photos.getPreviewPhotos(album.id, {
			excludeId: titlePhoto?.id,
			limit: PREVIEW_PHOTOS_COUNT,
		});

		return {
			...this.serializeAlbumInfo(album),
			titlePhotos: titlePhoto ? [this.serializePreviewPhoto(titlePhoto)] : [],
			previewPhotos: previewPhotos.map((photo) => this.serializePreviewPhoto(photo)),
		};
	}

	private buildTitlePhotos(titlePhoto: Photo | null | undefined, photos: Photo[] | undefined): Photo[] {
		const list: Photo[] = [];
		if (titlePhoto) list.push(titlePhoto);

		for (const photo of photos ?? []) {
			if (list.length >= 3) break;
			if (!list.some((item) => item.id === photo.id)) list.push(photo);
		}

		return list;
	}

	private serializeAlbum(
		album: { id: number; [k: string]: any },
		{ photos, titlePhoto }: { photos?: Photo[]; titlePhoto?: Photo | null } = {},
	) {
		const serializedPhotos = photos?.map((photo) => this.serializePhoto(photo));
		const serializedTitlePhotos = this.buildTitlePhotos(titlePhoto, photos).map((photo) =>
			this.serializePhoto(photo),
		);

		return {
			...this.serializeAlbumInfo(album),
			titlePhotos: serializedTitlePhotos,
			photos: serializedPhotos,
		};
	}

	private serializeAlbumInfo(album: { id: number; [k: string]: any }) {
		return {
			_id: String(album.id),
			year: album.dateFrom ? new Date(album.dateFrom).getFullYear() : undefined,
			status: album.status,
			name: album.name,
			description: album.description ?? null,
			datePublished: album.datePublished ?? null,
			dateFrom: album.dateFrom ?? null,
			dateTill: album.dateTill ?? null,
			_links: {
				self: { href: `${this.apiBase}/public/gallery/${album.id}`, method: "GET", allowed: { GET: true } },
				download: {
					href: `${this.apiBase}/public/gallery/${album.id}/download`,
					method: "GET",
					allowed: { GET: true },
				},
			},
		};
	}

	private serializePhoto(photo: Photo) {
		const base = `${this.apiBase}/public/photos/${photo.id}/image`;

		return {
			_id: String(photo.id),
			album: String(photo.albumId),
			name: photo.name,
			caption: photo.caption ?? null,
			width: photo.width,
			height: photo.height,
			bg: photo.bg ?? null,
			tags: photo.tags ?? [],
			date: photo.timestamp,
			sizes: {
				original: { url: `${base}/original`, ...this.scaledSize(photo, null) },
				big: { url: `${base}/big`, ...this.scaledSize(photo, this.config.photos.sizes.big) },
				small: { url: `${base}/small`, ...this.scaledSize(photo, this.config.photos.sizes.small) },
			},
		};
	}

	private serializePreviewPhoto(photo: Photo) {
		return {
			_id: String(photo.id),
			bg: photo.bg ?? null,
			sizes: {
				small: {
					url: `${this.apiBase}/public/photos/${photo.id}/image/small`,
					...this.scaledSize(photo, this.config.photos.sizes.small),
				},
			},
		};
	}

	private scaledSize(photo: Photo, max: { width: number; height: number } | null) {
		if (!photo.width || !photo.height) {
			return { width: max?.width ?? null, height: max?.height ?? null };
		}
		if (!max) return { width: photo.width, height: photo.height };

		const scale = Math.min(max.width / photo.width, max.height / photo.height, 1);
		return { width: Math.round(photo.width * scale), height: Math.round(photo.height * scale) };
	}
}
