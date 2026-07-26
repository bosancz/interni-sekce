import { Command, CommandRunner } from "nest-commander";
import { AlbumsMetadataService } from "../services/albums-metadata.service";

@Command({
	name: "clean-album-metadata",
	arguments: "",
	options: {},
})
export class CleanAlbumsMetadataCommand extends CommandRunner {
	constructor(private albumsMetadata: AlbumsMetadataService) {
		super();
	}

	async run(inputs: string[], options: Record<string, any>): Promise<void> {
		return this.albumsMetadata.cleanAlbumsMetadata();
	}
}
