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
	StreamableFile,
	UploadedFile,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { RegistrationTemplateResponse } from "../dto/registration-template.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Request, Response } from "express";
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
import * as path from "path";
import { readFile, unlink } from "fs/promises";
import { contentDispositionFilename, sanitizeFilename } from "../../../helpers/sanitizefilename";

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

	private registrationFolder(event: Event): string {
		return path.join(this.config.fs.eventsDir, event.srcId ?? event.id.toString());
	}

	private async deleteRegistrationFiles(registrationFolder: string): Promise<void> {
		await this.fileService.deleteFilesByPrefix(registrationFolder, "prihlaska");
		await this.fileService.deleteFilesByPrefix(registrationFolder, "registration");
	}

	private registrationFileName(event: Event): string {
		return "prihlaska_" + sanitizeFilename(event.name) + ".pdf";
	}

	private async storeRegistration(event: Event, data: Buffer): Promise<void> {
		const registrationFolder = this.registrationFolder(event);
		const registrationPath = path.join(registrationFolder, this.registrationFileName(event));

		try {
			await this.fileService.ensureDir(registrationFolder);
			await this.deleteRegistrationFiles(registrationFolder);
			await this.fileService.saveFile(registrationPath, data);
		} catch (err) {
			throw new InternalServerErrorException("Failed to save registration");
		}

		event.hasRegistration = true;
		await this.eventsRepository.update(event.id, { hasRegistration: true });
	}

	@Get(":eventId/registration")
	@AcLinks(EventRegistrationReadPermission)
	async getEventRegistration(
		@Req() req: Request,
		@Param("eventId", ParseIntPipe) eventId: number,
		@Res() res: Response,
	): Promise<void> {
		const event = await this.events.getEvent(eventId);
		if (!event) throw new NotFoundException();
		EventRegistrationReadPermission.canOrThrow(req, event);

		const registrationFolder = this.registrationFolder(event);

		let matchingFiles: string[];
		try {
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
			res.sendFile(registrationPath, (err) =>
				err ? reject(new InternalServerErrorException(err.message)) : resolve(),
			);
		});
	}

	@Put(":eventId/registration")
	@HttpCode(204)
	@AcLinks(EventRegistrationEditPermission)
	@ApiResponse({ status: 204 })
	@UseInterceptors(FileInterceptor("registration", { dest: "./uploads_temp" }))
	@ApiConsumes("multipart/form-data")
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
		@Param("eventId", ParseIntPipe) eventId: number,
		@UploadedFile() registration: Express.Multer.File,
	): Promise<void> {
		const event = await this.events.getEvent(eventId);
		if (!event) throw new NotFoundException();

		EventRegistrationEditPermission.canOrThrow(req, event);
		if (!registration) throw new BadRequestException("Registration not provided");

		let data: Buffer;
		try {
			data = await readFile(registration.path);
		} finally {
			await unlink(registration.path).catch(() => undefined);
		}

		await this.storeRegistration(event, data);
	}

	@Get(":eventId/registration/templates")
	@AcLinks(EventRegistrationGeneratePermission)
	@ApiResponse({ status: 200, type: [RegistrationTemplateResponse] })
	async getEventRegistrationTemplates(
		@Req() req: Request,
		@Param("eventId", ParseIntPipe) eventId: number,
	): Promise<RegistrationTemplateResponse[]> {
		const event = await this.events.getEvent(eventId);
		if (!event) throw new NotFoundException();

		EventRegistrationGeneratePermission.canOrThrow(req, event);

		return this.eventRegistrationService.listTemplates();
	}

	@Post(":eventId/registration/generate")
	@HttpCode(200)
	@AcLinks(EventRegistrationGeneratePermission)
	@ApiResponse({ status: 200 })
	@ApiQuery({ name: "template", required: true })
	@ApiQuery({ name: "color", required: true })
	@ApiQuery({ name: "note", required: false })
	async generateEventRegistration(
		@Req() req: Request,
		@Param("eventId", ParseIntPipe) eventId: number,
		@Query("template") template: string,
		@Query("color") color: string,
		@Res({ passthrough: true }) res: Response,
		@Query("note") note?: string,
	): Promise<StreamableFile> {
		const event = await this.eventsRepository.findOne({
			where: { id: eventId },
			relations: { attendees: { member: { contacts: true } } },
		});
		if (!event) throw new NotFoundException();

		EventRegistrationGeneratePermission.canOrThrow(req, event);

		const data = await this.eventRegistrationService.generateRegistration(event, template, color, note);

		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", `inline; ${contentDispositionFilename(this.registrationFileName(event))}`);
		res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

		return new StreamableFile(data);
	}

	@Delete(":eventId/registration")
	@AcLinks(EventRegistrationDeletePermission)
	async deleteEventRegistration(@Req() req: Request, @Param("eventId", ParseIntPipe) eventId: number): Promise<void> {
		const event = await this.events.getEvent(eventId);
		if (!event) throw new NotFoundException();
		EventRegistrationDeletePermission.canOrThrow(req, event);
		const registrationFolder = this.registrationFolder(event);

		await this.deleteRegistrationFiles(registrationFolder);
		event.hasRegistration = false;
		await this.eventsRepository.update(event.id, { hasRegistration: false });
	}
}
