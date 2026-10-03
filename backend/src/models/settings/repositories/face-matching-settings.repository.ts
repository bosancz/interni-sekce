import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FaceMatchingSettings } from "../entities/face-matching-settings.entity";

@Injectable()
export class FaceMatchingSettingsRepository {
	constructor(
		@InjectRepository(FaceMatchingSettings)
		private faceMatchingSettingsRepository: Repository<FaceMatchingSettings>,
	) {}

	async getFaceMatchingSettings(): Promise<FaceMatchingSettings | null> {
		return this.faceMatchingSettingsRepository.findOne({ where: {}, order: { id: "ASC" } });
	}

	async updateFaceMatchingSettings(data: Partial<Omit<FaceMatchingSettings, "id">>): Promise<FaceMatchingSettings> {
		const settings = await this.getFaceMatchingSettings();

		return this.faceMatchingSettingsRepository.save({ ...settings, ...data });
	}
}
