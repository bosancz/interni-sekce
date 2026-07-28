import { Command, CommandRunner, Option } from "nest-commander";
import { MongoImportService } from "../services/mongo-import.service";

interface ImportTitlePhotosOptions {
	overwrite?: boolean;
}

/**
 * Imports only the album title-photo selection from Mongo and maps it onto the existing Postgres
 * data (via `photos.srcId`), without a full reimport — for when the data is already live and edited.
 */
@Command({
	name: "mongo-import-title-photos",
	arguments: "",
	description: "Backfill album title photos from Mongo onto existing data (no full reimport).",
})
export class ImportTitlePhotosCommand extends CommandRunner {
	constructor(private mongoImportService: MongoImportService) {
		super();
	}

	@Option({
		flags: "-o, --overwrite",
		description: "Also replace title photos on albums that already have a selection (default: skip them).",
	})
	parseOverwrite(): boolean {
		return true;
	}

	async run(inputs: string[], options: ImportTitlePhotosOptions): Promise<void> {
		await this.mongoImportService.importTitlePhotosOnly({ overwrite: !!options.overwrite });
	}
}
