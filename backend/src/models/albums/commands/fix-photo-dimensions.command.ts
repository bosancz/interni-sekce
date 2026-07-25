import { Command, CommandRunner } from "nest-commander";
import { PhotosMaintenanceService } from "../services/photos-maintenance.service";

@Command({
	name: "fix-photo-dimensions",
	arguments: "",
	options: {},
})
export class FixPhotoDimensionsCommand extends CommandRunner {
	constructor(private photosMaintenance: PhotosMaintenanceService) {
		super();
	}

	async run(inputs: string[], options: Record<string, any>): Promise<void> {
		return this.photosMaintenance.fixTransposedDimensions();
	}
}
