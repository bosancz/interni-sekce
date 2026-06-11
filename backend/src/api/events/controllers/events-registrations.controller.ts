import {
	BadRequestException,
	Controller,
	Delete,
	Get,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
	Param,
	Put,
	Req,
	Res,
	UploadedFile,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Request, Response} from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Event } from "src/models/events/entities/event.entity";
import { EventsRepository } from "src/models/events/repositories/events.repository";
import { Repository } from "typeorm";
import {
	EventRegistrationDeletePermission,
	EventRegistrationEditPermission,
	EventRegistrationReadPermission,
} from "../acl/events.acl";
import { FilesService } from "../../../models/files/services/files.service";
import { Config } from "src/config";
import * as path from 'path';
import {sanitizeFilename} from '../../../helpers/sanitizefilename'


@Controller("events")
@AcController()
@ApiTags("Events")
export class EventsRegistrationsController {
	constructor(
		private events: EventsRepository,
		private fileService: FilesService,
		private config: Config,
		@InjectRepository(Event) private eventsRepository: Repository<Event>,
	) {}

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
				
				const registrationFolder = path.join(this.config.fs.eventsDir, event.id.toString())
				const registrationFileName = "prihlaska_" +  sanitizeFilename(event.name) + ".pdf"
				const registrationPath = path.join(registrationFolder, registrationFileName)
			try{
				await this.fileService.ensureDir(registrationFolder)
				await this.fileService.deleteFilesByPrefix(registrationFolder, "prihlaska")
			
			await this.fileService.moveFile(registration.path, registrationPath)
			}
			catch(err){
				throw new InternalServerErrorException("Failed to save registration")
			}
			event.hasRegistration = true;
			await this.eventsRepository.save(event);
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
