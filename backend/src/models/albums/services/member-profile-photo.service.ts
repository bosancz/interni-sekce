import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { join } from "path";
import { PhotoSizes } from "src/api/albums/dto/photo.dto";
import { Config } from "src/config";
import { FilesService } from "src/models/files/services/files.service";
import { Member } from "src/models/members/entities/member.entity";
import { IsNull, Not, Repository } from "typeorm";
import { PhotoFace } from "../entities/photo-face.entity";
import { PhotosFilesService } from "./photos-files.service";

@Injectable()
export class MemberProfilePhotoService {
	private logger = new Logger(MemberProfilePhotoService.name);

	constructor(
		@InjectRepository(Member) private members: Repository<Member>,
		private photosFilesService: PhotosFilesService,
		private filesService: FilesService,
		private config: Config,
	) {}

	getProfilePhotoPath(memberId: Member["id"]) {
		return join(this.config.fs.membersDir, String(memberId), "profile_photo.jpg");
	}

	async saveProfilePhoto(memberId: Member["id"], face: PhotoFace & { photo: NonNullable<PhotoFace["photo"]> }) {
		const image = await this.photosFilesService.cropFace(face.photo, face, {
			size: this.config.photos.profilePhoto.size,
			padding: this.config.photos.profilePhoto.padding,
			sizes: [PhotoSizes.original, PhotoSizes.big],
		});
		await this.filesService.saveFile(this.getProfilePhotoPath(memberId), image);
	}

	async regenerateAll(options: { missingOnly?: boolean } = {}) {
		const members = await this.members.find({
			where: { profilePhotoUpdatedAt: Not(IsNull()) },
			relations: { profilePhotoFace: { photo: true } },
			withDeleted: true,
			order: { id: "ASC" },
		});

		let generated = 0;
		let skipped = 0;
		let failed = 0;

		for (const member of members) {
			const path = this.getProfilePhotoPath(member.id);

			if (
				options.missingOnly &&
				(await this.filesService.fileAccessible(path).then(
					() => true,
					() => false,
				))
			) {
				skipped++;
				continue;
			}

			const face = member.profilePhotoFace;
			if (!face?.photo) {
				this.logger.warn(
					`Member ${member.id}: source face ${member.profilePhotoFaceId ?? "-"} not found, skipping.`,
				);
				failed++;
				continue;
			}

			try {
				await this.saveProfilePhoto(member.id, { ...face, photo: face.photo });
				generated++;
			} catch (err) {
				this.logger.warn(
					`Member ${member.id}: failed to crop face ${face.id}: ${err instanceof Error ? err.message : err}`,
				);
				failed++;
			}
		}

		this.logger.log(
			`Profile photos: ${generated} generated, ${skipped} kept, ${failed} failed of ${members.length}.`,
		);

		return { generated, skipped, failed, total: members.length };
	}
}
