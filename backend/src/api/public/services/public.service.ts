import { Injectable, NotFoundException } from "@nestjs/common";
import { Config } from "src/config";
import { AlbumStatus } from "src/models/albums/entities/album.entity";
import { Photo } from "src/models/albums/entities/photo.entity";
import { AlbumsRepository } from "src/models/albums/repositories/albums.repository";
import { PhotosRepository } from "src/models/albums/repositories/photos.repository";
import { Event } from "src/models/events/entities/event.entity";
import { EventsRepository } from "src/models/events/repositories/events.repository";
import { GroupsRepository } from "src/models/members/repositories/groups.repository";

/**
 * Builds the legacy (routesjs-era) response shapes the bosan.cz website expects:
 * string `_id`s, photo `sizes` objects with URLs, and `_links` with `{id}`-style hrefs.
 * This is deliberately decoupled from the internal AC-lib response format.
 */
@Injectable()
export class PublicService {
	constructor(
		private readonly config: Config,
		private readonly events: EventsRepository,
		private readonly albums: AlbumsRepository,
		private readonly photos: PhotosRepository,
		private readonly groups: GroupsRepository,
	) {}

	private get apiBase() {
		return `${this.config.app.baseUrl}/api`;
	}

	// ---- Program (events) ----

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

	// ---- Gallery (albums / photos) ----

	async getGallery() {
		const albums = await this.albums.getAlbums({ status: AlbumStatus.public, limit: 1000 });
		return albums.map((album) => this.serializeAlbum(album));
	}

	async getRecentGallery(limit = 5) {
		const albums = await this.albums.getAlbums({
			status: AlbumStatus.public,
			limit: Math.min(limit, 10),
		});

		return Promise.all(
			albums.map(async (album) => {
				const photos = await this.photos.getPhotos({ album: album.id, limit: 3 });
				return this.serializeAlbum(album, photos);
			}),
		);
	}

	async getAlbum(id: number, options: { preview?: boolean } = {}) {
		const album = await this.albums.getAlbum(id);
		if (!album || album.status !== AlbumStatus.public) throw new NotFoundException();

		const photos = await this.photos.getPhotos({
			album: album.id,
			limit: options.preview ? 3 : undefined,
		});

		return this.serializeAlbum(album, photos);
	}

	private serializeAlbum(album: { id: number; [k: string]: any }, photos?: Photo[]) {
		const serializedPhotos = photos?.map((photo) => this.serializePhoto(photo));
		const titlePhotos = serializedPhotos?.slice(0, 3) ?? [];

		return {
			_id: String(album.id),
			year: album.dateFrom ? new Date(album.dateFrom).getFullYear() : undefined,
			status: album.status,
			name: album.name,
			description: album.description ?? null,
			datePublished: album.datePublished ?? null,
			dateFrom: album.dateFrom ?? null,
			dateTill: album.dateTill ?? null,
			titlePhotos,
			photos: serializedPhotos,
			_links: {
				self: { href: `${this.apiBase}/public/gallery/${album.id}`, method: "GET", allowed: { GET: true } },
				// bosan.cz always renders the album download link, so the href must exist even
				// though the ZIP endpoint is not implemented yet (see PublicController.downloadAlbum).
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

	/** Compute the on-screen dimensions of a resized variant (fit: inside, never upscales). */
	private scaledSize(photo: Photo, max: { width: number; height: number } | null) {
		if (!photo.width || !photo.height) {
			return { width: max?.width ?? null, height: max?.height ?? null };
		}
		if (!max) return { width: photo.width, height: photo.height };

		const scale = Math.min(max.width / photo.width, max.height / photo.height, 1);
		return { width: Math.round(photo.width * scale), height: Math.round(photo.height * scale) };
	}
}
