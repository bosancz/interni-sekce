import {
	BadRequestException,
	Controller,
	Delete,
	Get,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
	Param,
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

	/** Replaces any existing "prihlaska" file for the event with the given PDF and flags the event. */
	private async storeRegistration(event: Event, data: Buffer): Promise<void> {
		const registrationFolder = path.join(this.config.fs.eventsDir, event.id.toString());
		const registrationFileName = "prihlaska_" + sanitizeFilename(event.name) + ".pdf";
		const registrationPath = path.join(registrationFolder, registrationFileName);

		try {
			await this.fileService.ensureDir(registrationFolder);
			await this.fileService.deleteFilesByPrefix(registrationFolder, "prihlaska");
			await this.fileService.saveFile(registrationPath, data);
		} catch (err) {
			throw new InternalServerErrorException("Failed to save registration");
		}

		event.hasRegistration = true;
		await this.eventsRepository.save(event);
	}

	@Get(":id/registration")
	@AcLinks(EventRegistrationReadPermission)
	async getEventRegistration(@Req() req: Request, @Param("id") id: number, @Res() res: Response): Promise<void> {
		const event = await this.events.getEvent(id);
		if (!event) throw new NotFoundException();
		EventRegistrationReadPermission.canOrThrow(req, event);

		const registrationFolder = path.join(this.config.fs.eventsDir, event.id.toString());

		let matchingFiles: string[];
		try {
			matchingFiles = await this.fileService.getFilesByPrefx(registrationFolder, "prihlaska");
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
		@Param("id") id: number,
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
	async getEventRegistrationTemplates(@Req() req: Request, @Param("id") id: number): Promise<RegistrationTemplateResponse[]> {
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
	async generateEventRegistration(
		@Req() req: Request,
		@Param("id") id: number,
		@Query("template") template: string,
	): Promise<void> {
		// Load attendees with member contacts so the generated form can list organisers and their contacts.
		const event = await this.eventsRepository.findOne({
			where: { id },
			relations: ["attendees", "attendees.member", "attendees.member.contacts"],
		});
		if (!event) throw new NotFoundException();

		EventRegistrationGeneratePermission.canOrThrow(req, event);

		const data = await this.eventRegistrationService.generateRegistration(event, template);
		await this.storeRegistration(event, data);
	}

	@Delete(":id/registration")
	@AcLinks(EventRegistrationDeletePermission)
	async deleteEventRegistration(@Req() req: Request, @Param("id") id: number): Promise<void> {
		const event = await this.events.getEvent(id);
		if (!event) throw new NotFoundException();
		EventRegistrationDeletePermission.canOrThrow(req, event);
		const registrationFolder = path.join(this.config.fs.eventsDir, event.id.toString())
						
		await this.fileService.deleteFilesByPrefix(registrationFolder, "prihlaska")
		event.hasRegistration = false;
		await this.eventsRepository.save(event);

	}
}
