import { Command, CommandRunner, Option } from "nest-commander";
import { PhotoThumbnailsService } from "../services/photo-thumbnails.service";

@Command({
	name: "photos-thumbnails",
	description: "Create missing photo thumbnails in the worker, or in place when no worker creates them",
})
export class PhotosThumbnailsCommand extends CommandRunner {
	constructor(private photoThumbnailsService: PhotoThumbnailsService) {
		super();
	}

	async run(inputs: string[], options: { limit?: number }): Promise<void> {
		await this.photoThumbnailsService.enqueueBatch(options.limit);
	}

	@Option({ flags: "-l, --limit <limit>", description: "How many photos to process" })
	parseLimit(value: string) {
		return parseInt(value, 10);
	}
}
