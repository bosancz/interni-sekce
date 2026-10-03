import { MigrationInterface, QueryRunner } from "typeorm";

export class FaceMatchingSettings1791043936598 implements MigrationInterface {
	name = "FaceMatchingSettings1791043936598";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "face_matching_settings" ("id" SERIAL NOT NULL, "threshold" real NOT NULL DEFAULT '0.5', CONSTRAINT "PK_b3f3109c40a93c61c02e9ac6a5e" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(`INSERT INTO "face_matching_settings" DEFAULT VALUES`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE "face_matching_settings"`);
	}
}
