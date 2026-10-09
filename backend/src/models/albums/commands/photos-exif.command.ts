import { Command, CommandRunner, Option } from "nest-commander";
import { PhotosMaintenanceService } from "../services/photos-maintenance.service";

@Command({
	name: "photos-exif",
	description: "Read and store EXIF of photos that do not have it stored yet",
})
export class PhotosExifCommand extends CommandRunner {
	constructor(private photosMaintenance: PhotosMaintenanceService) {
		super();
	}

	async run(inputs: string[], options: { all?: boolean }): Promise<void> {
		await this.photosMaintenance.loadExif({ all: options.all });
	}

	@Option({ flags: "-a, --all", description: "Read EXIF of all photos again, including the stored ones" })
	parseAll() {
		return true;
	}
}
