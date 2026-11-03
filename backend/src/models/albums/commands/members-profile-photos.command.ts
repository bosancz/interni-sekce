import { Command, CommandRunner, Option } from "nest-commander";
import { MemberProfilePhotoService } from "../services/member-profile-photo.service";

@Command({
	name: "members-profile-photos",
	description: "Regenerate members' profile photos from their source faces (profilePhotoFaceId)",
})
export class MembersProfilePhotosCommand extends CommandRunner {
	constructor(private memberProfilePhotoService: MemberProfilePhotoService) {
		super();
	}

	async run(inputs: string[], options: { missing?: boolean }): Promise<void> {
		await this.memberProfilePhotoService.regenerateAll({ missingOnly: options.missing });
	}

	@Option({ flags: "--missing", description: "Only generate photos whose file is missing" })
	parseMissing(): boolean {
		return true;
	}
}
