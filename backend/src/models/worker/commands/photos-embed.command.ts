import { Command, CommandRunner, Option } from "nest-commander";
import { PhotoContentService } from "../services/photo-content.service";

@Command({
	name: "photos-embed",
	description: "Queue the newest photos without a content embedding for the worker",
})
export class PhotosEmbedCommand extends CommandRunner {
	constructor(private photoContentService: PhotoContentService) {
		super();
	}

	async run(inputs: string[], options: { limit?: number }): Promise<void> {
		await this.photoContentService.enqueueBatch(options.limit);
	}

	@Option({ flags: "-l, --limit <limit>", description: "How many photos to queue" })
	parseLimit(value: string) {
		return parseInt(value, 10);
	}
}
