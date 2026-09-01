import { Controller, Delete, HttpCode, NotFoundException, Param, ParseIntPipe, Put, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { AlbumsRepository } from "src/models/albums/repositories/albums.repository";
import { EventsRepository } from "src/models/events/repositories/events.repository";
import { EventAlbumSetPermission, EventAlbumUnsetPermission } from "../acl/events.acl";

@Controller("events")
@Authenticated()
@AcController()
@ApiTags("Events")
export class EventsAlbumsController {
	constructor(
		private events: EventsRepository,
		private albums: AlbumsRepository,
	) {}

	@Put(":eventId/album/:albumId")
	@HttpCode(204)
	@AcLinks(EventAlbumSetPermission)
	@ApiResponse({ status: 204 })
	async setEventAlbum(
		@Req() req: Request,
		@Param("eventId", ParseIntPipe) eventId: number,
		@Param("albumId", ParseIntPipe) albumId: number,
	): Promise<void> {
		const event = await this.events.getEvent(eventId);
		if (!event) throw new NotFoundException();

		EventAlbumSetPermission.canOrThrow(req, event);

		const album = await this.albums.getAlbum(albumId);
		if (!album) throw new NotFoundException();

		await this.albums.updateAlbum(albumId, { eventId });
	}

	@Delete(":eventId/album/:albumId")
	@HttpCode(204)
	@AcLinks(EventAlbumUnsetPermission)
	@ApiResponse({ status: 204 })
	async unsetEventAlbum(
		@Req() req: Request,
		@Param("eventId", ParseIntPipe) eventId: number,
		@Param("albumId", ParseIntPipe) albumId: number,
	): Promise<void> {
		const event = await this.events.getEvent(eventId);
		if (!event) throw new NotFoundException();

		EventAlbumUnsetPermission.canOrThrow(req, event);

		const album = await this.albums.getAlbum(albumId);
		if (!album || album.eventId !== eventId) throw new NotFoundException();

		await this.albums.updateAlbum(albumId, { eventId: null });
	}
}
