import { Command, CommandRunner, Option } from "nest-commander";
import { FacesDetectionService } from "../services/faces-detection.service";

@Command({
	name: "faces-enqueue",
	description: "Queue the newest photos without detected faces for the worker",
})
export class FacesEnqueueCommand extends CommandRunner {
	constructor(private facesDetectionService: FacesDetectionService) {
		super();
	}

	async run(inputs: string[], options: { limit?: number }): Promise<void> {
		await this.facesDetectionService.enqueueBatch(options.limit);
	}

	@Option({ flags: "-l, --limit <limit>", description: "How many photos to queue" })
	parseLimit(value: string) {
		return parseInt(value, 10);
	}
}
