import { Command, CommandRunner } from "nest-commander";
import { PhotoFacesMatchingService } from "../services/photo-faces-matching.service";

@Command({
	name: "faces-match",
	description: "Assign unassigned faces to members by comparing them with manually assigned faces",
})
export class FacesMatchCommand extends CommandRunner {
	constructor(private photoFacesMatchingService: PhotoFacesMatchingService) {
		super();
	}

	async run(): Promise<void> {
		await this.photoFacesMatchingService.matchAll();
	}
}
