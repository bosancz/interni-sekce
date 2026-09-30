import { MigrationInterface, QueryRunner } from "typeorm";

export class PhotoFacesEmotions1790776471336 implements MigrationInterface {
	name = "PhotoFacesEmotions1790776471336";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "photo_faces" ADD "emotions" jsonb`);
		await queryRunner.query(`ALTER TABLE "photo_faces" ADD "emotion" character varying`);
		await queryRunner.query(
			`UPDATE "photos" SET "faces_detected_at" = NULL, "faces_error" = NULL WHERE "faces_detected_at" IS NOT NULL`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "photo_faces" DROP COLUMN "emotion"`);
		await queryRunner.query(`ALTER TABLE "photo_faces" DROP COLUMN "emotions"`);
	}
}
