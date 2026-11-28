import { Controller, Get, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { PhotosRepository } from "src/models/albums/repositories/photos.repository";
import { EventsRepository } from "src/models/events/repositories/events.repository";
import { CampsListPermission } from "../acl/events.acl";
import { CampResponse } from "../dto/event.dto";

@Controller("camps")
@Authenticated()
@AcController()
@ApiTags("Events")
export class CampsController {
	constructor(
		private events: EventsRepository,
		private photos: PhotosRepository,
	) {}

	@Get()
	@AcLinks(CampsListPermission)
	@ApiResponse({ status: 200, type: WithLinks(CampResponse), isArray: true })
	async listCamps(@Req() req: Request): Promise<CampResponse[]> {
		const where = CampsListPermission.canWhere(req, "events");

		const camps = await this.events.getCamps(where);
		const counts = await this.events.getEventsAttendeeCounts(camps.map((camp) => camp.id));
		const coverPhotos = await this.photos.getCoverPhotosByAlbums(
			camps.flatMap((camp) => (camp.album ? [camp.album.id] : [])),
		);

		return camps.map((camp) => ({
			...camp,
			attendeesCount: counts.get(camp.id)?.attendees ?? 0,
			childrenCount: counts.get(camp.id)?.children ?? 0,
			album: camp.album ? { ...camp.album, coverPhoto: coverPhotos.get(camp.album.id) } : undefined,
		}));
	}
}
