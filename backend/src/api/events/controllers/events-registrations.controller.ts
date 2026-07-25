import {
	BadRequestException,
	Controller,
	Delete,
	Get,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
	Param,
	ParseIntPipe,
	Post,
	Put,
	Query,
	Req,
	Res,
	UploadedFile,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { RegistrationTemplateResponse } from "../dto/registration-template.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Request, Response} from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { Event } from "src/models/events/entities/event.entity";
import { EventsRepository } from "src/models/events/repositories/events.repository";
import { EventRegistrationService } from "src/models/events/services/event-registration.service";
import { Repository } from "typeorm";
import {
	EventRegistrationDeletePermission,
	EventRegistrationEditPermission,
	EventRegistrationGeneratePermission,
	EventRegistrationReadPermission,
} from "../acl/events.acl";
import { FilesService } from "../../../models/files/services/files.service";
import { Config } from "src/config";
import * as path from 'path';
import { readFile, unlink } from "fs/promises";
import {sanitizeFilename} from '../../../helpers/sanitizefilename'


@Controller("events")
@Authenticated()
@AcController()
@ApiTags("Events")
export class EventsRegistrationsController {
	constructor(
		private events: EventsRepository,
		private fileService: FilesService,
		private config: Config,
		private eventRegistrationService: EventRegistrationService,
		@InjectRepository(Event) private eventsRepository: Repository<Event>,
	) {}

	/**
	 * On-disk folder holding the event's registration PDF. Events imported from the old server keep
	 * their legacy Mongo ObjectId in `srcId`, and their files live in a folder keyed by that ObjectId
	 * (named `registration.pdf`); natively-created events use the numeric-id folder (with a
	 * `prihlaska_<name>.pdf` file). Coalescing on `srcId` lets both resolve without moving files —
	 * mirrors how Photo.srcId is used to serve legacy images. See getEventRegistration for the
	 * matching legacy vs. new filename handling.
	 */
	private registrationFolder(event: Event): string {
		return path.join(this.config.fs.eventsDir, event.srcId ?? event.id.toString());
	}

	/** Removes any existing registration PDF (new `prihlaska*` or legacy `registration*`) for the event. */
	private async deleteRegistrationFiles(registrationFolder: string): Promise<void> {
		await this.fileService.deleteFilesByPrefix(registrationFolder, "prihlaska");
		await this.fileService.deleteFilesByPrefix(registrationFolder, "registration");
	}

	/** Replaces any existing "prihlaska" file for the event with the given PDF and flags the event. */
	private async storeRegistration(event: Event, data: Buffer): Promise<void> {
		const registrationFolder = this.registrationFolder(event);
		const registrationFileName = "prihlaska_" + sanitizeFilename(event.name) + ".pdf";
		const registrationPath = path.join(registrationFolder, registrationFileName);

		try {
			await this.fileService.ensureDir(registrationFolder);
			await this.deleteRegistrationFiles(registrationFolder);
			await this.fileService.saveFile(registrationPath, data);
		} catch (err) {
			throw new InternalServerErrorException("Failed to save registration");
		}

		// update(), not save(): the events loaded here carry a hand-attached `attendees` array whose
		// `event` relation is not populated, and save() cascades that into events_attendees, nulling
		// its event_id. Only the flag needs writing anyway.
		event.hasRegistration = true;
		await this.eventsRepository.update(event.id, { hasRegistration: true });
	}

	@Get(":id/registration")
	@AcLinks(EventRegistrationReadPermission)
	async getEventRegistration(@Req() req: Request, @Param("id", ParseIntPipe) id: number, @Res() res: Response): Promise<void> {
		const event = await this.events.getEvent(id);
		if (!event) throw new NotFoundException();
		EventRegistrationReadPermission.canOrThrow(req, event);

		const registrationFolder = this.registrationFolder(event);

		let matchingFiles: string[];
		try {
			// New uploads/generations are named `prihlaska_<name>.pdf`; legacy imported events keep the
			// old `registration.pdf`. Prefer the new file, fall back to the legacy one.
			matchingFiles = await this.fileService.getFilesByPrefx(registrationFolder, "prihlaska");
			if (matchingFiles.length === 0) {
				matchingFiles = await this.fileService.getFilesByPrefx(registrationFolder, "registration");
			}
		} catch {
			throw new NotFoundException("Registration not found");
		}

		if (matchingFiles.length !== 1) {
			throw new NotFoundException("Registration not found");
		}

		const registrationPath = path.join(registrationFolder, matchingFiles[0]);

		await new Promise<void>((resolve, reject) => {
			res.sendFile(registrationPath, (err) => (err ? reject(new InternalServerErrorException(err.message)) : resolve()));
		});
	}


	@Put(":id/registration")
	@HttpCode(204)
	@AcLinks(EventRegistrationEditPermission)
	@ApiResponse({ status: 204 })
	@UseInterceptors(FileInterceptor("registration", { dest: './uploads_temp' }))
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		schema: {
			type: "object",
			properties: {
				registration: {
					type: "string",
					format: "binary",
				},
			},
		},
	})
	async saveEventRegistration(
		@Req() req: Request,
		@Param("id", ParseIntPipe) id: number,
		@UploadedFile() registration: Express.Multer.File): Promise<void> {
			const event = await this.events.getEvent(id);
			if (!event) throw new NotFoundException();

			EventRegistrationEditPermission.canOrThrow(req, event);
			if (!registration) throw new BadRequestException("Registration not provided")

			let data: Buffer;
			try {
				data = await readFile(registration.path);
			} finally {
				await unlink(registration.path).catch(() => undefined);
			}

			await this.storeRegistration(event, data);
		}

	@Get(":id/registration/templates")
	@AcLinks(EventRegistrationGeneratePermission)
	@ApiResponse({ status: 200, type: [RegistrationTemplateResponse] })
	async getEventRegistrationTemplates(@Req() req: Request, @Param("id", ParseIntPipe) id: number): Promise<RegistrationTemplateResponse[]> {
		const event = await this.events.getEvent(id);
		if (!event) throw new NotFoundException();

		EventRegistrationGeneratePermission.canOrThrow(req, event);

		return this.eventRegistrationService.listTemplates();
	}

	@Post(":id/registration/generate")
	@HttpCode(204)
	@AcLinks(EventRegistrationGeneratePermission)
	@ApiResponse({ status: 204 })
	@ApiQuery({ name: "template", required: true })
	@ApiQuery({ name: "color", required: true })
	@ApiQuery({ name: "note", required: false })
	async generateEventRegistration(
		@Req() req: Request,
		@Param("id", ParseIntPipe) id: number,
		@Query("template") template: string,
		@Query("color") color: string,
		@Query("note") note?: string,
	): Promise<void> {
		// Load attendees with member contacts so the generated form can list organisers and their contacts.
		const event = await this.eventsRepository.findOne({
			where: { id },
			relations: { attendees: { member: { contacts: true } } },
		});
		if (!event) throw new NotFoundException();

		EventRegistrationGeneratePermission.canOrThrow(req, event);

		const data = await this.eventRegistrationService.generateRegistration(event, template, color, note);
		await this.storeRegistration(event, data);
	}

	@Delete(":id/registration")
	@AcLinks(EventRegistrationDeletePermission)
	async deleteEventRegistration(@Req() req: Request, @Param("id", ParseIntPipe) id: number): Promise<void> {
		const event = await this.events.getEvent(id);
		if (!event) throw new NotFoundException();
		EventRegistrationDeletePermission.canOrThrow(req, event);
		const registrationFolder = this.registrationFolder(event);

		await this.deleteRegistrationFiles(registrationFolder);
		event.hasRegistration = false;
		await this.eventsRepository.update(event.id, { hasRegistration: false });

	}
}
